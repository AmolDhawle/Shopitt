import { prisma } from '@shopitt/prisma-client';

const initializeSiteConfig = async () => {
  try {
    const existingConfig = await prisma.siteConfig.findFirst();

    if (!existingConfig) {
      await prisma.siteConfig.create({
        data: {
          categories: [
            'Electronics',
            'Fashion',
            'Home & Kitchen',
            'Sports & Fitness',
          ],
          subCategories: {
            Electronics: ['Mobiles', 'Laptops', 'Accessories', 'Gaming'],
            Fashion: ['Men', 'Women', 'Kids', 'Footwear'],
            'Home & Kitchen': ['Furniture', 'Appliances', 'Decor'],
            'Sports & Fitness': [
              'Gym Equipment',
              'Outdoor Sports',
              'Wearables',
            ],
          },
          logo: 'https://ik.imagekit.io/5frbx53sr/logo/logo.png',
          banner: 'https://ik.imagekit.io/5frbx53sr/products/watch-6.avif',
        },
      });

      console.log('SiteConfig created');
    } else {
      await prisma.siteConfig.update({
        where: { id: existingConfig.id },
        data: {
          logo:
            existingConfig.logo ??
            'https://ik.imagekit.io/5frbx53sr/logo/logo.png',
          banner:
            existingConfig.banner ??
            'https://ik.imagekit.io/5frbx53sr/products/watch-6.avif',
        },
      });

      console.log('SiteConfig verified');
    }
  } catch (error) {
    console.log('Error initializing site config:', error);
  }
};

export default initializeSiteConfig;
