import { ConditionalNavigation } from '@/components/ui/ConditionalNavigation';
import Logo from '@/components/ui/Logo';
import { getUser } from '@/lib/db/queries';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import { use } from 'react';
import { SWRConfig } from 'swr';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Bon AI Petite - Your Personal AI Nutritionist',
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
  // Use SWR fallback for user data
  const user = use(getUser());

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
            },
          }}
        >
          {/* Header/NavBar */}
          <header className='sticky top-0 z-30 w-full bg-white/80 dark:bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-6 py-3 shadow-sm'>
            <Link href='/' className='flex items-center gap-2'>
              <Logo width={40} height={40} className='rounded-xl' />
              <span className='ml-2 font-cursive text-2xl text-primary'>
                Bon AI Petite
              </span>
            </Link>
            <ConditionalNavigation user={user} />
          </header>
          {children}
          <Analytics />
        </SWRConfig>
      </body>
    </html>
  );
}
