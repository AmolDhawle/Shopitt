export { default as Input } from './lib/input/index';
export { default as ColorSelector } from './lib/color-selector/index';
export { default as CustomSpecifications } from './lib/custom-specifications/index';
export { default as CustomProperties } from './lib/custom-properties/index';
export { default as EventCountdown } from './lib/event-countdown';
export { default as SizeSelector } from './lib/size-selector/index';

import dynamic from 'next/dynamic';
import React from 'react';

export const RichTextEditor = dynamic(
  () => import('./lib/rich-text-editor/index'),
  {
    ssr: false,
    loading: () =>
      React.createElement('div', {
        className: 'h-40 bg-gray-800 animate-pulse',
      }),
  },
);
