'use server';

import { kafka } from '@shopitt/redpanda-node';

const producer = kafka.producer();
let isConnected = false;

export const getProducer = async () => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
  }
  return producer;
};

export async function sendKafkaEvent(eventData: any) {
  const producer = await getProducer();

  await producer.send({
    topic: 'user-activity',
    messages: [
      {
        key: eventData.userId,
        value: JSON.stringify(eventData),
      },
    ],
  });
}
