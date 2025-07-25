'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function SubmitButton({
  planId,
  popular = false,
}: {
  planId: string;
  popular?: boolean;
}) {
  return (
    <Link href={`/sign-up?plan=${planId}`}>
      <Button
        variant={popular ? 'default' : 'outline'}
        className={`w-full rounded-xl transition-all duration-300 transform hover:scale-105 ${
          popular
            ? 'bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl'
            : 'border-2 border-accent/30 hover:border-accent bg-white/50 backdrop-blur-sm text-foreground hover:text-accent-foreground hover:bg-accent/5'
        }`}
      >
        {popular ? 'Start Free Trial' : 'Get Started'}
        <ArrowRight className='ml-2 h-4 w-4' />
      </Button>
    </Link>
  );
}
