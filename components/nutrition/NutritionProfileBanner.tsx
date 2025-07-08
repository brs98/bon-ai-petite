'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type NutritionProfile } from '@/types/recipe';
import { ArrowRight, Utensils, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NutritionProfileBannerProps {
  className?: string;
}

export function NutritionProfileBanner({
  className,
}: NutritionProfileBannerProps) {
  const [profile, setProfile] = useState<NutritionProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('nutrition-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      setIsLoading(false);
      return;
    }

    // Fetch nutrition profile
    void fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/nutrition/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('nutrition-banner-dismissed', 'true');
  };

  // Don't show if loading, dismissed, or profile exists
  if (isLoading || isDismissed || profile) {
    return null;
  }

  return (
    <Card
      className={`border-l-4 border-l-primary bg-primary/10 dark:bg-primary/20 ${className}`}
    >
      <CardContent className='p-4'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start space-x-3 flex-1'>
            <div className='p-2 bg-primary/10 dark:bg-primary/20 rounded-lg mt-0.5'>
              <Utensils className='h-5 w-5 text-primary dark:text-primary-foreground' />
            </div>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <h3 className='font-semibold text-muted-foreground dark:text-primary'>
                  Set Up Your Nutrition Profile
                </h3>
                <Badge variant='secondary' className='text-xs'>
                  Recommended
                </Badge>
              </div>
              <p className='text-sm text-primary dark:text-primary-foreground mb-3'>
                Get personalized recipe recommendations by setting up your
                dietary goals, restrictions, and preferences. Takes less than 2
                minutes!
              </p>
              <div className='flex items-center gap-3'>
                <Button
                  asChild
                  size='sm'
                  className='bg-primary hover:bg-primary/80 text-primary-foreground'
                >
                  <Link href='/settings/nutrition'>
                    Get Started
                    <ArrowRight className='h-4 w-4 ml-1' />
                  </Link>
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleDismiss}
                  className='text-primary hover:text-primary-foreground hover:bg-primary/10 dark:text-primary-foreground dark:hover:text-primary dark:hover:bg-primary/20'
                >
                  Maybe later
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleDismiss}
            className='p-1 h-auto text-primary hover:text-primary-foreground hover:bg-primary/10 dark:text-primary-foreground dark:hover:text-primary dark:hover:bg-primary/20'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
