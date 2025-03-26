const express = require('express');
const WebSocket = require('ws');
const { Kafka } = require('kafkajs');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const kafka = new Kafka({ clientId: 'server-a', brokers: ['kafka:9092'] });
const consumer = kafka.consumer({ groupId: 'server-a-group' });

wss.on('connection', (ws) => {
    console.log('Client connected');
});

async function run() {
    await consumer.connect();
    await consumer.subscribe({ topic: 'aggregated-emote-data' });
    consumer.run({
        eachMessage: async ({ message }) => {
            // console.log('Received message:', message.value.toString());
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message.value.toString());
                }
            });
        },
    });
}

server.listen(3000, () => console.log('Server A on port 3000'));
run().catch(console.error);