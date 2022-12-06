const express = require('express');
const extend = require('extend');
const moment = require('moment');
const router = express.Router();
const async = require('async');
const mqtt = require('mqtt');
const clientId = "binaryScripts_1";
var request = require('request');
var fs = require("fs");

const speaker_text = require('../models/speaker_text.js');
const speaker_data = require('../models/speaker_data.js');


const serverUrl = "http://192.168.1.67:3000";
const server_address = "mqtt://13.233.63.39"
const mqtt_topic = "speaker_01";

const client = mqtt.connect(server_address, {
    clientId,
    will: {
        topic: clientId,
        payload: "disconnected from client : " + moment().format("ddd, DD MM YYYY HH:mm:ss"),
        retain: "true",
    }
});


const Data = require('../models/data');

client.on('connect', function() {
    console.log("MQTT client connected")
    client.subscribe('camdata', function(err) {})
    let t_conn = moment().format("ddd, DD MM YYYY HH:mm:ss")
    client.publish(clientId, "connected : " + t_conn, { qos: 0, retain: true }, (error) => {
        if (error) {
            console.error(error)
        }
    })
})

client.on('message', function(topic, message) {
    // message is Buffer
    datas = message.toString()
        // client.end()
        // console.log(datas);
    datas = JSON.parse(datas);
    console.log(datas);
    async.each(datas, function(data, callback) {
        let newData = new Data(data);
        newData.save((err, data) => {
            if (err) {
                return callback(error);
            } else {
                return callback();
            }
        })
    }, function(err) {
        if (err) {
            console.log("Error " + err);
        } else {
            console.log("Success");
        }
    });

})

// getting datas
router.get('/get_all', (req, res, next) => {
    Data.find((err, datas) => {
        res.json(datas);
    })
});

router.get('/get_device_by_id', (req, res, next) => {

    var device_in_params = req.param('device_id');


    Data.find({ camera_id: device_in_params }, function(erer, data) {
        if (erer) {
            res.status(403).json({ msg: 'Error in fetching user data', data: data, status: 'failure' });
        } else {
            res.json(data);
        }
    })


});


//topic publisher
router.post('/publish_topic', (req, res, next) => {
    let topic = req.body.topic;
    let message = req.body.message;
    client.publish(topic, message);
    res.json("Successfully Published");

})


//adding datas
router.post('/', (req, res, next) => {
    let newData = new Data(req.body);
    newData.save((err, data) => {
        if (err) {
            //console.log(err);
            res.json("Error occured in saving : " + err);
        } else {
            res.json(data);
        }
    })
})

router.post('/post_all', (req, res, next) => {
    let datas = req.body;
    // console.log(datas);
    async.each(datas, function(data, callback) {
        let newData = new Data(data);
        newData.save((err, data) => {
            if (err) {
                return callback(error);
            } else {
                return callback();
            }
        })
    }, function(err) {
        if (err) {
            res.status(403).json({ msg: 'Error in updating data', data: req.body, status: err });
        } else {
            res.json({ msg: 'Successfully posted', data: req.body, status: 'success' });
        }
    });
});

//deleting datas
router.delete('/', (req, res, next) => {
    var _id = req.param("id");
    //console.log(_id);
    Data.remove({ _id: _id }, (err, result) => {
        if (err) {
            res.json("Error : " + err);
        } else {
            res.json("Succesfully deleted");
        }
    });
})

router.delete('/delete_all', (req, res, next) => {
    Data.remove({}, (err, result) => {
        if (err) {
            res.json("Error : " + err);
        } else {
            res.json("Succesfully deleted");
        }
    });
})

router.post("/publish_message", (req, res) => {
    let text_message = req.body.text;

    let speakerText = new speaker_text();
    speakerText.audioConfig.audioEncoding = "MP3";
    speakerText.audioConfig.pitch = 0;
    speakerText.audioConfig.speakingRate = 1;
    speakerText.audioConfig.sampleRateHertz = 16000;
    speakerText.audioConfig.volumeGainDb = 16;

    speakerText.input.text = text_message;
    speakerText.voice.languageCode = "hi-IN"
    speakerText.voice.name = "hi-IN-Wavenet-D"
    console.log(JSON.stringify(speakerText, null, '\t'));

    var options = {
        'method': 'POST',
        'url': 'https://texttospeech.googleapis.com/v1beta1/text:synthesize',
        'headers': {
            'X-Goog-Api-Key': 'AIzaSyCaJRjgyTIWKGq4A1RR8uTAO2yZp7s8OpE',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(speakerText, null, '\t')

    };
    request(options, function(error, response) {
        var writeStream = fs.createWriteStream("./uploads/speach.mp3");
        var info = JSON.parse(response.body);
        var buf = Buffer.from(info.audioContent, 'base64');
        writeStream.write(buf);
        writeStream.end();
        var path = serverUrl + "/images?image_name=speach.mp3"
        client.publish(mqtt_topic, path);

        res.send({ path_to_speach: path, status: 'success' });
        if (error) throw new Error(error);
        console.log(response.body);
    });
});

module.exports = router;