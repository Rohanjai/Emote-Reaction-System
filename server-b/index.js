const express = require('express');
const { Kafka } = require('kafkajs');
const app = express();
app.use(express.json());

const kafka = new Kafka({ clientId: 'server-b', brokers: ['kafka:9092'] });
const consumer = kafka.consumer({ groupId: 'server-b-group' });
const producer = kafka.producer();

let settings = { interval: 75, threshold: 0.5, allowedEmotes: ['❤️', '👍', '😢', '😡'] };
let messages = [];


// Settings endpoints

app.get('/settings', (req, res) => res.json(settings));

app.post('/settings/interval', (req, res) => {
    settings.interval = req.body.interval;
    res.status(200).json(settings.interval);
});

app.post('/settings/threshold', (req, res) => {
    settings.threshold = req.body.threshold;
    res.status(200).json(settings.threshold);
});

app.post('/settings/allowed-emotes', (req, res) => {
    settings.allowedEmotes = req.body.allowedEmotes;
    res.status(200).json(settings.allowedEmotes);
});

async function run() {
    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({ topic: 'raw-emote-data' });

    consumer.run({
        eachMessage: async ({ message }) => {
            const data = JSON.parse(message.value);
            if (settings.allowedEmotes.includes(data.emote)) {
                messages.push(data);
                if (messages.length >= settings.interval) {
                    analyzeMessages();
                    messages = [];
                }
            }
        },
    });
}

function analyzeMessages() {
    const minuteGroups = messages.reduce((acc, { emote, timestamp }) => {
        const minute = timestamp.slice(0, 16);
        acc[minute] = acc[minute] || { total: 0, emotes: {} };
        acc[minute].emotes[emote] = (acc[minute].emotes[emote] || 0) + 1;
        acc[minute].total++;
        return acc;
    }, {});

    for (const [minute, { total, emotes }] of Object.entries(minuteGroups)) {
        for (const [emote, count] of Object.entries(emotes)) {
            console.log(`Minute: ${minute}, Emote: ${emote}, Count: ${count}, Total: ${total}`);
            if (count / total > settings.threshold) {
                producer.send({
                    topic: 'aggregated-emote-data',
                    messages: [{ value: JSON.stringify({ minute, emote, count, total }) }],
                });
            }
        }
    }
}

app.listen(3001, () => console.log('Server B on port 3001'));
run().catch(console.error);