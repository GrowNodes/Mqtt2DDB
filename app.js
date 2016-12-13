const request = require('request');
const uuidV4 = require('uuid/v4');
var mqtt=require('mqtt')  

var ddb = require('dynamodb').ddb({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: 'dynamodb.us-east-1.amazonaws.com'
});


var deviceRoot="nodes/"  

var mqttClient=mqtt.connect('mqtt://demo.grownodes.com')
mqttClient.subscribe(deviceRoot+"#")
mqttClient.on('message', insertEvent);

function insertEvent(topic,payload) {  
  const msg_text = payload.toString()
  const topic_without_root = topic.replace(deviceRoot,'')
  // var node_serial = topic_without_root.split('/')[0];
  // var sub_topic = topic_without_root.substring(topic_without_root.indexOf("/") + 1);
  console.log(topic_without_root)
  var item = {
    message_id: uuidV4(),
    timestamp: Date.now(),
    topic: topic_without_root,
    body: msg_text

  }
  ddb.putItem('mqtt_log', item, {}, function(err, res, cap) {});


  if (topic_without_root == "5ccf7f94ee4f/$online") {
    const title = `5ccf7f94ee4f is now ${msg_text == "true" ? "online" : "offline"}`
    sendMessage(title, "Tap for details")
  }
}

function sendMessage(title, body, callback) {
  var options = {
    url: 'https://fcm.googleapis.com/fcm/send',
    method: 'POST',
    headers: {
      'Authorization': 'key='+process.env.FCM_KEY
    },
    json: {
  "notification":{
    title,
    body,
    "sound":"default", 
    "click_action":"FCM_PLUGIN_ACTIVITY",  
    "icon":"fcm_push_icon"  
  },
    "to":"/topics/all", 
    "priority":"high" 
}
  }

  request(options, function (error, response, body) {
    console.log(body)
    if (!error && response.statusCode == 200) {
        // callback(body)
    } else {
      // callback(error)
    }
  })
}