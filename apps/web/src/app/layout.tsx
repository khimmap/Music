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

// Set `data-time` on <html> before first paint so the landing never flashes the
// wrong time-of-day theme. `?time=` overrides the local clock. Mirrors
// hourToState() in features/landing/timeOfDay.ts — keep them in sync.
const TIME_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search).get('time');var v=['morning','day','evening','night'];var t=v.indexOf(q)>=0?q:(function(){var h=new Date().getHours();if(h>=5&&h<12)return'morning';if(h>=12&&h<17)return'day';if(h>=17&&h<23)return'evening';return'night';})();document.documentElement.setAttribute('data-time',t);}catch(e){document.documentElement.setAttribute('data-time','day');}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${ebGaramond.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TIME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
