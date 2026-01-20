// @ts-check
import { composePlugins, withNx } from '@nx/next';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Nx-specific options
  nx: {},
};

// List your Next.js plugins here
const plugins = [withNx];

export default composePlugins(...plugins)(nextConfig);
