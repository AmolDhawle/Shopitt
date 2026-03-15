import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
  brokers: [
    'd6q1m6obmgg6innoi4e0.any.us-east-1.mpx.prd.cloud.redpanda.com:9092',
  ],
  ssl: true,
  sasl: {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_USERNAME!,
    password: process.env.KAFKA_PASSWORD!,
  },
});
