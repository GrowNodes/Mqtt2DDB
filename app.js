const uuidV4 = require('uuid/v4');
var mqtt=require('mqtt')  

var ddb = require('dynamodb').ddb({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: 'dynamodb.us-west-1.amazonaws.com'
});


var deviceRoot="nodes/"  

var mqttClient=mqtt.connect('mqtt://demo.grownodes.com')
mqttClient.subscribe(deviceRoot+"#")
mqttClient.on('message', insertEvent);

function insertEvent(topic,payload) {  
  // console.log("new msg", topic, payload.toString())
  const topic_without_root = topic.replace(deviceRoot,'')
  var node_serial = topic_without_root.split('/')[0];
  var sub_topic = topic_without_root.substring(topic_without_root.indexOf("/") + 1);
  console.log(node_serial, sub_topic)
  var item = {
    message_id: uuidV4(),
    timestamp: Date.now(),
    node_serial,
    sub_topic,
    body: payload.toString()

  }
  ddb.putItem('mqtt_log', item, {}, function(err, res, cap) {});

}