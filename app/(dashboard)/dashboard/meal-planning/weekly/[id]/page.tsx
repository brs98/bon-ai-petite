'use client';

import { FunLoadingOverlay } from '@/components/meal-planning/FunLoadingOverlay';
import { MealPlanCard } from '@/components/meal-planning/MealPlanCard';
import { ShoppingList } from '@/components/meal-planning/ShoppingList';
import { Button } from '@/components/ui/button';
import {
  ShoppingList as ShoppingListType,
  WeeklyMealPlanWithItems,
} from '@/types/recipe';
import { ChefHat, RefreshCw, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Category order for sorting
const CATEGORY_ORDER: MealCategory[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
];

export default function WeeklyMealPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [mealPlan, setMealPlan] = useState<WeeklyMealPlanWithItems | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListType | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<'meals' | 'shopping'>('meals');
  const [selectedMealIds, setSelectedMealIds] = useState<number[]>([]);

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
      } catch (error) {
        console.error('Error fetching meal plan:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (planId) {
      void fetchMealPlan();
    }
  }, [planId]);

  // Batch generate all pending meals on initial load
  useEffect(() => {
    if (!mealPlan || isGenerating) return;
    const pendingMeals = mealPlan.mealPlanItems.filter(
      item => item.status === 'pending',
    );
    if (pendingMeals.length > 0) {
      setIsGenerating(true);
      void (async () => {
        try {
          const mealRes = await fetch(
            `/api/meal-plans/weekly/${planId}/meals/generate`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mealIds: pendingMeals.map(m => m.id) }),
            },
          );
          const mealData = await mealRes.json();
          if (mealData.mealPlan) setMealPlan(mealData.mealPlan);
          // After meals are generated, generate the shopping list
          const shopRes = await fetch(
            `/api/meal-plans/weekly/${planId}/shopping-list`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            },
          );
          const shopData = await shopRes.json();
          if (shopData.shoppingList) setShoppingList(shopData.shoppingList);
        } catch (err) {
          console.error('Error:', err);
        } finally {
          setIsGenerating(false);
        }
      })();
    } else if (!shoppingList) {
      // If meals are already generated, fetch the shopping list
      void fetch(`/api/meal-plans/weekly/${planId}/shopping-list`)
        .then(res => res.json())
        .then(data => {
          if (data.shoppingList) setShoppingList(data.shoppingList);
        });
    }
  }, [mealPlan, planId, isGenerating, shoppingList]);

  // Handle meal regeneration (batch)
  const handleRegenerateSelected = async () => {
    if (!mealPlan || selectedMealIds.length === 0) return;
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/meal-plans/weekly/${planId}/meals/generate`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mealIds: selectedMealIds }),
        },
      );
      const data = await response.json();
      if (data.mealPlan) {
        setMealPlan(data.mealPlan);
        setSelectedMealIds([]);
        // Regenerate shopping list after meals are regenerated
        await fetch(`/api/meal-plans/weekly/${planId}/shopping-list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
          .then(res => res.json())
          .then(data => {
            if (data.shoppingList) setShoppingList(data.shoppingList);
          });
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle meal plan deletion
  const handleDeletePlan = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this meal plan? This action cannot be undone.',
      )
    )
      return;
    try {
      const response = await fetch(`/api/meal-plans/weekly/${planId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete meal plan');
      router.push('/dashboard/meal-planning/weekly');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle viewing individual recipe details
  const handleViewRecipe = (recipeId: number) => {
    router.push(`/dashboard/recipes/${recipeId}`);
  };

  // Handle selection for regeneration
  const handleSelectMeal = (mealId: number, selected: boolean) => {
    setSelectedMealIds(prev =>
      selected ? [...prev, mealId] : prev.filter(id => id !== mealId),
    );
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

  // Show fun loading overlay while generating
  if (isGenerating) {
    return <FunLoadingOverlay />;
  }

  // Tab UI
  const tabButtonClass = (tab: 'meals' | 'shopping') =>
    `px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 focus:outline-none ${
      activeTab === tab
        ? 'bg-primary text-white shadow'
        : 'bg-muted text-muted-foreground hover:bg-primary/10'
    }`;

  return (
    <div className='container mx-auto px-4 py-8 space-y-8'>
      {/* Header */}
      <div className='text-center space-y-4'>
        <div className='flex items-center justify-center gap-3 relative'>
          <ChefHat className='h-8 w-8 text-primary' />
          <h1 className='text-3xl font-bold'>Weekly Meal Planning</h1>
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
          Your AI-generated meal plan for the week
        </p>
      </div>

      {/* Tabs */}
      <div className='flex justify-center border-b border-muted mb-6'>
        <button
          className={tabButtonClass('meals')}
          onClick={() => setActiveTab('meals')}
          type='button'
        >
          Meals
        </button>
        <button
          className={tabButtonClass('shopping')}
          onClick={() => setActiveTab('shopping')}
          type='button'
        >
          Shopping List
        </button>
      </div>

      {/* Prompt for batch regeneration */}
      {activeTab === 'meals' && (
        <div className='text-center mb-2'>
          <span className='text-base text-muted-foreground'>
            Click on any meal card to select it for regeneration. When ready,
            click <b>Regenerate Selected</b>.
          </span>
        </div>
      )}

      {/* Regenerate Selected Button (only in Meals tab) */}
      {activeTab === 'meals' && (
        <div className='flex justify-end mb-4'>
          <Button
            onClick={() => void handleRegenerateSelected()}
            disabled={selectedMealIds.length === 0 || isGenerating}
            variant='outline'
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            Regenerate Selected
          </Button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'meals' ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {mealPlan &&
            mealPlan.mealPlanItems
              .slice()
              .sort((a, b) => {
                // Sort by category order, then by dayNumber
                const catA = CATEGORY_ORDER.indexOf(a.category as MealCategory);
                const catB = CATEGORY_ORDER.indexOf(b.category as MealCategory);
                if (catA !== catB) return catA - catB;
                return a.dayNumber - b.dayNumber;
              })
              .map(meal => (
                <MealPlanCard
                  key={meal.id}
                  mealPlanItem={meal}
                  recipe={meal.recipe}
                  dayNumber={meal.dayNumber}
                  category={meal.category}
                  onGenerate={() => {}}
                  onRegenerate={() => {}}
                  onViewRecipe={
                    meal.recipe?.id
                      ? () => handleViewRecipe(meal.recipe!.id!)
                      : undefined
                  }
                  selected={selectedMealIds.includes(meal.id!)}
                  // Make the entire card clickable for selection
                  onSelectChange={() =>
                    handleSelectMeal(
                      meal.id!,
                      !selectedMealIds.includes(meal.id!),
                    )
                  }
                  disabled={isGenerating}
                />
              ))}
        </div>
      ) : (
        <div>
          {shoppingList ? (
            <ShoppingList
              ingredients={shoppingList.ingredients}
              planName={mealPlan ? mealPlan.name : ''}
              onIngredientToggle={() => {}}
              onIngredientEdit={() => {}}
              onIngredientAdd={() => {}}
              onIngredientRemove={() => {}}
              isEditable={false}
              showRecipeOrigins={true}
              disabled={isGenerating}
            />
          ) : (
            <div className='text-center text-muted-foreground'>
              No shopping list found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
