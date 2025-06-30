'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MealCounts {
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  snackCount: number;
}

interface MealCountSelectorProps {
  initialCounts?: MealCounts;
  onCountsChange?: (counts: MealCounts) => void;
  disabled?: boolean;
  maxTotalMeals?: number;
}

const MEAL_CATEGORIES = [
  {
    key: 'breakfastCount' as keyof MealCounts,
    label: 'Breakfasts',
    description: 'Start your day right',
    icon: '🌅',
  },
  {
    key: 'lunchCount' as keyof MealCounts,
    label: 'Lunches',
    description: 'Midday fuel',
    icon: '🥙',
  },
  {
    key: 'dinnerCount' as keyof MealCounts,
    label: 'Dinners',
    description: 'Evening satisfaction',
    icon: '🍽️',
  },
  {
    key: 'snackCount' as keyof MealCounts,
    label: 'Snacks',
    description: 'Quick bites',
    icon: '🍎',
  },
] as const;

export function MealCountSelector({
  initialCounts = {
    breakfastCount: 0,
    lunchCount: 0,
    dinnerCount: 0,
    snackCount: 0,
  },
  onCountsChange,
  disabled = false,
  maxTotalMeals = 28,
}: MealCountSelectorProps) {
  const [counts, setCounts] = useState<MealCounts>(initialCounts);

  // Calculate derived values
  const totalMeals = Object.values(counts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const hasValidSelection = totalMeals > 0;

  // Update parent component when counts change
  useEffect(() => {
    onCountsChange?.(counts);
  }, [counts, onCountsChange]);

  const handleIncrement = (category: keyof MealCounts) => {
    setCounts(prev => {
      const currentCount = prev[category];
      const newTotal = totalMeals - currentCount + (currentCount + 1);

      // Don't allow increment if it would exceed limits
      if (currentCount >= 7 || newTotal > maxTotalMeals) {
        return prev;
      }

      return {
        ...prev,
        [category]: currentCount + 1,
      };
    });
  };

  const handleDecrement = (category: keyof MealCounts) => {
    setCounts(prev => ({
      ...prev,
      [category]: Math.max(0, prev[category] - 1),
    }));
  };

  return (
    <div className='space-y-6'>
      {/* Meal Category Selectors */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {MEAL_CATEGORIES.map(category => (
          <Card
            key={category.key}
            className={`transition-all duration-200 ${
              counts[category.key] > 0
                ? 'ring-2 ring-primary/20 bg-primary/5'
                : 'hover:shadow-md'
            }`}
          >
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='text-2xl'>{category.icon}</span>
                  <div>
                    <CardTitle className='text-lg'>{category.label}</CardTitle>
                    <p className='text-sm text-muted-foreground'>
                      {category.description}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={counts[category.key] > 0 ? 'default' : 'secondary'}
                >
                  {counts[category.key]} meal
                  {counts[category.key] !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-center gap-4'>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => handleDecrement(category.key)}
                  disabled={disabled || counts[category.key] === 0}
                  className='h-10 w-10'
                >
                  <Minus className='h-4 w-4' />
                </Button>

                <div className='flex items-center justify-center min-w-12'>
                  <span className='text-2xl font-bold tabular-nums'>
                    {counts[category.key]}
                  </span>
                </div>

                <Button
                  variant='outline'
                  size='icon'
                  onClick={() => handleIncrement(category.key)}
                  disabled={
                    disabled ||
                    counts[category.key] >= 7 ||
                    totalMeals >= maxTotalMeals
                  }
                  className='h-10 w-10'
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>

              {/* Individual meal indicators */}
              {counts[category.key] > 0 && (
                <div className='mt-4 flex flex-wrap gap-1 justify-center'>
                  {Array.from({ length: counts[category.key] }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className='w-3 h-3 bg-primary rounded-full animate-in fade-in duration-200'
                        style={{ animationDelay: `${index * 50}ms` }}
                      />
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card
        className={`transition-all duration-200 ${
          hasValidSelection
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : ''
        }`}
      >
        <CardContent className='pt-6'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <Users className='h-5 w-5 text-muted-foreground' />
                <span className='font-medium'>
                  Total: {totalMeals} meal{totalMeals !== 1 ? 's' : ''}
                </span>
                {maxTotalMeals && (
                  <Badge variant='outline' className='text-xs'>
                    {totalMeals}/{maxTotalMeals} max
                  </Badge>
                )}
              </div>
            </div>

            {hasValidSelection && (
              <Badge className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'>
                Ready to generate
              </Badge>
            )}
          </div>

          {!hasValidSelection && (
            <p className='text-sm text-muted-foreground mt-2'>
              Select at least one meal to continue
            </p>
          )}

          {totalMeals >= maxTotalMeals && (
            <p className='text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1'>
              <span>⚠️</span>
              Maximum meal limit reached
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
