const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://iot.eclipse.org')

client.on('connect', () => {
  client.subscribe('grownodes/#')
})

client.on('message', (topic, message) => {
  const subtopic = topic.split('/')
  console.log(subtopic + ": " + message)
})