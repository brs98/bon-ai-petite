'use client';

import { MealPlanCard } from '@/components/meal-planning/MealPlanCard';
import { PreferenceOverride } from '@/components/meal-planning/PreferenceOverride';
import { WizardNavigation } from '@/components/meal-planning/WizardNavigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { WeeklyMealPlanWithItems, type NutritionProfile } from '@/types/recipe';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ChefHat,
  Clock,
  Settings,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Define preference overrides type based on the component interface
interface PreferenceOverrides {
  allergies?: string[];
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  maxPrepTime?: number;
  maxCookTime?: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

const CATEGORY_CONFIG = {
  breakfast: {
    label: 'Breakfasts',
    emoji: '🌅',
    description: 'Start your day with energy',
  },
  lunch: {
    label: 'Lunches',
    emoji: '🥙',
    description: 'Fuel your afternoon',
  },
  dinner: {
    label: 'Dinners',
    emoji: '🍽️',
    description: 'Satisfying evening meals',
  },
  snack: {
    label: 'Snacks',
    emoji: '🍎',
    description: 'Quick healthy bites',
  },
} as const;

// Custom Alert component
function Alert({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
}) {
  const bgColor =
    variant === 'destructive'
      ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';
  return <div className={`rounded-lg border p-4 ${bgColor}`}>{children}</div>;
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className='text-sm'>{children}</div>;
}

export default function WeeklyMealPlanWizardPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [mealPlan, setMealPlan] = useState<WeeklyMealPlanWithItems | null>(
    null,
  );
  const [currentCategory, setCurrentCategory] =
    useState<MealCategory>('breakfast');
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<NutritionProfile | null>(null);
  const [globalPreferences, setGlobalPreferences] =
    useState<PreferenceOverrides | null>(null);
  const [showPreferenceOverride, setShowPreferenceOverride] = useState(false);

  // Calculate wizard steps based on meal counts
  const getWizardSteps = useCallback((plan: WeeklyMealPlanWithItems) => {
    const steps: { category: MealCategory; count: number }[] = [];

    if (plan.breakfastCount > 0)
      steps.push({ category: 'breakfast', count: plan.breakfastCount });
    if (plan.lunchCount > 0)
      steps.push({ category: 'lunch', count: plan.lunchCount });
    if (plan.dinnerCount > 0)
      steps.push({ category: 'dinner', count: plan.dinnerCount });
    if (plan.snackCount > 0)
      steps.push({ category: 'snack', count: plan.snackCount });

    return steps;
  }, []);

