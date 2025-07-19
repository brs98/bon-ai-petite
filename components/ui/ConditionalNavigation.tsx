'use client';

import { signOut } from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  ChefHat,
  Home,
  Menu,
  Settings,
  Utensils,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ConditionalNavigationProps {
  user: {
    id: number;
    name?: string | null;
    email: string;
  } | null;
}

export function ConditionalNavigation({ user }: ConditionalNavigationProps) {
  const pathname = usePathname();
  const isWaitlistPage = pathname === '/waitlist';

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

  // Don't render navigation on waitlist page
  if (isWaitlistPage) {
    return null;
  }

  return (
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
                <Link href={item.href} className='flex items-center gap-2'>
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
  );
}
