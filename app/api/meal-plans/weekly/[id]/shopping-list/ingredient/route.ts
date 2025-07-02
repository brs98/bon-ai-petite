import { db } from '@/lib/db/drizzle';
import { shoppingLists } from '@/lib/db/schema';
import { ShoppingList } from '@/types/recipe';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const planId = Number(params.id);
  if (!planId) {
    return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
  }

  const { ingredientName, checked } = await request.json();
  if (typeof ingredientName !== 'string' || typeof checked !== 'boolean') {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }

  // Fetch the shopping list for this plan
  const [shoppingList] = await db
    .select()
    .from(shoppingLists)
    .where(eq(shoppingLists.planId, planId));

  if (!shoppingList) {
    return NextResponse.json(
      { error: 'Shopping list not found' },
      { status: 404 },
    );
  }

  // Type assertion for ingredients
  const ingredients = shoppingList.ingredients as ShoppingList['ingredients'];

  // Update the checked state for the specified ingredient
  const updatedIngredients = ingredients.map(ingredient => {
    if (ingredient.name === ingredientName) {
      return { ...ingredient, checked };
    }
    return ingredient;
  });

  // Update checkedItems count
  const checkedItems = updatedIngredients.filter(i => i.checked).length;

  // Persist the updated shopping list
  await db
    .update(shoppingLists)
    .set({ ingredients: updatedIngredients, checkedItems })
    .where(eq(shoppingLists.id, shoppingList.id));

  return NextResponse.json({ success: true, ingredientName, checked });
}
