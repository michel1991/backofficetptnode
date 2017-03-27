/**
 * Created by Faliherizo on 25/03/2017.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scenariodtl = new Schema({
    //Id du scenario
    id_scenario: {type:Schema.ObjectId, ref:'scenario'},
    //Nom de devise
    name:String,
    //Value exemple ( ON, OFF, ... par rapport devise)
    value:String,
    //checkbox ou Switch, tempmax, tempmin
    type:String
}, {collection: 'Scenariodtl'});

module.exports = mongoose.model('Scenariodtl', scenariodtl);