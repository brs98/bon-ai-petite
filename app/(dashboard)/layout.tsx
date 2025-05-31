'use client';

import { signOut } from '@/app/(login)/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from '@/lib/db/schema';
import { BookOpen, ChefHat, Home, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.refresh();
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href='/pricing'
          className='text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          Pricing
        </Link>
        <Button
          asChild
          className='rounded-full bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90'
        >
          <Link href='/pricing'>Start Free Trial</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className='cursor-pointer size-9'>
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map(n => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='flex flex-col gap-1'>
        <DropdownMenuItem className='cursor-pointer'>
          <Link href='/dashboard' className='flex w-full items-center'>
            <Home className='mr-2 h-4 w-4' />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className='cursor-pointer'>
          <Link href='/dashboard/recipes' className='flex w-full items-center'>
            <BookOpen className='mr-2 h-4 w-4' />
            <span>Recipes</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className='w-full'>
          <button type='submit' className='flex w-full'>
            <DropdownMenuItem className='w-full flex-1 cursor-pointer'>
              <LogOut className='mr-2 h-4 w-4' />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className='border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95'>
      <div className='px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center'>
        <Link href='/' className='flex items-center group'>
          <div className='w-8 h-8 bg-gradient-to-r from-primary to-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200'>
            <ChefHat className='h-5 w-5 text-primary-foreground' />
          </div>
          <span className='ml-3 text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'>
            AI Petite
          </span>
        </Link>
        <div className='flex items-center space-x-4'>
          <Suspense fallback={<div className='h-9' />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className='flex flex-col min-h-screen bg-background'>
      <Header />
      {children}
    </section>
  );
}
