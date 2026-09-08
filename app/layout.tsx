import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';

const sans = Manrope({ variable: '--font-sans-site', subsets: ['latin'] });
const heading = Cormorant_Garamond({
  variable: '--font-heading-site',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'MING — Your Chinese Elemental Profile',
  description:
    'A private prototype for culturally grounded BaZi and Five Element interpretation.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${heading.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
