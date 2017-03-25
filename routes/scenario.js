/**
 * Created by Faliherizo on 24/03/2017.
 */
var express = require('express');
var router = express.Router();
var app = express();
router
    .get('/',function(req, res) {
        res.render('scenario', { title: 'Express' });
    });

module.exports = router;