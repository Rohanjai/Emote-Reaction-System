const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'emote-generator',
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const admin = kafka.admin();
const producer = kafka.producer();

const emotes = ['❤️', '👍', '😢', '😡'];
const topic = 'raw-emote-data';

const createTopics = async () => {
    await admin.connect();
    await admin.createTopics({
        topics: [
            { topic: 'raw-emote-data', numPartitions: 1, replicationFactor: 1 },
            { topic: 'aggregated-emote-data', numPartitions: 1, replicationFactor: 1 }
        ]
    });

    await admin.disconnect();
};

const getRandomEmote = async () => {
    const emote = emotes[Math.floor(Math.random() * emotes.length)];
    const timestamp = new Date().toISOString();
    console.log(`Generated: ${emote} at ${timestamp}`);

    return { emote, timestamp };
}

const sendMessage = async (message) => {
    await producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }]
    });

    //console.log('Message sent: ', message);
}

const generateEmotes = async () => {
    await createTopics();
    await producer.connect();
    setInterval(async () => {
        if (Math.random() < 0.2) {
            const burstEmote = emotes[Math.floor(Math.random() * emotes.length)];
            for (let i = 0; i < Math.floor(Math.random() * 51) + 50; i++) {
                const message = { emote: burstEmote, timestamp: new Date().toISOString() };
                await sendMessage(message);
            }
        } else {
            for (let i = 0; i < Math.floor(Math.random() * 16) + 5; i++) {
                const message = await getRandomEmote();
                await sendMessage(message);
            }
        }
    }, 1000);
};

generateEmotes().catch(console.error);
