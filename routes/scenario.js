/**
 * Created by Faliherizo on 24/03/2017.
 */
var express = require('express');
var router = express.Router();
var app = express();
const Scenario = require('../modelsMongo/scenario');

router
    .get('/',function(req, res) {
        Scenario.findAll(function(res, error){

            if(res==null){
                sendResponseData();
            }
        });

        res.render('scenario', { title: 'Express' });
    });

/**
 *
 * @param data object à renvoyer
 * @param res l'object response de node js
 */
var sendResponseData = function(data,res)
{
    res.send(data, {
        'Content-Type': 'application/json'
    }, 200);
};

module.exports = router;