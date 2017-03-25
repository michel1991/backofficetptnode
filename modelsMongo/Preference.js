/**
 * Created by michjobs on 21/03/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var PreferenceSchema = new Schema({
    namePreference: String,
    idUtil: Schema.Types.ObjectId,
    dateCreated: Date,
    // device sur lequel porte l'événement celui qui déclenchera l'action par exemple device yahoo
    deviceInitEvent:{
        idDevice: Schema.Types.ObjectId,
        properties: Schema.Types.Mixed // tous les attributs spécifique au device dont on veut sauver
    },

    // device qui devra éxecuter une action par exemple la prise, cependant pour une conception plus large
    // il pourra avoir plusieurs devices
    deviceReceiveEvent:[{
        idDevice: Schema.Types.ObjectId,
        properties: Schema.Types.Mixed // tous les attributs spécifique au device dont on veut sauver
    }]



}, {collection: 'Preference'});

module.exports = mongoose.model('Preference', PreferenceSchema);
