/**
 * Created by michjobs on 21/03/17.
 */
/**
 * Created by group lifi on 11/03/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var utilisateurSchema = new Schema({
    username: String,
    firstName: String,
    password: String,
    isConnect:Boolean,
    imei: String,
    idLamp:String

}, {collection: 'Utilisateur'});

module.exports = mongoose.model('Utilisateur', utilisateurSchema);