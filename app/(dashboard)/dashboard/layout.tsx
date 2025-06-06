'use client';

import { Button } from '@/components/ui/button';
import {
  Activity,
  Calendar,
  ChefHat,
  Menu,
  Settings,
  Shield,
  Users,
  Utensils,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', icon: Users, label: 'Team' },
    { href: '/dashboard/general', icon: Settings, label: 'General' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { href: '/dashboard/security', icon: Shield, label: 'Security' },
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
  ];

  return (
    <div className='flex flex-col min-h-[calc(100vh-73px)] w-full'>
      {/* Mobile header */}
      <div className='lg:hidden flex items-center justify-between bg-background border-b border-border p-4'>
        <div className='flex items-center'>
          <span className='font-medium'>Settings</span>
        </div>
        <Button
          className='-mr-3'
          variant='ghost'
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className='h-6 w-6' />
          <span className='sr-only'>Toggle sidebar</span>
        </Button>
      </div>

      <div className='flex flex-1 overflow-hidden h-full'>
        {/* Sidebar */}
        <aside
          className={`w-64 bg-background border-r border-border/40 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className='h-full overflow-y-auto p-4 space-y-1'>
            {navItems.map(item => (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={`w-full justify-start h-10 ${
                    pathname === item.href
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className='h-4 w-4 mr-3' />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className='flex-1 overflow-y-auto p-0 lg:p-4'>{children}</main>
      </div>
    </div>
  );
}
