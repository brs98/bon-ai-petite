'use client';

import { MealCountSelector } from '@/components/meal-planning/MealCountSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { customerPortalAction } from '@/lib/payments/actions';
import { WeeklyMealPlanWithItems } from '@/types/recipe';
import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    ChefHat,
    Info,
    Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface MealCounts {
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  snackCount: number;
}

// Custom Alert component since it's not available in ui
function Alert({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}) {
  const bgColor =
    variant === 'destructive'
      ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';
  return <div className={`rounded-lg border p-4 ${bgColor} ${className}`}>{children}</div>;
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className='text-sm'>{children}</div>;
}

export default function WeeklyMealPlanningPage() {
  const router = useRouter();
  // Fetch the user's plan from the API
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [selectedCounts, setSelectedCounts] = useState<MealCounts>({
    breakfastCount: 0,
    lunchCount: 0,
    dinnerCount: 0,
    snackCount: 0,
  });
  const [existingPlans, setExistingPlans] = useState<WeeklyMealPlanWithItems[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalMeals = Object.values(selectedCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const hasValidSelection = totalMeals > 0;

  // Load existing meal plans
  useEffect(() => {
    const fetchExistingPlans = async () => {
      try {
        const response = await fetch('/api/meal-plans/weekly');
        if (!response.ok) {
          throw new Error('Failed to fetch meal plans');
        }
        const data = await response.json();
        setExistingPlans(data.mealPlans || []);
      } catch (error) {
        console.error('Error fetching meal plans:', error);
        setError('Failed to load existing meal plans');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchExistingPlans();
  }, []);

  // Fetch the user's plan from the API
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const user = await res.json();
          setUserPlan(user?.planName?.toLowerCase() || 'essential');
        } else {
          setUserPlan('essential');
        }
      } catch {
        setUserPlan('essential');
      }
    }
    void fetchUser();
  }, []);

  if (userPlan === null) {
    // Optionally show a loading spinner here
    return null;
  }

  const handleCreateNewPlan = async () => {
    if (!hasValidSelection) return;

    setIsCreating(true);
    setError(null);

    try {
      // TODO: Add Premium access checking here
      // if (!checkPremiumAccess()) {
      //   setError('Weekly meal planning is a Premium feature. Please upgrade your subscription.');
      //   return;
      // }

      // Generate default plan name and dates
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // End of current week (Saturday)

      const planName = `Weekly Plan - ${startDate.toLocaleDateString()}`;

      const response = await fetch('/api/meal-plans/weekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: planName,
          description: `Meal plan for week of ${startDate.toLocaleDateString()}`,
          startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          endDate: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          breakfastCount: selectedCounts.breakfastCount,
          lunchCount: selectedCounts.lunchCount,
          dinnerCount: selectedCounts.dinnerCount,
          snackCount: selectedCounts.snackCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meal plan');
      }

      const result = await response.json();
      const newPlan = result.mealPlan;

      // Navigate to the wizard page
      router.push(`/dashboard/meal-planning/weekly/${newPlan.id}`);
    } catch (error) {
      console.error('Error creating meal plan:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create meal plan',
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleResumePlan = (planId: number) => {
    router.push(`/dashboard/meal-planning/weekly/${planId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant='secondary'>In Progress</Badge>;
      case 'completed':
        return <Badge variant='default'>Completed</Badge>;
      case 'archived':
        return <Badge variant='outline'>Archived</Badge>;
      default:
        return <Badge variant='secondary'>{status}</Badge>;
    }
  };

  const formatPlanSummary = (plan: WeeklyMealPlanWithItems) => {
    const totalMeals =
      plan.breakfastCount +
      plan.lunchCount +
      plan.dinnerCount +
      plan.snackCount;
    const completedMeals =
      plan.mealPlanItems?.filter(item => item.status === 'generated').length || 0;

    return {
      totalMeals,
      completedMeals,
      progressPercentage:
        totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
    };
  };

  if (userPlan !== 'premium') {
    // Show only the premium alert, hide all other content
    return (
      <div className='container mx-auto px-4 py-8 flex items-center justify-center min-h-[300px]'>
        <Alert variant='default' className='w-full max-w-2xl flex items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <Info className='h-4 w-4' />
            <span>
              <strong>Premium Feature:</strong> Weekly meal planning is available to <span className='text-primary font-semibold'>Premium</span> subscribers only.
            </span>
          </div>
          <form action={customerPortalAction} className='flex-shrink-0'>
            <Button type='submit' variant='default' size='sm'>
              Upgrade Now
            </Button>
          </form>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center space-y-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
            <p className='text-muted-foreground'>Loading meal plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-8'>
      {/* Header */}
      <div className='text-center space-y-4'>
        <div className='flex items-center justify-center gap-3'>
          <ChefHat className='h-8 w-8 text-primary' />
          <h1 className='text-3xl font-bold'>Weekly Meal Planning</h1>
        </div>
        <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
          Create comprehensive weekly meal plans with AI-generated recipes and
          automatic shopping lists.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant='destructive'>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Existing Plans Section */}
      {existingPlans.length > 0 && (
        <div className='space-y-6'>
          <div className='flex items-center gap-2'>
            <Calendar className='h-5 w-5 text-muted-foreground' />
            <h2 className='text-xl font-semibold'>Your Meal Plans</h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {existingPlans.map(plan => {
              const summary = formatPlanSummary(plan);
              return (
                <Card
                  key={plan.id}
                  className='hover:shadow-md transition-shadow'
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg'>{plan.name}</CardTitle>
                      {getStatusBadge(plan.status)}
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      Created{' '}
                      {plan.createdAt
                        ? new Date(plan.createdAt).toLocaleDateString()
                        : 'Unknown'}
                    </p>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span>Progress</span>
                        <span>
                          {summary.completedMeals}/{summary.totalMeals} meals
                        </span>
                      </div>
                      <div className='w-full bg-secondary rounded-full h-2'>
                        <div
                          className='bg-primary h-2 rounded-full transition-all duration-300'
                          style={{ width: `${summary.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
                      <div>🌅 {plan.breakfastCount} breakfasts</div>
                      <div>🥙 {plan.lunchCount} lunches</div>
                      <div>🍽️ {plan.dinnerCount} dinners</div>
                      <div>🍎 {plan.snackCount} snacks</div>
                    </div>

                    <Button
                      onClick={() => void handleResumePlan(plan.id!)}
                      className='w-full'
                      variant={
                        plan.status === 'in_progress' ? 'default' : 'outline'
                      }
                    >
                      {plan.status === 'in_progress'
                        ? 'Continue Planning'
                        : 'View Plan'}
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Separator />
        </div>
      )}

      {/* Create New Plan Section */}
      <div className='space-y-6'>
        <div className='flex items-center gap-2'>
          <Plus className='h-5 w-5 text-muted-foreground' />
          <h2 className='text-xl font-semibold'>Create New Weekly Plan</h2>
        </div>

        <MealCountSelector
          initialCounts={selectedCounts}
          onCountsChange={setSelectedCounts}
          disabled={isCreating || userPlan !== 'premium'}
          maxTotalMeals={28} // TODO: Adjust based on subscription tier
        />

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Button
            onClick={() => void handleCreateNewPlan()}
            disabled={!hasValidSelection || isCreating || userPlan !== 'premium'}
            size='lg'
            className='sm:px-8'
          >
            {isCreating ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Creating Plan...
              </>
            ) : (
              <>
                <ChefHat className='mr-2 h-5 w-5' />
                Start Planning
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Information Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-12'>
        <Card>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <ChefHat className='h-5 w-5 text-primary' />
              AI-Generated Recipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Each meal is personally crafted by AI based on your nutrition
              profile and preferences.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Calendar className='h-5 w-5 text-primary' />
              Weekly Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Plan up to 7 meals per category with step-by-step guided meal
              generation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Plus className='h-5 w-5 text-primary' />
              Smart Shopping Lists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>
              Automatically consolidate ingredients with quantities organized by
              grocery store sections.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
