/**
 * Created by Faliherizo on 24/03/2017.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userscenario = new Schema({
    id_user:{type:Schema.ObjectId, ref:'utilisateur'},
    id_scenario: {type:Schema.ObjectId, ref:'scenario'},
    actif:Boolean
}, {collection: 'userscenario'});

module.exports = mongoose.model('userscenario', userscenario);