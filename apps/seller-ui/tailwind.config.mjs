// const { createGlobPatternsForDependencies } = require('@nx/next/tailwind');

// The above utility import will not work if you are using Next.js' --turbo.
// Instead you will have to manually add the dependent paths to be included.
// For example
// ../libs/buttons/**/*.{ts,tsx,js,jsx,html}',                 <--- Adding a shared lib
// !../libs/buttons/**/*.{stories,spec}.{ts,tsx,js,jsx,html}', <--- Skip adding spec/stories files from shared lib

// If you are **not** using `--turbo` you can uncomment both lines 1 & 19.
// A discussion of the issue can be found: https://github.com/nrwl/nx/issues/26510

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
    '../seller-ui/src/**/*.{ts,tsx,js,jsx,html}',
    //     ...createGlobPatternsForDependencies(__dirname)
  ],
  theme: {
    screens: {
      xs: '360px', // small phones
      sm: '620px', // phones
      md: '768px', // tablets
      lg: '1024px', // laptops
      xl: '1280px', // desktops
      '2xl': '1440px', // large desktops
      'step-md': '900px', // where stepper layouts often break
      'step-lg': '1100px', // wide forms / wizards
      ultra: '1800px', // very large monitors
    },
    extend: {
      fontFamily: {
        Poppins: ['var(--font-poppins)'],
      },
    },
  },
  plugins: [],
};
