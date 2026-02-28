import { prisma } from '@shopitt/prisma-client';

export const updateUserAnalytics = async (event: any) => {
  try {
    // Fetch existing actions
    const existingData = await prisma.userAnalytics.findFirst({
      where: { userId: event.userId },
      select: { actions: true },
    });

    // Ensure actions is an array
    let updatedActions: any[] = Array.isArray(existingData?.actions)
      ? [...existingData.actions]
      : [];

    // Process event
    switch (event.action) {
      case 'product_view':
        updatedActions.push({
          productId: event.productId,
          shopId: event.shopId,
          action: 'product_view',
          timestamp: new Date(),
        });
        break;

      case 'add_to_cart':
      case 'add_to_wishlist':
        if (
          !updatedActions.some(
            (a) =>
              String(a.productId) === String(event.productId) &&
              a.action === event.action,
          )
        ) {
          updatedActions.push({
            productId: event.productId,
            shopId: event.shopId,
            action: event.action,
            timestamp: new Date(),
          });
        }
        break;

      case 'remove_from_cart':
        updatedActions = updatedActions
          .filter(
            (a) =>
              !(
                String(a.productId) === String(event.productId) &&
                a.action === 'add_to_cart'
              ),
          )
          .map((a) => ({ ...a })); // recreate objects to force new references
        break;

      case 'remove_from_wishlist':
        updatedActions = updatedActions
          .filter(
            (a) =>
              !(
                String(a.productId) === String(event.productId) &&
                a.action === 'add_to_wishlist'
              ),
          )
          .map((a) => ({ ...a })); // recreate objects to force new references
        break;

      default:
        // Unknown actions are ignored
        break;
    }

    // Keep only last 100 actions
    updatedActions = updatedActions.slice(-100);

    // Extra metadata
    const extraFields: Record<string, any> = {};
    if (event.country) extraFields.country = event.country;
    if (event.city) extraFields.city = event.city;
    if (event.device) extraFields.device = event.device;

    // Force new array reference to ensure Prisma detects change
    updatedActions = [...updatedActions];

    // Upsert user analytics
    await prisma.userAnalytics.upsert({
      where: { userId: event.userId },
      update: {
        lastVisited: new Date(),
        actions: updatedActions,
        ...extraFields,
      },
      create: {
        userId: event.userId,
        lastVisited: new Date(),
        actions: updatedActions,
        ...extraFields,
      },
    });

    // Update product analytics separately
    await updateProductAnalytics(event);
  } catch (error) {
    console.log('Error storing user analytics:', error);
  }
};
// export const updateUserAnalytics = async (event: any) => {
//   try {
//     const existingData = await prisma.userAnalytics.findFirst({
//       where: {
//         userId: event.userId,
//       },
//       select: { actions: true },
//     });

//     let updatedActions: any = existingData?.actions
//       ? JSON.parse(JSON.stringify(existingData.actions))
//       : [];
//     const actionExists = updatedActions.some(
//       (entry: any) =>
//         entry.productId === event.productId && entry.action === event.action,
//     );

//     // Always store `product_view` for recommendations
//     if (event.action === 'product_view') {
//       updatedActions.push({
//         productId: event?.productId,
//         shopId: event.shopId,
//         action: event.action,
//         timestamp: new Date(),
//       });
//     } else if (
//       ['add_to_cart', 'add_to_wishlist'].includes(event.action) &&
//       !actionExists
//     ) {
//       updatedActions.push({
//         productId: event?.productId,
//         shopId: event.shopId,
//         action: event?.action,
//         timestamp: new Date(),
//       });
//     }
//     if (event.action === 'remove_from_cart') {
//       updatedActions = updatedActions.filter(
//         (entry: any) =>
//           !(
//             String(entry.productId) === String(event.productId) &&
//             entry.action === 'add_to_cart'
//           ),
//       );
//     }
//     if (event.action === 'remove_from_wishlist') {
//       updatedActions = updatedActions.filter(
//         (entry: any) =>
//           !(
//             String(entry.productId) === String(event.productId) &&
//             entry.action === 'add_to_wishlist'
//           ),
//       );
//     }

//     // keep only last 100 actions (prevent storage overload)
//     updatedActions = updatedActions.slice(-100);

//     const extraFields: Record<string, any> = {};

//     if (event.country) {
//       extraFields.country = event.country;
//     }

//     if (event.city) {
//       extraFields.city = event.city;
//     }

//     if (event.device) {
//       extraFields.device = event.device;
//     }

//     // update or create user analytics
//     await prisma.userAnalytics.upsert({
//       where: { userId: event.userId },
//       update: {
//         lastVisited: new Date(),
//         actions: updatedActions,
//         ...extraFields,
//       },
//       create: {
//         userId: event?.userId,
//         lastVisited: new Date(),
//         actions: updatedActions,
//         ...extraFields,
//       },
//     });

//     // Update product analytics
//     await updateProductAnalytics(event);
//   } catch (error) {
//     console.log('Error storing user analytics: ', error);
//   }
// };

export const updateProductAnalytics = async (event: any) => {
  try {
    if (!event.productId) return;

    // Define update fields dynamically
    const updateFields: any = {};

    if (event.action === 'product_view') updateFields.views = { increment: 1 };
    if (event.action === 'add_to_cart')
      updateFields.cartAdds = { increment: 1 };
    if (event.action === 'remove_from_cart')
      updateFields.cartAdds = { decrement: 1 };
    if (event.action === 'add_to_wishlist')
      updateFields.wishlistAdds = { increment: 1 };
    if (event.action === 'remove_from_wishlist')
      updateFields.wishlistAdds = { decrement: 1 };
    if (event.action === 'purchase') updateFields.purchases = { increment: 1 };

    // update or create product analytics  asynchronously
    await prisma.productAnalytics.upsert({
      where: { productId: event.productId },
      update: {
        lastViewedAt: new Date(),
        ...updateFields,
      },
      create: {
        productId: event.productId,
        shopId: event.shopId || null,
        views: event.action === 'product_view' ? 1 : 0,
        cartAdds: event.action === 'add_to_cart' ? 1 : 0,
        wishlistAdds: event.action === 'add_to_wishlist' ? 1 : 0,
        purchases: event.action === 'purchase' ? 1 : 0,
        lastViewedAt: new Date(),
      },
    });
  } catch (error) {
    console.log('Error updating product analytics', error);
  }
};
