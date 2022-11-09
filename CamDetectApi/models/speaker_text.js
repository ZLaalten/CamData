const mongoose = require('mongoose');

const SpeakerTextSchema = mongoose.Schema({

    audioConfig: {
        audioEncoding: {
            type: String,
            required: true
        },

        pitch: {
            type: String,
            required: true
        },

        speakingRate: {
            type: String,
            required: true
        }
    },

    input: {
        text: {
            type: String,
            required: true
        }
    },

    voice: {
        languageCode: {
            type: String,
            required: true
        },

        name: {
            type: String,
            required: true
        }
    }
}, { _id: false });

const SpeakerText = module.exports = mongoose.model('SpeakerText', SpeakerTextSchema);