const express = require('express')
const app = express()


var mqtt=require('mqtt')  
var mongodb=require('mongodb');  


var mongodbClient=mongodb.MongoClient;  
const mongodbURI = 'mongodb://root:a3UoemqXt2fy@ds157987.mlab.com:57987/grownodes';
var deviceRoot="nodes/"  
var collection,client;  

mongodbClient.connect(mongodbURI,setupCollection);

function setupCollection(err,db) {  
  if(err) throw err;
  collection=db.collection("test_mqtt");
  client=mqtt.connect('mqtt://demo.grownodes.com')
  client.subscribe(deviceRoot+"#")
  client.on('message', insertEvent);

  app.listen(process.env.PORT || 3000, () => {
    console.log('listening on', process.env.PORT || 3000)
  })

}


function insertEvent(topic,payload) {  
  // console.log("new msg", topic, payload.toString())
  var key=topic.replace(deviceRoot,'');
  collection.update(  
  { _id:key },
  { $push: { events: { message:payload.toString(), when:new Date() } } },
  { upsert:true },
  function(err,docs) {
    if(err) { console.log("Insert fail"); } // Improve error handling
  }
  )
}




app.get('/*', (req, res) => {
  collection.findOne({_id: req.params[0]}, (err, result) => {
    if (err) return console.log(err)
    res.send(result || {})
  })
})