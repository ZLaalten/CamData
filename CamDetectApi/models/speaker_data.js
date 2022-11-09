const mongoose = require('mongoose');

const SpeakerDataSchema = mongoose.Schema({

    device_id: {
        type: String,
        required: true
    },

    text: {
        type: String,
        required: true
    }
}, { _id: false });

const SpeakerData = module.exports = mongoose.model('SpeakerData', SpeakerDataSchema);