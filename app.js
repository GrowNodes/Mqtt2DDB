const request = require('request');
const uuidV4 = require('uuid/v4');
const mqtt = require('mqtt')  
const mqtt_regex = require("mqtt-regex");


const ddb = require('dynamodb').ddb({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: 'dynamodb.us-east-1.amazonaws.com'
});

const deviceRoot="nodes/"

const mqttClient = mqtt.connect('mqtt://demo.grownodes.com')



mqttClient.subscribe(deviceRoot+"#")
mqttClient.on('message', handleMsg);



function handleMsg(topic, payload) {
  saveMsg(topic, payload)
  sendToFcmHandlerIfNeeded(topic, payload)
}

function saveMsg(topic, payload) {  
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
}


function sendToFcmHandlerIfNeeded(topic, payload) {
  const topicParser = mqtt_regex(deviceRoot+"+serial/notification/send").exec;
  const parsedTopic = topicParser(topic);

  if (!parsedTopic) {
    return
  }

  console.log("sending notification: ", payload.toString())
try {
  var msgObj = {body: payload.toString()}
} catch(e) {
  console.error("Error parsing JSON:", payload.toString())
  return
}
  msgObj.serial = parsedTopic.serial

  var options = {
    url: process.env.NOTIFIER_SEND_URL,
    method: 'POST',
    headers: {
      'Authorization': 'key='+process.env.FCM_KEY
    },
    json: msgObj
  }

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        // callback(body)
    } else {
      // callback(error)
    }
  })
}