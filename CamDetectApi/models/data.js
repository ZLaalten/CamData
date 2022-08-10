const mongoose = require('mongoose');

const DataSchema = mongoose.Schema({
    camera_id : {
        type : String,
        required : true
    },
    n_person : {
        type : String, 
        required : true
    },
    timestamp : {
        type : String,
        required : true
    }

});

const Data = module.exports = mongoose.model('Data', DataSchema);