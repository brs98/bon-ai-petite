'use client';

import { ShoppingList } from '@/components/meal-planning/ShoppingList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShoppingList as ShoppingListType,
  WeeklyMealPlanWithItems,
} from '@/types/recipe';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChefHat,
  Download,
  Printer,
  RefreshCw,
  Share2,
  ShoppingCart,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
      : 'bg-secondary border-secondary dark:bg-secondary dark:border-secondary';
  return <div className={`rounded-lg border p-4 ${bgColor}`}>{children}</div>;
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className='text-sm'>{children}</div>;
}

export default function ShoppingListPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [mealPlan, setMealPlan] = useState<WeeklyMealPlanWithItems | null>(
    null,
  );
  const [shoppingList, setShoppingList] = useState<ShoppingListType | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load meal plan and shopping list data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const planResponse = await fetch(`/api/meal-plans/weekly/${planId}`);
        if (!planResponse.ok) {
          throw new Error('Failed to fetch meal plan');
        }
        const plan = await planResponse.json();
        setMealPlan(plan);

        // Try to load existing shopping list
        try {
          const shoppingResponse = await fetch(
            `/api/meal-plans/weekly/${planId}/shopping-list`,
          );
          if (shoppingResponse.ok) {
            const shopping = await shoppingResponse.json();
            setShoppingList(shopping.shoppingList);
          }
        } catch {
          console.log('No existing shopping list found');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load meal plan');
      } finally {
        setIsLoading(false);
      }
    };

    if (planId) {
      void fetchData();
    }
  }, [planId]);

  // Generate shopping list
  const handleGenerateShoppingList = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/meal-plans/weekly/${planId}/shopping-list`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate shopping list');
      }

      const newShoppingList = await response.json();
      setShoppingList(newShoppingList.shoppingList);
    } catch (error) {
      console.error('Error generating shopping list:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to generate shopping list',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Export shopping list
  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    if (!shoppingList) return;

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(shoppingList, null, 2);
        filename = `shopping-list-${planId}.json`;
        mimeType = 'application/json';
        break;
      case 'csv': {
        const csvRows = [
          'Item,Quantity,Unit,Category,Checked',
          ...shoppingList.ingredients.map(
            ingredient =>
              `"${ingredient.name}","${ingredient.quantity}","${ingredient.unit}","${ingredient.category || 'Other'}","${ingredient.checked}"`,
          ),
        ];
        content = csvRows.join('\n');
        filename = `shopping-list-${planId}.csv`;
        mimeType = 'text/csv';
        break;
      }
      case 'txt': {
        const categories = [
          ...new Set(shoppingList.ingredients.map(i => i.category || 'Other')),
        ];
        const txtLines = categories.map(category => {
          const items = shoppingList.ingredients.filter(
            i => (i.category || 'Other') === category,
          );
          return [
            `\n${category.toUpperCase()}:`,
            ...items.map(
              item => `• ${item.quantity} ${item.unit} ${item.name}`,
            ),
          ].join('\n');
        });
        content = `Shopping List for ${mealPlan?.name || 'Weekly Meal Plan'}\n${txtLines.join('\n')}`;
        filename = `shopping-list-${planId}.txt`;
        mimeType = 'text/plain';
        break;
      }
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print shopping list
  const handlePrint = () => {
    if (!shoppingList || !mealPlan) return;

    const printContent = `
      <html>
        <head>
          <title>Shopping List - ${mealPlan.name}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; margin-bottom: 15px; }
            ul { list-style: none; padding: 0; }
            li { padding: 5px 0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; }
            .checkbox { width: 20px; height: 20px; border: 2px solid #ddd; margin-right: 10px; display: inline-block; }
            .checked { background-color: #4ade80; border-color: #22c55e; }
            .quantity { font-weight: bold; margin-right: 5px; }
            .summary { background-color: #f9f9f9; padding: 15px; margin-top: 20px; border-radius: 5px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Shopping List</h1>
          <p><strong>Meal Plan:</strong> ${mealPlan.name}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          
          ${[
            ...new Set(
              shoppingList.ingredients.map(i => i.category || 'Other'),
            ),
          ]
            .map(
              category => `
            <h2>${category.toUpperCase()}</h2>
            <ul>
              ${shoppingList.ingredients
                .filter(i => (i.category || 'Other') === category)
                .map(
                  item => `
                  <li>
                    <span class="checkbox ${item.checked ? 'checked' : ''}"></span>
                    <span class="quantity">${item.quantity} ${item.unit}</span>
                    ${item.name}
                  </li>
                `,
                )
                .join('')}
            </ul>
          `,
            )
            .join('')}
          
          <div class="summary">
            <strong>Total Items:</strong> ${shoppingList.totalItems} | 
            <strong>Completed:</strong> ${shoppingList.checkedItems}/${shoppingList.totalItems}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // Share shopping list
  const handleShare = async () => {
    if (!mealPlan || !shoppingList) return;

    const shareText = `Shopping List for ${mealPlan.name}\n\n${[
      ...new Set(shoppingList.ingredients.map(i => i.category || 'Other')),
    ]
      .map(category => {
        const items = shoppingList.ingredients.filter(
          i => (i.category || 'Other') === category,
        );
        return `${category.toUpperCase()}:\n${items.map(item => `• ${item.quantity} ${item.unit} ${item.name}`).join('\n')}`;
      })
      .join('\n\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Shopping List - ${mealPlan.name}`,
          text: shareText,
        });
      } catch {
        console.log('Share canceled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        // You could show a toast notification here
        alert('Shopping list copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
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
            <p className='text-muted-foreground'>Loading shopping list...</p>
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

  const completedMeals =
    mealPlan.mealPlanItems?.filter(item => item.status === 'generated')
      .length || 0;
  const totalMeals =
    mealPlan.breakfastCount +
    mealPlan.lunchCount +
    mealPlan.dinnerCount +
    mealPlan.snackCount;
  const planComplete = completedMeals === totalMeals;

  return (
    <div className='container mx-auto px-4 py-8 space-y-8'>
      {/* Header */}
      <div className='space-y-4'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' size='sm' onClick={() => router.back()}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Plan
          </Button>

          <div className='flex-1'>
            <div className='flex items-center gap-3'>
              <ShoppingCart className='h-8 w-8 text-primary' />
              <div>
                <h1 className='text-3xl font-bold'>Shopping List</h1>
                <p className='text-muted-foreground'>{mealPlan.name}</p>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Badge variant={planComplete ? 'default' : 'secondary'}>
              {completedMeals}/{totalMeals} meals planned
            </Badge>
          </div>
        </div>

        {/* Plan Summary */}
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Calendar className='h-5 w-5 text-muted-foreground' />
                <div>
                  <p className='font-medium'>Weekly Meal Plan</p>
                  <p className='text-sm text-muted-foreground'>
                    {mealPlan.breakfastCount} breakfasts, {mealPlan.lunchCount}{' '}
                    lunches, {mealPlan.dinnerCount} dinners,{' '}
                    {mealPlan.snackCount} snacks
                  </p>
                </div>
              </div>

              {planComplete ? (
                <div className='flex items-center gap-2 text-primary'>
                  <CheckCircle2 className='h-5 w-5' />
                  <span className='text-sm font-medium'>Plan Complete</span>
                </div>
              ) : (
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <ChefHat className='h-5 w-5' />
                  <span className='text-sm'>In Progress</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Meal Overview Section */}
        {mealPlan.mealPlanItems && mealPlan.mealPlanItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ChefHat className='h-5 w-5' />
                Meals in This Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {mealPlan.mealPlanItems
                  .filter(item => item.status === 'generated' && item.recipe)
                  .map(item => (
                    <div
                      key={item.id}
                      className='border rounded-lg p-4 hover:shadow-md transition-shadow'
                    >
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <Badge variant='outline' className='text-xs'>
                            {item.category} • Day {item.dayNumber}
                          </Badge>
                          <Badge variant='secondary' className='text-xs'>
                            {item.recipe?.nutrition.calories} cal
                          </Badge>
                        </div>
                        <h4 className='font-medium line-clamp-2'>
                          {item.recipe?.name}
                        </h4>
                        {item.recipe?.description && (
                          <p className='text-sm text-muted-foreground line-clamp-2'>
                            {item.recipe.description}
                          </p>
                        )}
                        <Button
                          variant='outline'
                          size='sm'
                          className='w-full mt-2'
                          onClick={() =>
                            item.recipe?.id && handleViewRecipe(item.recipe.id)
                          }
                        >
                          View Recipe
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>

              {mealPlan.mealPlanItems.filter(
                item => item.status === 'generated',
              ).length === 0 && (
                <div className='text-center py-8'>
                  <ChefHat className='h-12 w-12 text-muted-foreground mx-auto mb-3' />
                  <p className='text-muted-foreground'>
                    No generated meals yet. Complete your meal planning to see
                    recipes here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
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

      {/* Shopping List Content */}
      {!shoppingList ? (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ShoppingCart className='h-5 w-5' />
              Generate Shopping List
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {!planComplete && (
              <Alert>
                <div className='flex items-center gap-2'>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Note:</strong> Your meal plan is not complete. The
                    shopping list will only include ingredients from generated
                    meals.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className='text-center py-8'>
              <ShoppingCart className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-semibold mb-2'>Ready to Shop?</h3>
              <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
                Generate a consolidated shopping list from all your planned
                meals. Ingredients will be organized by grocery store sections.
              </p>

              <Button
                onClick={() => void handleGenerateShoppingList()}
                disabled={isGenerating || completedMeals === 0}
                size='lg'
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                    Generating...
                  </>
                ) : (
                  <>
                    <ShoppingCart className='h-4 w-4 mr-2' />
                    Generate Shopping List
                  </>
                )}
              </Button>

              {completedMeals === 0 && (
                <div className='mt-6 space-y-4'>
                  <p className='text-sm text-muted-foreground'>
                    You need at least one generated meal to generate a shopping
                    list.
                    <br />
                    <strong>Next steps:</strong>
                    <br />
                    1. Go back to your meal plan
                    <br />
                    2. Generate recipes for your meals
                    <br />
                    3. Generate the meals you want to include
                    <br />
                    4. Return here to generate your shopping list
                  </p>

                  <Button
                    onClick={() =>
                      router.push(`/dashboard/meal-planning/weekly/${planId}`)
                    }
                    variant='outline'
                  >
                    <ArrowLeft className='h-4 w-4 mr-2' />
                    Go to Meal Plan
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {/* Action Buttons */}
          <div className='flex flex-wrap gap-4'>
            <Button
              onClick={() => void handleGenerateShoppingList()}
              variant='outline'
              size='sm'
              disabled={isGenerating}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`}
              />
              Regenerate
            </Button>

            <Button onClick={() => handlePrint()} variant='outline' size='sm'>
              <Printer className='h-4 w-4 mr-2' />
              Print
            </Button>

            <Button
              onClick={() => void handleShare()}
              variant='outline'
              size='sm'
            >
              <Share2 className='h-4 w-4 mr-2' />
              Share
            </Button>

            <div className='flex gap-2'>
              <Button
                onClick={() => handleExport('json')}
                variant='outline'
                size='sm'
              >
                <Download className='h-4 w-4 mr-2' />
                JSON
              </Button>
              <Button
                onClick={() => handleExport('csv')}
                variant='outline'
                size='sm'
              >
                <Download className='h-4 w-4 mr-2' />
                CSV
              </Button>
              <Button
                onClick={() => handleExport('txt')}
                variant='outline'
                size='sm'
              >
                <Download className='h-4 w-4 mr-2' />
                TXT
              </Button>
            </div>
          </div>

          {/* Shopping List Component */}
          <ShoppingList
            ingredients={shoppingList.ingredients.map(ingredient => ({
              ...ingredient,
              id: ingredient.name, // Use name as ID for operations
            }))}
            planName={mealPlan.name}
            onIngredientToggle={(ingredientId, checked) => {
              void (async () => {
                if (!shoppingList) return;
                // Optimistically update UI
                const updatedIngredients = shoppingList.ingredients.map(
                  ingredient => {
                    if (ingredient.name === ingredientId) {
                      return { ...ingredient, checked };
                    }
                    return ingredient;
                  },
                );
                const updatedShoppingList = {
                  ...shoppingList,
                  ingredients: updatedIngredients,
                  checkedItems: updatedIngredients.filter(i => i.checked)
                    .length,
                };
                setShoppingList(updatedShoppingList);

                // Persist to backend
                try {
                  const response = await fetch(
                    `/api/meal-plans/weekly/${planId}/shopping-list/ingredient`,
                    {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ingredientName: ingredientId,
                        checked,
                      }),
                    },
                  );
                  if (!response.ok) {
                    throw new Error('Failed to update shopping list');
                  }
                } catch (err) {
                  console.error('Error:', err);
                  // Roll back UI if failed
                  const rolledBackIngredients = shoppingList.ingredients.map(
                    ingredient => {
                      if (ingredient.name === ingredientId) {
                        return { ...ingredient, checked: !checked };
                      }
                      return ingredient;
                    },
                  );
                  setShoppingList({
                    ...shoppingList,
                    ingredients: rolledBackIngredients,
                    checkedItems: rolledBackIngredients.filter(i => i.checked)
                      .length,
                  });
                  alert('Failed to update shopping list. Please try again.');
                }
              })();
            }}
            onIngredientEdit={(ingredientId, updates) => {
              if (!shoppingList) return;
              const updatedIngredients = shoppingList.ingredients.map(
                ingredient => {
                  if (ingredient.name === ingredientId) {
                    return { ...ingredient, ...updates };
                  }
                  return ingredient;
                },
              );
              const updatedShoppingList = {
                ...shoppingList,
                ingredients: updatedIngredients,
              };
              setShoppingList(updatedShoppingList);
            }}
            onIngredientAdd={newIngredient => {
              if (!shoppingList) return;
              const updatedIngredients = [
                ...shoppingList.ingredients,
                { ...newIngredient, checked: false },
              ];
              const updatedShoppingList = {
                ...shoppingList,
                ingredients: updatedIngredients,
                totalItems: updatedIngredients.length,
              };
              setShoppingList(updatedShoppingList);
            }}
            onIngredientRemove={ingredientId => {
              if (!shoppingList) return;
              const updatedIngredients = shoppingList.ingredients.filter(
                ingredient => ingredient.name !== ingredientId,
              );
              const updatedShoppingList = {
                ...shoppingList,
                ingredients: updatedIngredients,
                totalItems: updatedIngredients.length,
                checkedItems: updatedIngredients.filter(i => i.checked).length,
              };
              setShoppingList(updatedShoppingList);
            }}
            onExport={format => handleExport(format as 'json' | 'csv' | 'txt')}
            onRefresh={() => void handleGenerateShoppingList()}
            onViewRecipe={handleViewRecipe}
            isEditable={true}
            showRecipeOrigins={true}
          />
        </div>
      )}
    </div>
  );
}
