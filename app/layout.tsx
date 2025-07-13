import { signOut } from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Logo from '@/components/ui/Logo';
import { getUser } from '@/lib/db/queries';
import {
  Calendar,
  ChefHat,
  Home,
  Menu,
  Settings,
  Utensils,
} from 'lucide-react';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import { use } from 'react';
import { SWRConfig } from 'swr';
import './globals.css';

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

  // Navigation items for dashboard
  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/recipes', icon: ChefHat, label: 'Recipes' },
    {
      href: '/dashboard/meal-planning/weekly',
      icon: Calendar,
      label: 'Weekly Meal Planning',
    },
    {
      href: '/dashboard/settings/nutrition',
      icon: Utensils,
      label: 'Nutrition Profile',
    },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

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
            <nav className='flex items-center gap-4'>
              {/* Navigation Popover (only if logged in) */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='flex items-center gap-2'>
                      <Menu className='h-5 w-5' />
                      <span className='sr-only'>Open navigation menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {navItems.map(item => (
                      <DropdownMenuItem asChild key={item.href}>
                        <Link
                          href={item.href}
                          className='flex items-center gap-2'
                        >
                          <item.icon className='h-4 w-4 hover:text-primary-foreground' />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {user ? (
                <form action={signOut}>
                  <Button type='submit' variant='outline'>
                    Sign Out
                  </Button>
                </form>
              ) : (
                <>
                  <Link href='/sign-in'>
                    <Button variant='outline'>Sign In</Button>
                  </Link>
                  <Link href='/pricing'>
                    <Button>Sign Up</Button>
                  </Link>
                </>
              )}
            </nav>
          </header>
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
