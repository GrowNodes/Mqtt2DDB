const mqtt = require('mqtt')
const MongoClient = require('mongodb').MongoClient, assert = require('assert')

const mongoUrl = 'mongodb://grownodes:a3UoemqXt2fy@ds157987.mlab.com:57987/grownodes';

MongoClient.connect(mongoUrl, function(err, db) {
  assert.equal(null, err)
  console.log("Connected correctly to MongoDB")
  
  const client = mqtt.connect('mqtt://iot.eclipse.org')
  client.on('connect', () => {
    client.subscribe('grownodes/#')
    console.log("Connected to MQTT")
  })

  client.on('message', (topic, message) => {
    const nodeSerial = topic.split('/')[1]
    const subTopic = topic.replace("grownodes/"+nodeSerial+"/", "");

    console.log(subTopic + ": " + message.toString())
    
    switch (subTopic) {
      case "$name":
      case "$localip":
      case "$fw/version":
      case "$stats/interval":
        updateNodeInfo(db, nodeSerial, subTopic, message.toString() )
      break
      case "$implementation/config":
        updateNodeInfo(db, nodeSerial, subTopic, message.toString() )
        updateGrowPlan(db, nodeSerial, message.toString() )
        break
    }

  })
});


var updateGrowPlan = function(db, serial, message) {
      const growplan = JSON.parse(JSON.parse(message).settings.growplan)
      const collection = db.collection('grow-plan')

      upsertDB(collection, serial, growplan)
}

var updateNodeInfo = function(db, serial, subtopic, message) {
  var nodeInfo = new Object()
  nodeInfo.lastseen = (new Date).getTime()

  switch (subtopic) {
    case "$name":
      nodeInfo.name = message
    break
    case "$localip":
      nodeInfo["wifi-localip"] = message
    break
    case "$fw/version":
      nodeInfo.firmware = message
    break
    case "$implementation/config":
      const config = JSON.parse(message)
      nodeInfo["wifi-ssid"] = config.wifi.ssid
    break
  }

  upsertDB(db.collection('node-info'), serial, nodeInfo)
}






function upsertDB(collection, serial, update) {
  collection.update(
    { "serial": serial },
    { $set: update },
    { upsert: true }
  )
}