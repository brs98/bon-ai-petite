import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { mealPlanItems, shoppingLists, weeklyMealPlans } from '@/lib/db/schema';
import { ingredientConsolidatorService } from '@/lib/meal-planning/ingredient-consolidator';
import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

type _GroceryCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'poultry'
  | 'seafood'
  | 'bakery'
  | 'deli'
  | 'frozen'
  | 'pantry'
  | 'spices'
  | 'beverages'
  | 'snacks'
  | 'health'
  | 'other';

interface ConsolidatedIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  recipeNames?: string[];
  recipeIds?: number[];
}

// Enhanced consolidation function that handles unit conversions
function consolidateIngredientsWithUnitConversion(
  ingredientsWithOrigins: Array<{
    name: string;
    quantity: number;
    unit: string;
    recipeName: string;
    recipeId: number;
  }>,
): ConsolidatedIngredient[] {
  // Convert to the format expected by the consolidator service
  const ingredientsForConsolidation = ingredientsWithOrigins.map(
    ingredient => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    }),
  );

  // Use the consolidator service to handle unit conversions and consolidation
  const consolidatedFromService =
    ingredientConsolidatorService.consolidateIngredientArray(
      ingredientsForConsolidation,
    );

  // Now we need to merge the recipe information back
  const finalConsolidated: ConsolidatedIngredient[] = [];

  for (const consolidated of consolidatedFromService) {
    // Find all original ingredients that contributed to this consolidated ingredient
    const contributingIngredients = ingredientsWithOrigins.filter(original => {
      // Use the same normalization logic as the consolidator service
      const normalizedOriginalName =
        ingredientConsolidatorService.normalizeIngredientName(original.name);
      const consolidatedName = consolidated.name.toLowerCase().trim();

      // Check if names match after normalization
      if (normalizedOriginalName === consolidatedName) {
        return true;
      }

      // Also check if the consolidator service would consider them similar
      if (
        ingredientConsolidatorService.areIngredientNamesSimilar(
          normalizedOriginalName,
          consolidatedName,
        )
      ) {
        return true;
      }

      // Additional check: try normalizing both names and comparing
      const normalizedConsolidated =
        ingredientConsolidatorService.normalizeIngredientName(consolidatedName);
      if (normalizedOriginalName === normalizedConsolidated) {
        return true;
      }

      return false;
    });

    // Extract recipe information
    const recipeNames = [
      ...new Set(contributingIngredients.map(i => i.recipeName)),
    ];
    const recipeIds = [
      ...new Set(contributingIngredients.map(i => i.recipeId)),
    ];

    finalConsolidated.push({
      name: consolidated.name,
      quantity: consolidated.quantity,
      unit: consolidated.unit,
      category: consolidated.category,
      checked: false,
      recipeNames,
      recipeIds,
    });
  }

  return finalConsolidated.sort((a, b) => a.name.localeCompare(b.name));
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const planId = parseInt(id);
    if (isNaN(planId)) {
      return Response.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Verify the meal plan belongs to the user
    const mealPlan = await db.query.weeklyMealPlans.findFirst({
      where: and(
        eq(weeklyMealPlans.id, planId),
        eq(weeklyMealPlans.userId, user.id),
      ),
    });

    if (!mealPlan) {
      return Response.json(
        { error: 'Meal plan not found or access denied' },
        { status: 404 },
      );
    }

    // Get all generated meal plan items with their recipes
    const generatedMeals = await db.query.mealPlanItems.findMany({
      where: and(
        eq(mealPlanItems.planId, planId),
        eq(mealPlanItems.status, 'generated'),
      ),
      with: {
        recipe: true,
      },
    });

    if (generatedMeals.length === 0) {
      return Response.json(
        { error: 'No generated meals found in this meal plan' },
        { status: 400 },
      );
    }

    // Extract all ingredients from generated meals
    const allIngredients: Array<{
      name: string;
      quantity: number;
      unit: string;
      recipeName: string;
      recipeId: number;
    }> = [];

    for (const meal of generatedMeals) {
      if (meal.recipe?.ingredients && meal.recipe.id && meal.recipe.name) {
        const ingredients = meal.recipe.ingredients as Array<{
          name: string;
          quantity: number;
          unit: string;
        }>;
        // Add recipe context to each ingredient
        const ingredientsWithOrigin = ingredients.map(ingredient => ({
          ...ingredient,
          recipeName: meal.recipe!.name,
          recipeId: meal.recipe!.id!,
        }));
        allIngredients.push(...ingredientsWithOrigin);
      }
    }

    if (allIngredients.length === 0) {
      return Response.json(
        { error: 'No ingredients found in generated meals' },
        { status: 400 },
      );
    }

    // Use enhanced consolidation with unit conversion
    const consolidatedIngredients =
      consolidateIngredientsWithUnitConversion(allIngredients);

    // Check if shopping list already exists for this plan
    const existingShoppingList = await db.query.shoppingLists.findFirst({
      where: eq(shoppingLists.planId, planId),
    });

    let shoppingList;

    if (existingShoppingList) {
      // Update existing shopping list
      [shoppingList] = await db
        .update(shoppingLists)
        .set({
          ingredients: consolidatedIngredients,
          totalItems: consolidatedIngredients.length,
          checkedItems: 0, // Reset checked items when regenerating
          updatedAt: new Date(),
        })
        .where(eq(shoppingLists.id, existingShoppingList.id))
        .returning();
    } else {
      // Create new shopping list
      [shoppingList] = await db
        .insert(shoppingLists)
        .values({
          planId,
          ingredients: consolidatedIngredients,
          totalItems: consolidatedIngredients.length,
          checkedItems: 0,
        })
        .returning();
    }

    // Organize ingredients by category for better display
    const ingredientsByCategory = consolidatedIngredients.reduce(
      (acc, ingredient) => {
        const category = ingredient.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(ingredient);
        return acc;
      },
      {} as Record<string, ConsolidatedIngredient[]>,
    );

    return Response.json({
      success: true,
      shoppingList: {
        ...shoppingList,
        ingredientsByCategory,
      },
      stats: {
        totalIngredients: consolidatedIngredients.length,
        totalMeals: generatedMeals.length,
        categoriesUsed: Object.keys(ingredientsByCategory).length,
      },
    });
  } catch (error) {
    console.error('Failed to generate shopping list:', error);
    return Response.json(
      { error: 'Failed to generate shopping list' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const user = await getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const planId = parseInt(id);
    if (isNaN(planId)) {
      return Response.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Verify the meal plan belongs to the user
    const mealPlan = await db.query.weeklyMealPlans.findFirst({
      where: and(
        eq(weeklyMealPlans.id, planId),
        eq(weeklyMealPlans.userId, user.id),
      ),
    });

    if (!mealPlan) {
      return Response.json(
        { error: 'Meal plan not found or access denied' },
        { status: 404 },
      );
    }

    // Get existing shopping list
    const shoppingList = await db.query.shoppingLists.findFirst({
      where: eq(shoppingLists.planId, planId),
    });

    if (!shoppingList) {
      return Response.json(
        { error: 'Shopping list not found for this meal plan' },
        { status: 404 },
      );
    }

    // Organize ingredients by category
    const ingredients = shoppingList.ingredients as ConsolidatedIngredient[];
    const ingredientsByCategory = ingredients.reduce(
      (acc, ingredient) => {
        const category = ingredient.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(ingredient);
        return acc;
      },
      {} as Record<string, ConsolidatedIngredient[]>,
    );

    return Response.json({
      success: true,
      shoppingList: {
        ...shoppingList,
        ingredientsByCategory,
      },
    });
  } catch (error) {
    console.error('Failed to fetch shopping list:', error);
    return Response.json(
      { error: 'Failed to fetch shopping list' },
      { status: 500 },
    );
  }
}