  // Load meal plan data
  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        const response = await fetch(`/api/meal-plans/weekly/${planId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch meal plan');
        }
        const plan = await response.json();
        setMealPlan(plan);

        // Set initial category and step based on progress
        const steps = getWizardSteps(plan);
        if (steps.length > 0) {
          setCurrentCategory(steps[0].category);
          setCurrentStep(0);
        }

        // Load user nutrition profile for meal generation
        const profileResponse = await fetch('/api/nutrition/profile');
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching meal plan:', error);
        setError('Failed to load meal plan');
      } finally {
        setIsLoading(false);
      }
    };

    if (planId) {
      void fetchMealPlan();
    }
  }, [planId, getWizardSteps]);

  // Get meals for current category
  const getCurrentCategoryMeals = useCallback(() => {
    if (!mealPlan) return [];

    return mealPlan.mealPlanItems
      .filter(item => item.category === currentCategory)
      .sort((a, b) => a.dayNumber - b.dayNumber);
  }, [mealPlan, currentCategory]);

  // Check if current category is complete
  const isCategoryComplete = useCallback(() => {
    const meals = getCurrentCategoryMeals();
    return meals.length > 0 && meals.every(meal => meal.status === 'locked');
  }, [getCurrentCategoryMeals]);

  // Handle navigation between steps
  const handleNext = () => {
    if (!mealPlan) return;

    const steps = getWizardSteps(mealPlan);
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setCurrentCategory(steps[nextStep].category);
    } else {
      // All steps complete, navigate to shopping list
      router.push(`/dashboard/meal-planning/weekly/${planId}/shopping-list`);
    }
  };

  const handleBack = () => {
    if (!mealPlan) return;

    if (currentStep > 0) {
      const steps = getWizardSteps(mealPlan);
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setCurrentCategory(steps[prevStep].category);
    }
  };

  // Handle meal generation
  const handleGenerateMeal = async (
    mealId: number,
    customPreferences?: PreferenceOverrides,
  ) => {
    try {
      const response = await fetch(
        `/api/meal-plans/weekly/${planId}/meals/${mealId}/generate`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customPreferences: customPreferences || globalPreferences,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to generate meal');
      }

      // Refresh meal plan data
      const updatedPlanResponse = await fetch(
        `/api/meal-plans/weekly/${planId}`,
      );
      if (updatedPlanResponse.ok) {
        const updatedPlan = await updatedPlanResponse.json();
        setMealPlan(updatedPlan);
      }
    } catch (error) {
      console.error('Error generating meal:', error);
      setError('Failed to generate meal');
    }
  };

  // Handle meal lock
  const handleLockMeal = async (mealId: number) => {
    try {
      const response = await fetch(
        `/api/meal-plans/weekly/${planId}/meals/${mealId}/lock`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ locked: true }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to lock meal');
      }

      // Refresh meal plan data
      const updatedPlanResponse = await fetch(
        `/api/meal-plans/weekly/${planId}`,
      );
      if (updatedPlanResponse.ok) {
        const updatedPlan = await updatedPlanResponse.json();
        setMealPlan(updatedPlan);
      }
    } catch (error) {
      console.error('Error locking meal:', error);
      setError('Failed to lock meal');
    }
  };

  // Handle meal plan deletion
  const handleDeletePlan = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this meal plan? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/meal-plans/weekly/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal plan');
      }

      // Redirect back to meal planning page
      router.push('/dashboard/meal-planning/weekly');
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      setError('Failed to delete meal plan');
    }
  };

  // Handle viewing individual recipe details
  const handleViewRecipe = (recipeId: number) => {
    router.push(`/dashboard/recipes/${recipeId}`);
  };

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center space-y-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
            <p className='text-muted-foreground'>Loading meal plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mealPlan) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Alert variant='destructive'>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              {error || 'Meal plan not found'}
            </AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }

  const steps = getWizardSteps(mealPlan);
  const currentCategoryMeals = getCurrentCategoryMeals();
  const categoryComplete = isCategoryComplete();
  const totalSteps = steps.length;
  const completedSteps = steps.slice(0, currentStep + 1).filter((_, index) => {
    // Check if this step is actually complete
    const stepMeals = mealPlan.mealPlanItems.filter(
      item => item.category === steps[index].category,
    );
    return (
      stepMeals.length > 0 && stepMeals.every(meal => meal.status === 'locked')
    );
  }).length;

  return (
    <div className='container mx-auto px-4 py-8 space-y-8'>
      {/* Header */}
      <div className='text-center space-y-4'>
        <div className='flex items-center justify-center gap-3 relative'>
          <ChefHat className='h-8 w-8 text-primary' />
          <h1 className='text-3xl font-bold'>Weekly Meal Planning</h1>

          {/* Delete button positioned absolutely */}
          <Button
            variant='ghost'
            size='sm'
            onClick={() => void handleDeletePlan()}
            className='absolute right-0 text-destructive hover:text-destructive hover:bg-destructive/10'
            title='Delete this meal plan'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
        <p className='text-lg text-muted-foreground'>
          Step-by-step meal generation for your weekly plan
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

      {/* Wizard Navigation */}
      <WizardNavigation
        steps={steps.map((step, index) => ({
          id: `step-${step.category}`,
          category: step.category,
          label: CATEGORY_CONFIG[step.category].label,
          description: CATEGORY_CONFIG[step.category].description,
          icon: CATEGORY_CONFIG[step.category].emoji,
          mealCount: step.count,
          isComplete: mealPlan.mealPlanItems
            .filter(item => item.category === step.category)
            .every(meal => meal.status === 'locked'),
          isActive: index === currentStep,
          isSkipped: false,
        }))}
        currentStepIndex={currentStep}
        totalSteps={totalSteps}
        completedSteps={completedSteps}
        canGoBack={currentStep > 0}
        canGoNext={categoryComplete}
        canSkip={false}
        isGeneratingMeals={false}
        onBack={handleBack}
        onNext={handleNext}
        onStepClick={stepIndex => {
          setCurrentStep(stepIndex);
          setCurrentCategory(steps[stepIndex].category);
        }}
      />

      {/* Current Category Header */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <span className='text-3xl'>
              {CATEGORY_CONFIG[currentCategory].emoji}
            </span>
            <div>
              <h2 className='text-2xl font-bold'>
                {CATEGORY_CONFIG[currentCategory].label}
              </h2>
              <p className='text-muted-foreground'>
                {CATEGORY_CONFIG[currentCategory].description}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <Badge variant={categoryComplete ? 'default' : 'secondary'}>
              {currentCategoryMeals.filter(m => m.status === 'locked').length} /{' '}
              {currentCategoryMeals.length} complete
            </Badge>

            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowPreferenceOverride(!showPreferenceOverride)}
            >
              <Settings className='h-4 w-4 mr-2' />
              Preferences
            </Button>
          </div>
        </div>

        {/* Preference Override */}
        {showPreferenceOverride && (
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Category Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <PreferenceOverride
                currentPreferences={globalPreferences || undefined}
                userProfile={userProfile || undefined}
                onSave={setGlobalPreferences}
                onReset={() => setGlobalPreferences(null)}
                onCancel={() => setShowPreferenceOverride(false)}
                mealCategory={currentCategory}
                isGlobalOverride={true}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* Meal Cards Grid */}
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {currentCategoryMeals.map(meal => (
            <MealPlanCard
              key={meal.id}
              mealPlanItem={meal}
              recipe={meal.recipe}
              dayNumber={meal.dayNumber}
              category={meal.category}
              onGenerate={() => meal.id && void handleGenerateMeal(meal.id)}
              onRegenerate={() => meal.id && void handleGenerateMeal(meal.id)}
              onLock={() => meal.id && void handleLockMeal(meal.id)}
              onUnlock={() => meal.id && void handleLockMeal(meal.id)}
              onViewRecipe={
                meal.recipe?.id
                  ? () => handleViewRecipe(meal.recipe!.id!)
                  : undefined
              }
            />
          ))}
        </div>

        {/* Category Summary */}
        {currentCategoryMeals.length > 0 && (
          <Card
            className={`${categoryComplete ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : ''}`}
          >
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  {categoryComplete ? (
                    <CheckCircle className='h-6 w-6 text-green-600' />
                  ) : (
                    <Clock className='h-6 w-6 text-muted-foreground' />
                  )}
                  <div>
                    <p className='font-medium'>
                      {categoryComplete
                        ? 'Category Complete!'
                        : 'Category in Progress'}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {categoryComplete
                        ? 'All meals have been generated and locked. Ready to proceed.'
                        : 'Generate and lock all meals to continue to the next category.'}
                    </p>
                  </div>
                </div>

                {categoryComplete && (
                  <Badge variant='default' className='bg-green-600'>
                    <CheckCircle className='h-3 w-3 mr-1' />
                    Complete
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className='flex justify-between items-center pt-8'>
        <Button
          variant='outline'
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Previous Category
        </Button>

        <div className='text-center'>
          <p className='text-sm text-muted-foreground'>
            Step {currentStep + 1} of {totalSteps}
          </p>
          <p className='text-xs text-muted-foreground'>
            {completedSteps} / {totalSteps} categories complete
          </p>
        </div>

        <Button
          onClick={handleNext}
          disabled={!categoryComplete}
          className='min-w-[140px]'
        >
          {currentStep === totalSteps - 1 ? (
            <>
              <ShoppingCart className='h-4 w-4 mr-2' />
              Shopping List
            </>
          ) : (
            <>
              Next Category
              <ArrowRight className='h-4 w-4 ml-2' />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
