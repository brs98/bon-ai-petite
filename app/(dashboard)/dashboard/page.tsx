import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentSuccessBanner } from '@/components/ui/PaymentSuccessBanner';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { nutritionProfiles, weeklyMealPlans } from '@/lib/db/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Calendar,
  Clock,
  Heart,
  Plus,
  Target,
  Utensils,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

// Helper function to get current week date range
function getCurrentWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // Start of week: Sunday (0) or Monday (1) depending on convention
  // This code uses Monday as start of week
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

// Helper function to format goal text
function formatGoal(goal: string) {
  const goalMap: Record<string, string> = {
    lose_weight: 'Lose Weight',
    gain_weight: 'Gain Weight',
    maintain_weight: 'Maintain Weight',
    gain_muscle: 'Gain Muscle',
    improve_health: 'Improve Health',
  };
  return goalMap[goal] || goal;
}

// Helper function to format activity level
function formatActivityLevel(level: string) {
  const levelMap: Record<string, string> = {
    sedentary: 'Sedentary',
    lightly_active: 'Lightly Active',
    moderately_active: 'Moderately Active',
    very_active: 'Very Active',
    extremely_active: 'Extremely Active',
  };
  return levelMap[level] || level;
}

async function getDashboardData() {
  const user = await getUser();
  if (!user) return null;

  // Get nutrition profile
  const nutritionProfile = await db.query.nutritionProfiles.findFirst({
    where: eq(nutritionProfiles.userId, user.id),
  });

  // Get current week meal plan
  const weekRange = getCurrentWeekRange();
  const currentWeekPlan = await db.query.weeklyMealPlans.findFirst({
    where: and(
      eq(weeklyMealPlans.userId, user.id),
      gte(weeklyMealPlans.startDate, weekRange.start),
      lte(weeklyMealPlans.endDate, weekRange.end),
    ),
    with: {
      mealPlanItems: {
        with: {
          recipe: true,
        },
      },
    },
    orderBy: [desc(weeklyMealPlans.createdAt)],
  });

  // Get all plans for debug UI if needed
  const allPlans = await db.query.weeklyMealPlans.findMany({
    where: eq(weeklyMealPlans.userId, user.id),
    orderBy: [desc(weeklyMealPlans.createdAt)],
  });

  // Get recent meal plans count
  const recentPlansCount = await db.$count(
    weeklyMealPlans,
    eq(weeklyMealPlans.userId, user.id),
  );

  return {
    user,
    nutritionProfile,
    currentWeekPlan,
    recentPlansCount,
    allPlans, // for debug UI
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <section className='flex-1 p-4 lg:p-8'>
        <div className='text-center py-12'>
          <p className='text-muted-foreground'>
            Please sign in to view your dashboard.
          </p>
        </div>
      </section>
    );
  }

  const { user, nutritionProfile, currentWeekPlan, allPlans } = data;

  // Calculate meal plan progress
  const totalMeals = currentWeekPlan?.totalMeals || 0;
  const generatedMeals =
    currentWeekPlan?.mealPlanItems?.filter(item => item.status === 'generated')
      .length || 0;
  const progressPercentage =
    totalMeals > 0 ? (generatedMeals / totalMeals) * 100 : 0;

  return (
    <section className='flex-1 p-4 lg:p-8 space-y-8'>
      <Suspense fallback={null}>
        <PaymentSuccessBanner />
      </Suspense>
      {/* Header */}
      <div className='space-y-2'>
        <h1 className='text-3xl lg:text-4xl font-bold text-foreground'>
          {user.name ? `Welcome, ${user.name}!` : 'Welcome!'}
        </h1>
        <p className='text-lg text-muted-foreground'>
          Here's your nutrition and meal planning overview
        </p>
      </div>

      {/* Nutrition Profile Overview */}
      {nutritionProfile ? (
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Target className='h-5 w-5 text-primary' />
            <h2 className='text-xl font-semibold'>Your Nutrition Goals</h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card className='border-primary/20'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                  <Award className='h-4 w-4' />
                  Primary Goal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-primary'>
                  {formatGoal(
                    Array.isArray(nutritionProfile.goals)
                      ? nutritionProfile.goals[0] || ''
                      : '',
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                  <Zap className='h-4 w-4' />
                  Daily Calories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {nutritionProfile.dailyCalories || 'Not set'}
                  {nutritionProfile.dailyCalories && (
                    <span className='text-sm font-normal text-muted-foreground ml-1'>
                      kcal
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                  <Activity className='h-4 w-4' />
                  Activity Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {formatActivityLevel(nutritionProfile.activityLevel || '')}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                  <BarChart3 className='h-4 w-4' />
                  Macros (P/C/F)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-lg font-bold'>
                  {nutritionProfile.macroProtein || 0}g /{' '}
                  {nutritionProfile.macroCarbs || 0}g /{' '}
                  {nutritionProfile.macroFat || 0}g
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dietary preferences */}
          {(nutritionProfile.allergies?.length ||
            nutritionProfile.dietaryRestrictions?.length ||
            nutritionProfile.cuisinePreferences?.length) && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <Heart className='h-5 w-5 text-red-500' />
                  Your Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {nutritionProfile.allergies?.length && (
                  <div>
                    <p className='text-sm font-medium text-muted-foreground mb-2'>
                      Allergies
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {nutritionProfile.allergies.map(allergy => (
                        <Badge
                          key={allergy}
                          variant='destructive'
                          className='text-xs'
                        >
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {nutritionProfile.dietaryRestrictions?.length && (
                  <div>
                    <p className='text-sm font-medium text-muted-foreground mb-2'>
                      Dietary Restrictions
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {nutritionProfile.dietaryRestrictions.map(restriction => (
                        <Badge
                          key={restriction}
                          variant='secondary'
                          className='text-xs'
                        >
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {nutritionProfile.cuisinePreferences?.length && (
                  <div>
                    <p className='text-sm font-medium text-muted-foreground mb-2'>
                      Favorite Cuisines
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {nutritionProfile.cuisinePreferences.map(cuisine => (
                        <Badge
                          key={cuisine}
                          variant='outline'
                          className='text-xs'
                        >
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className='border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800'>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2 text-amber-800 dark:text-amber-200'>
              <Utensils className='h-5 w-5' />
              Set Up Your Nutrition Profile
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-amber-700 dark:text-amber-300'>
              Get personalized recipe recommendations by setting up your
              nutrition goals and preferences.
            </p>
            <Button asChild className='bg-amber-600 hover:bg-amber-700'>
              <Link href='/dashboard/settings/nutrition'>
                Set Up Profile
                <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current Week Meal Plan */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Calendar className='h-5 w-5 text-primary' />
            <h2 className='text-xl font-semibold'>This Week's Meal Plan</h2>
          </div>
          {currentWeekPlan && (
            <Badge variant='outline' className='text-xs'>
              {currentWeekPlan.status.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </div>

        {currentWeekPlan ? (
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg'>
                    {currentWeekPlan.name}
                  </CardTitle>
                  <Button asChild size='sm' variant='outline'>
                    <Link
                      href={`/dashboard/meal-planning/weekly/${currentWeekPlan.id}`}
                    >
                      View Plan
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Link>
                  </Button>
                </div>
                {currentWeekPlan.description && (
                  <p className='text-sm text-muted-foreground'>
                    {currentWeekPlan.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Progress */}
                <div>
                  <div className='flex items-center justify-between text-sm mb-2'>
                    <span className='text-muted-foreground'>
                      Meal Generation Progress
                    </span>
                    <span className='font-medium'>
                      {generatedMeals}/{totalMeals} meals
                    </span>
                  </div>
                  <Progress value={progressPercentage} className='h-2' />
                </div>

                {/* Meal counts */}
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div className='text-center p-3 bg-muted/50 rounded-lg'>
                    <div className='text-lg font-bold text-orange-600'>
                      {currentWeekPlan.breakfastCount}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Breakfasts
                    </div>
                  </div>
                  <div className='text-center p-3 bg-muted/50 rounded-lg'>
                    <div className='text-lg font-bold text-green-600'>
                      {currentWeekPlan.lunchCount}
                    </div>
                    <div className='text-xs text-muted-foreground'>Lunches</div>
                  </div>
                  <div className='text-center p-3 bg-muted/50 rounded-lg'>
                    <div className='text-lg font-bold text-secondary-foreground'>
                      {currentWeekPlan.dinnerCount}
                    </div>
                    <div className='text-xs text-muted-foreground'>Dinners</div>
                  </div>
                  <div className='text-center p-3 bg-muted/50 rounded-lg'>
                    <div className='text-lg font-bold text-purple-600'>
                      {currentWeekPlan.snackCount}
                    </div>
                    <div className='text-xs text-muted-foreground'>Snacks</div>
                  </div>
                </div>

                {/* Quick actions for meal plan */}
                <div className='flex gap-2 pt-2'>
                  <Button asChild size='sm' variant='outline'>
                    <Link
                      href={`/dashboard/meal-planning/weekly/${currentWeekPlan.id}/shopping-list`}
                    >
                      <Clock className='mr-2 h-4 w-4' />
                      Shopping List
                    </Link>
                  </Button>
                  {progressPercentage < 100 && (
                    <Button asChild size='sm'>
                      <Link
                        href={`/dashboard/meal-planning/weekly/${currentWeekPlan.id}`}
                      >
                        Continue Planning
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <Card className='border-dashed border-2'>
              <CardHeader className='text-center'>
                <CardTitle className='text-lg flex items-center justify-center gap-2'>
                  <Calendar className='h-5 w-5 text-muted-foreground' />
                  No Meal Plan This Week
                </CardTitle>
              </CardHeader>
              <CardContent className='text-center space-y-4'>
                <p className='text-muted-foreground'>
                  Start planning your meals for the week to get personalized
                  recipes and shopping lists.
                </p>
                <Button asChild>
                  <Link href='/dashboard/meal-planning/weekly'>
                    <Plus className='mr-2 h-4 w-4' />
                    Create Meal Plan
                  </Link>
                </Button>
              </CardContent>
            </Card>
            {/* Debug UI: Show all plans if no current week plan is found */}
            {allPlans && allPlans.length > 0 && (
              <div className='mt-8 p-4 border rounded bg-muted/30'>
                <h3 className='font-semibold mb-2 text-sm'>
                  Debug: All Your Meal Plans
                </h3>
                <div className='overflow-x-auto'>
                  <table className='text-xs w-full'>
                    <thead>
                      <tr>
                        <th className='px-2 py-1 text-left'>Name</th>
                        <th className='px-2 py-1 text-left'>Start Date</th>
                        <th className='px-2 py-1 text-left'>End Date</th>
                        <th className='px-2 py-1 text-left'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPlans.map(plan => (
                        <tr key={plan.id}>
                          <td className='px-2 py-1'>{plan.name}</td>
                          <td className='px-2 py-1'>
                            {plan.startDate?.toString?.() || plan.startDate}
                          </td>
                          <td className='px-2 py-1'>
                            {plan.endDate?.toString?.() || plan.endDate}
                          </td>
                          <td className='px-2 py-1'>{plan.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className='mt-2 text-muted-foreground'>
                  If you see a plan for this week but it is not showing above,
                  check the date logic and plan status.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
