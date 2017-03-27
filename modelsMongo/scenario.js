/**
 * Created by Faliherizo on 24/03/2017.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var scenarioSchema = new Schema({
    name:String,
    //
    id_user:{type:Schema.ObjectId}
    //status: Boolean
}, {collection: 'Scenario'});

module.exports = mongoose.model('Scenario', scenarioSchema);