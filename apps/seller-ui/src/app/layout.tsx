import './global.css';
import { Poppins, Roboto } from 'next/font/google';
import Provider from './provider';

export const metadata = {
  title: 'Shopitt Seller Dashboard',
  description: 'An e-commerce platform for all your shopping needs',
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-roboto',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen font-sans antialiased ${roboto.variable} ${poppins.variable}`}
      >
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
