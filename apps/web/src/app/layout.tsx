import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, EB_Garamond } from 'next/font/google';
import './globals.css';

// Body / UI typeface — Inter is the exact family DESIGN.md specifies.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Display typeface — DESIGN.md's Waldenburg Light is licensed; EB Garamond is
// its documented free substitute. (Google Fonts' lightest weight is 400.)
const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ember',
  description:
    'A shared listening room where friends watch YouTube and listen to music together in real time.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${ebGaramond.variable}`}>
      <body>{children}</body>
    </html>
  );
}
