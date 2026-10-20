import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';
import './editorial-v2.css';
import './question-v2.css';

const sans = Manrope({ variable: '--font-sans-site', subsets: ['latin'] });
const heading = Cormorant_Garamond({
  variable: '--font-heading-site',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'MING 命 — 以出生之时，读人生之势',
  description:
    '以四柱八字为线索，探索性格、关系与人生阶段。',
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" translate="no">
      <body
        className={`${sans.variable} ${heading.variable} notranslate antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
