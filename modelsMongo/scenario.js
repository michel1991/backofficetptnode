/**
 * Created by Faliherizo on 24/03/2017.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scenario = new Schema({
    devicename:String,
    status: String
}, {collection: 'scenario'});

module.exports = mongoose.model('scenario', scenario);