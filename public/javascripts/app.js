var app = angular.module('myApp', ['ngRoute']);

app.config(['$routeProvider', '$locationProvider', '$httpProvider',
  function ($routeProvider, $locationProvider, $httpProvider) {

    $locationProvider.html5Mode(true);

    $routeProvider.
    when('/login', {
      templateUrl: 'views/login.html',
      controller: 'loginCtrl'
    }).
    when('/register', {
      templateUrl: 'views/register.html',
      controller: 'registerCtrl'
    }).
    when('/admin', {
      templateUrl: 'private/views/admin.html'
    }).
    otherwise({
      redirectTo: '/login'
    });

    $httpProvider.interceptors.push('authInterceptor');
  }]);


app.controller('registerCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
  $scope.submit = function () {
    $http.post('api/register', $scope.form)
      .then(function (response) {
        console.log(response);
        $location.path('/login')
      });
  }
}]);

app.controller('loginCtrl', ['$scope', '$http', 'authService', '$location',
  function ($scope, $http, authService, $location) {
    $scope.submit = function () {
      $http.post('api/login', $scope.form)
        .then(function (response) {

          // save json web token in session storage
          authService.saveToken(response.data);

          // redirect to projects page
          $location.path('/admin');

        }, function () {
          // wipe out the stored token
          authService.logout();
        })
    };
  }]);

app.controller('navCtrl', ['authService', '$scope', '$location',
  function (authService, $scope, $location) {

    if ($scope.user && $scope.user.username) {
      $location.path('/admin');
    }

    $scope.logout = function () {
      authService.logout();
      $location.path('/');
    };

    authService.getUser().then(null, null, function (user) {
      $scope.user = user;
    });
  }]);

app.service('authService', ['$window', '$q', function ($window, $q) {

  var self = this;
  var defer = $q.defer();
  var user = null;

  // This exposes the user object as a promise.
  // First two arguments of then are success and error callbacks, third one is notify callback.
  this.getUser = function () {
    self.setUser();
    return defer.promise;
  };

  this.setUser = function () {
    user = self.parseJwt(self.getToken());
    defer.notify(user);
  };

  this.parseJwt = function (token) {
    if (token) {
      var base64Url = token.split('.')[1];
      var base64 = base64Url.replace('-', '+').replace('_', '/');
      return JSON.parse($window.atob(base64));
    } else return {};
  };

  this.saveToken = function (token) {
    $window.localStorage.jwtToken = token;
    self.setUser();
  };

  this.getToken = function () {
    return $window.localStorage.jwtToken;
  };

  this.isAuthed = function () {
    var token = this.getToken();
    if (token) {
      var params = self.parseJwt(token);
      var notExpired = Math.round(new Date().getTime() / 1000) <= params.exp;
      if (!notExpired) {
        self.logout();
      }
      return notExpired;
    } else {
      return false;
    }
  };

  this.logout = function () {
    delete $window.localStorage.jwtToken;
    self.setUser();
  };
}]);

app.factory('authInterceptor', ['$q', '$location', 'authService', function ($q, $location, authService) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if (authService.isAuthed()) {
        config.headers.Authorization = 'Bearer ' + authService.getToken();
      }
      return config;
    },
    response: function (response) {
      if (response.status === 401) {

        // delete the token
        authService.logout();

        // handle the case where the user is not authenticated
        $location.path("/login");
      }
      return response || $q.when(response);
    }
  };
}]);
