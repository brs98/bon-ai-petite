import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { mealPlanItems, shoppingLists, weeklyMealPlans } from '@/lib/db/schema';
import { type GroceryCategory } from '@/types/recipe';
import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface ConsolidatedIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  recipeNames?: string[];
  recipeIds?: number[];
}

// Helper function to categorize ingredients
function categorizeIngredient(ingredientName: string): GroceryCategory {
  const name = ingredientName.toLowerCase();

  // Produce
  if (
    name.includes('apple') ||
    name.includes('banana') ||
    name.includes('orange') ||
    name.includes('carrot') ||
    name.includes('onion') ||
    name.includes('garlic') ||
    name.includes('tomato') ||
    name.includes('lettuce') ||
    name.includes('spinach') ||
    name.includes('pepper') ||
    name.includes('cucumber') ||
    name.includes('potato') ||
    name.includes('celery') ||
    name.includes('herb') ||
    name.includes('basil') ||
    name.includes('parsley') ||
    name.includes('cilantro') ||
    name.includes('lime') ||
    name.includes('lemon') ||
    name.includes('avocado') ||
    name.includes('mushroom')
  ) {
    return 'produce';
  }

  // Dairy
  if (
    name.includes('milk') ||
    name.includes('cheese') ||
    name.includes('butter') ||
    name.includes('cream') ||
    name.includes('yogurt') ||
    name.includes('egg')
  ) {
    return 'dairy';
  }

  // Meat
  if (
    name.includes('beef') ||
    name.includes('pork') ||
    name.includes('lamb') ||
    name.includes('bacon') ||
    name.includes('sausage') ||
    name.includes('ham')
  ) {
    return 'meat';
  }

  // Poultry
  if (
    name.includes('chicken') ||
    name.includes('turkey') ||
    name.includes('duck')
  ) {
    return 'poultry';
  }

  // Seafood
  if (
    name.includes('fish') ||
    name.includes('salmon') ||
    name.includes('tuna') ||
    name.includes('shrimp') ||
    name.includes('crab') ||
    name.includes('lobster') ||
    name.includes('scallop') ||
    name.includes('cod') ||
    name.includes('tilapia')
  ) {
    return 'seafood';
  }

  // Bakery
  if (
    name.includes('bread') ||
    name.includes('bagel') ||
    name.includes('muffin') ||
    name.includes('croissant') ||
    name.includes('roll') ||
    name.includes('bun')
  ) {
    return 'bakery';
  }

  // Frozen
  if (
    name.includes('frozen') ||
    name.includes('ice cream') ||
    name.includes('sorbet')
  ) {
    return 'frozen';
  }

  // Spices
  if (
    name.includes('salt') ||
    name.includes('pepper') ||
    name.includes('paprika') ||
    name.includes('cumin') ||
    name.includes('oregano') ||
    name.includes('thyme') ||
    name.includes('rosemary') ||
    name.includes('cinnamon') ||
    name.includes('nutmeg') ||
    name.includes('ginger') ||
    name.includes('turmeric') ||
    name.includes('cardamom')
  ) {
    return 'spices';
  }

  // Beverages
  if (
    name.includes('juice') ||
    name.includes('soda') ||
    name.includes('water') ||
    name.includes('tea') ||
    name.includes('coffee') ||
    name.includes('wine') ||
    name.includes('beer') ||
    name.includes('alcohol')
  ) {
    return 'beverages';
  }

  // Default to pantry for dry goods, oils, condiments, etc.
  return 'pantry';
}

// Helper function to normalize unit names
function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase().trim();

  // Handle common unit variations
  const unitMappings: Record<string, string> = {
    cups: 'cup',
    c: 'cup',
    tablespoons: 'tbsp',
    tablespoon: 'tbsp',
    teaspoons: 'tsp',
    teaspoon: 'tsp',
    pounds: 'lb',
    pound: 'lb',
    ounces: 'oz',
    ounce: 'oz',
    grams: 'g',
    gram: 'g',
    kilograms: 'kg',
    kilogram: 'kg',
    milliliters: 'ml',
    milliliter: 'ml',
    liters: 'l',
    liter: 'l',
    pieces: 'piece',
    cloves: 'clove',
    slices: 'slice',
  };

  return unitMappings[normalized] || normalized;
}

// Helper function to consolidate ingredients with same name and unit
function consolidateIngredients(
  ingredientsWithOrigins: Array<{
    name: string;
    quantity: number;
    unit: string;
    recipeName: string;
    recipeId: number;
  }>,
): ConsolidatedIngredient[] {
  const consolidated = new Map<string, ConsolidatedIngredient>();

  for (const ingredient of ingredientsWithOrigins) {
    const normalizedName = ingredient.name.toLowerCase().trim();
    const normalizedUnit = normalizeUnit(ingredient.unit);
    const key = `${normalizedName}|${normalizedUnit}`;

    if (consolidated.has(key)) {
      const existing = consolidated.get(key)!;
      existing.quantity += ingredient.quantity;
      // Add recipe info if not already present
      if (!existing.recipeNames?.includes(ingredient.recipeName)) {
        existing.recipeNames = [
          ...(existing.recipeNames || []),
          ingredient.recipeName,
        ];
        existing.recipeIds = [
          ...(existing.recipeIds || []),
          ingredient.recipeId,
        ];
      }
    } else {
      consolidated.set(key, {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: normalizedUnit,
        category: categorizeIngredient(ingredient.name),
        checked: false,
        recipeNames: [ingredient.recipeName],
        recipeIds: [ingredient.recipeId],
      });
    }
  }

  return Array.from(consolidated.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
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

    // Consolidate ingredients by name and unit
    const consolidatedIngredients = consolidateIngredients(allIngredients);

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
