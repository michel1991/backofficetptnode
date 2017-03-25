/**
 * Created by group lifi on 21/03/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var DeviceSchema = new Schema({
    serialNumber: String,
    nameDevice: String,
    itemBindingOpenHab:String,
    typeDevice:String

}, {collection: 'Device'});

module.exports = mongoose.model('Device', DeviceSchema);