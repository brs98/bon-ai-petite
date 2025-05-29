import Link from 'next/link';
import { ChefHat } from 'lucide-react';

export default function NotFound() {
  return (
    <div className='flex items-center justify-center min-h-[100dvh] bg-gradient-to-br from-secondary via-background to-secondary'>
      <div className='max-w-md space-y-8 p-4 text-center'>
        <div className='flex justify-center'>
          <div className='w-16 h-16 bg-gradient-to-r from-primary to-primary rounded-2xl flex items-center justify-center'>
            <ChefHat className='h-8 w-8 text-primary-foreground' />
          </div>
        </div>
        <h1 className='text-4xl font-bold text-foreground tracking-tight'>
          404 - Page Not Found
        </h1>
        <p className='text-base text-muted-foreground'>
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link
          href='/'
          className='mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200'
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
