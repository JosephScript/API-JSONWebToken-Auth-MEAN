var express = require('express');
var router = express.Router();
var Users = require('../models/users');

/* POST /api/register/ */
router.post('/', function (req, res, next) {

    req.check('username').isAlphanumeric(); // check to see if not empty

    var errors = req.validationErrors();

    if (errors){
        res.status(400).send(errors);
    } else {

        Users.Create(req.body, function (err, user) {
            if (err) {
                res.status(400).send(err.message);
            } else {
                res.sendStatus(200);
            }
        });
    }
});

module.exports = router;
