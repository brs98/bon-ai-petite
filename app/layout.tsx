import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: 'AI Petite - Your Personal AI Nutritionist',
  description:
    'Transform your eating habits with AI-powered meal planning. Get personalized nutrition plans, automated grocery shopping, and seamless delivery integration with Instacart and Amazon Fresh.',
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang='en'
      className={`bg-background dark:bg-background text-foreground dark:text-foreground ${manrope.className}`}
    >
      <body className='min-h-[100dvh] bg-muted'>
        <SWRConfig
          value={{
            fallback: {
              // We do NOT await here
              // Only components that read this data will suspend
              '/api/user': getUser(),
              '/api/team': getTeamForUser(),
            },
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
