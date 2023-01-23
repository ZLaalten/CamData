const mongoose = require('mongoose');

const DataAttendSchema = mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    timestamp: {
        type: String,
        required: true
    }

});

const DataAttend = module.exports = mongoose.model('DataAttend', DataAttendSchema);