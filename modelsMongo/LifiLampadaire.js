/**
 * Created by michjobs on 21/03/17.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var LampadaireSchema = new Schema({
    serialID: String
}, {collection: 'Lampadaire'});

module.exports = mongoose.model('Lampadaire', LampadaireSchema );