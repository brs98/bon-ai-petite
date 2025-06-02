import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Recipe } from '@/types/recipe';
import { ArrowLeft, ChefHat, Clock, Users } from 'lucide-react';
import { FeedbackButtons } from '../RecipeCard/FeedbackButtons';
import { NutritionBadge } from '../RecipeCard/NutritionBadge';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack?: () => void;
  onSave?: (recipeId: number) => void;
  onFeedback?: (
    recipeId: number,
    liked: boolean,
    feedback?: string,
  ) => void | Promise<void>;
  onRegenerate?: (recipeId: number) => void;
  onShare?: (recipeId: number) => void;
  userFeedback?: {
    liked: boolean;
    feedback?: string;
  };
}

export function RecipeDetail({
  recipe,
  onBack,
  onSave,
  onFeedback,
  onRegenerate,
  onShare,
  userFeedback,
}: RecipeDetailProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const handleSave = () => {
    if (recipe.id && onSave) {
      onSave(recipe.id);
    }
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        {onBack && (
          <Button variant='ghost' size='sm' onClick={onBack}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back
          </Button>
        )}
        <div className='flex-1'>
          <h1 className='text-3xl font-bold'>{recipe.name}</h1>
          {recipe.description && (
            <p className='text-muted-foreground mt-2'>{recipe.description}</p>
          )}
        </div>
      </div>

      {/* Recipe Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Recipe Overview</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Stats */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='flex items-center gap-2'>
              <Clock className='h-5 w-5 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Total Time</p>
                <p className='font-medium'>{totalTime} minutes</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Users className='h-5 w-5 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Servings</p>
                <p className='font-medium'>{recipe.servings}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <ChefHat className='h-5 w-5 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Difficulty</p>
                <p className='font-medium capitalize'>{recipe.difficulty}</p>
              </div>
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Meal Type</p>
              <Badge variant='secondary' className='mt-1'>
                {recipe.mealType}
              </Badge>
            </div>
          </div>

          {/* Time Breakdown */}
          {(recipe.prepTime || recipe.cookTime) && (
            <div className='flex gap-4 text-sm'>
              {recipe.prepTime && (
                <div>
                  <span className='text-muted-foreground'>Prep: </span>
                  <span className='font-medium'>{recipe.prepTime}m</span>
                </div>
              )}
              {recipe.cookTime && (
                <div>
                  <span className='text-muted-foreground'>Cook: </span>
                  <span className='font-medium'>{recipe.cookTime}m</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {(recipe.cuisineType || recipe.tags?.length) && (
            <div className='flex flex-wrap gap-2'>
              {recipe.cuisineType && (
                <Badge variant='outline'>{recipe.cuisineType}</Badge>
              )}
              {recipe.tags?.map((tag, index) => (
                <Badge key={index} variant='outline'>
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className='flex items-center justify-between pt-4 border-t'>
            <div className='flex gap-2'>
              <Button
                variant={recipe.isSaved ? 'default' : 'outline'}
                onClick={handleSave}
              >
                {recipe.isSaved ? 'Saved' : 'Save Recipe'}
              </Button>
            </div>
            <FeedbackButtons
              recipe={recipe}
              onFeedback={onFeedback}
              onRegenerate={onRegenerate}
              onShare={onShare}
              userFeedback={userFeedback}
            />
          </div>
        </CardContent>
      </Card>

      <div className='grid md:grid-cols-2 gap-6'>
        {/* Ingredients */}
        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='space-y-2'>
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className='flex justify-between items-center'>
                  <span>{ingredient.name}</span>
                  <span className='text-muted-foreground'>
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card>
          <CardHeader>
            <CardTitle>Nutrition Information</CardTitle>
            <p className='text-sm text-muted-foreground'>Per serving</p>
          </CardHeader>
          <CardContent>
            <NutritionBadge nutrition={recipe.nutrition} showDetailed={true} />
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className='space-y-4'>
            {recipe.instructions.map((instruction, index) => (
              <li key={index} className='flex gap-4'>
                <div className='flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium'>
                  {index + 1}
                </div>
                <p className='flex-1 pt-1'>{instruction}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
