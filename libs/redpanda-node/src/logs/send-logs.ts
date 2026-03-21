import { kafka } from '@shopitt/redpanda-node';

const producer = kafka.producer();

export async function sendLogs({
  type = 'info',
  message,
  source = 'unknown-service',
}: {
  type?: 'info' | 'error' | 'warning' | 'success' | 'debug';
  message: string;
  source: string;
}) {
  const logPayload = {
    type,
    message,
    timestamp: new Date().toISOString(),
    source,
  };

  await producer.connect();
  await producer.send({
    topic: 'logs',
    messages: [{ value: JSON.stringify(logPayload) }],
  });

  await producer.disconnect();
}
