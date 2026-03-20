import { prisma } from '@shopitt/prisma-client';
import cron from 'node-cron';

cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    await prisma.products.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: { lte: now },
      },
    });
  } catch (error) {
    console.log(error);
  }
});

// keep track of event status
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    const expiredEvents = await prisma.products.updateMany({
      where: {
        isEvent: true,
        endingDate: { lt: now },
      },
      data: {
        isEvent: false,
        startingDate: null,
        endingDate: null,
      },
    });

    if (expiredEvents.count > 0) {
      console.log(`Expired ${expiredEvents.count} events`);
    }
  } catch (error) {
    console.error('Event expiry cron failed:', error);
  }
});
