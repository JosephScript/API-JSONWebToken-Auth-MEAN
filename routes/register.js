var express = require('express');
var router = express.Router();
var Users = require('../models/users');

/* POST /api/register/ */
router.post('/', function(req, res, next) {

    Users.Create(req.body, function(err, user){
        if(err){
            res.status(400).send(err.message);
        } else{
            res.send(200);
        }
    });
});

module.exports = router;
