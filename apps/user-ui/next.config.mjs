// @ts-check
import { composePlugins, withNx } from '@nx/next';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Nx-specific options
  nx: {},
  images: {
    remotePatterns: [{ hostname: 'ik.imagekit.io' }],
  },
};

// List your Next.js plugins here
const plugins = [withNx];

export default composePlugins(...plugins)(nextConfig);
