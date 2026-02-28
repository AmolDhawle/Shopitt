import { kafka } from '@shopitt/redpanda-node';
import { updateUserAnalytics } from './services/analytics.service';

const consumer = kafka.consumer({
  groupId: 'user-activity-group',
});

const VALID_ACTIONS = [
  'add_to_wishlist',
  'add_to_cart',
  'remove_from_cart',
  'remove_from_wishlist',
  'product_view',
];

// Kafka consumer for user events
export const consumeKafkaMessages = async () => {
  await consumer.connect();

  await consumer.subscribe({
    topic: 'user-activity',
    fromBeginning: false,
  });

  await consumer.run({
    autoCommit: false,

    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
      isRunning,
      isStale,
    }) => {
      const eventsToProcess: any[] = [];

      for (const message of batch.messages) {
        if (!isRunning() || isStale()) break;
        if (!message.value) continue;

        try {
          const event = JSON.parse(message.value.toString());

          if (!event.action || !VALID_ACTIONS.includes(event.action)) {
            resolveOffset(message.offset);
            continue;
          }

          eventsToProcess.push({
            event,
            offset: message.offset,
          });
        } catch (error) {
          console.error('Invalid Kafka message:', error);
        }
      }

      try {
        await Promise.all(
          eventsToProcess.map(async ({ event, offset }) => {
            await updateUserAnalytics(event);
            resolveOffset(offset);
          }),
        );

        // Commit ONLY after all DB writes succeed
        await commitOffsetsIfNecessary();
      } catch (error) {
        console.error('Batch processing failed. Offsets NOT committed.', error);
        // If error happens here:
        // Offsets are NOT committed
        // Kafka will retry this batch
      }
    },
  });
};

consumeKafkaMessages().catch((error) => {
  console.error('Kafka consumer crashed:', error);
});
