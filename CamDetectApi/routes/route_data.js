const express = require('express');
const extend = require('extend');
const moment = require('moment');
const router = express.Router();
const async = require('async');
const mqtt = require('mqtt');
const clientId = "binaryScript";

const server_address = "mqtt://localhost"

const client  = mqtt.connect(server_address,{
    clientId,
    will : {
        topic : clientId,
        payload : "disconnected from client : " + moment().format("ddd, DD MM YYYY HH:mm:ss"),
        retain : "true",
    }
});


const Data = require('../models/data');

client.on('connect', function () {
    console.log("MQTT client connected")
    client.subscribe('camdata', function (err) {
    })
    let t_conn = moment().format("ddd, DD MM YYYY HH:mm:ss")
    client.publish(clientId, "connected : " + t_conn , { qos: 0, retain: true }, (error) => {
        if (error) {
          console.error(error)
        }
      })
  })
  
  client.on('message', function (topic, message) {
    // message is Buffer
    datas = message.toString()
    // client.end()
    // console.log(datas);
    datas = JSON.parse(datas);
    console.log(datas);
    async.each(datas, function (data, callback) {
        let newData = new Data(data);
        newData.save((err, data)=>{
            if(err){
                return callback(error);
            }
            else{
                return callback();
            }
        })
    }, function(err){
        if (err) {
            console.log("Error " + err);
        }
        else {
            console.log("Success");
        }
    });

  })

// getting datas
router.get('/get_all', (req, res, next)=>{
    Data.find((err, datas)=>{
        res.json(datas);
    })
});


//topic publisher
router.post('/publish_topic',(req, res, next)=>{
    let topic = req.body.topic;
    let message = req.body.message;
    client.publish(topic, message);
    res.json("Successfully Published");
    
})


//adding datas
router.post('/',(req, res, next)=>{
    let newData = new Data(req.body);
    newData.save((err, data)=>{
        if(err){
            //console.log(err);
            res.json("Error occured in saving : " + err);
        }
        else{
            res.json(data);
        }
    })
})

router.post('/post_all', (req, res, next) => {
    let datas = req.body;
    // console.log(datas);
    async.each(datas, function (data, callback) {
        let newData = new Data(data);
        newData.save((err, data)=>{
            if(err){
                return callback(error);
            }
            else{
                return callback();
            }
        })
    }, function(err){
        if (err) {
            res.status(403).json({ msg: 'Error in updating data', data: req.body, status: err });
        }
        else {
            res.json({ msg: 'Successfully posted', data: req.body, status: 'success' });
        }
    });
});

//deleting datas
router.delete('/',(req, res, next)=>{
    var _id = req.param("id");
    //console.log(_id);
    Data.remove({_id : _id}, (err, result)=>{
        if(err){
            res.json("Error : " + err);
        }
        else{
            res.json("Succesfully deleted");
        }
    } );
})

router.delete('/delete_all', (req, res, next)=>{
    Data.remove({}, (err, result)=>{
        if(err){
            res.json("Error : " + err);
        }
        else{
            res.json("Succesfully deleted");
        }
    } );
})

module.exports = router;