import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { SettingsProvider } from '@/context/SettingsContext';
import Navigation from '@/components/Navigation';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';

import { Noto_Serif_SC, Noto_Sans_SC, Ma_Shan_Zheng } from 'next/font/google';

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif-sc',
});

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans-sc',
});

const maShanZheng = Ma_Shan_Zheng({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-ma-shan-zheng',
});

export const metadata: Metadata = {
  title: 'HSK/TOEIC',
  description: 'A fast, mobile-first HSK and TOEIC learning app.',
  icons: {
    icon: '/icon-192x192.png',
    shortcut: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HSK/TOEIC',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
      </head>
      <body className={`bg-white dark:bg-gray-900 text-black dark:text-white antialiased transition-colors duration-200 ${notoSerifSC.variable} ${notoSansSC.variable} ${maShanZheng.variable}`} suppressHydrationWarning>
        <SettingsProvider>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
          <Navigation />
        </SettingsProvider>
      </body>
    </html>
  );
}
