import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Recipe } from '@/types/recipe';
import { ChefHat, Clock, Users } from 'lucide-react';
import { NutritionBadge } from './NutritionBadge';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: (recipeId: number) => void;
  onView?: (recipeId: number) => void;
}

export function RecipeCard({ recipe, onSave, onView }: RecipeCardProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const handleSave = () => {
    if (recipe.id && onSave) {
      onSave(recipe.id);
    }
  };

  const handleView = () => {
    if (recipe.id && onView) {
      onView(recipe.id);
    }
  };

  return (
    <Card className='w-full max-w-md hover:shadow-lg transition-shadow duration-200'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <CardTitle className='text-lg font-semibold line-clamp-2'>
            {recipe.name}
          </CardTitle>
          <Badge variant='secondary' className='ml-2 shrink-0'>
            {recipe.mealType}
          </Badge>
        </div>
        {recipe.description && (
          <p className='text-sm text-muted-foreground line-clamp-2'>
            {recipe.description}
          </p>
        )}
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Recipe Stats */}
        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <div className='flex items-center gap-1'>
            <Clock className='h-4 w-4' />
            <span>{totalTime}m</span>
          </div>
          <div className='flex items-center gap-1'>
            <Users className='h-4 w-4' />
            <span>{recipe.servings} servings</span>
          </div>
          <div className='flex items-center gap-1'>
            <ChefHat className='h-4 w-4' />
            <span className='capitalize'>{recipe.difficulty}</span>
          </div>
        </div>

        {/* Nutrition Badge */}
        <NutritionBadge nutrition={recipe.nutrition} />

        {/* Cuisine and Tags */}
        <div className='flex flex-wrap gap-1'>
          {recipe.cuisineType && (
            <Badge variant='outline' className='text-xs'>
              {recipe.cuisineType}
            </Badge>
          )}
          {recipe.tags?.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant='outline' className='text-xs'>
              {tag}
            </Badge>
          ))}
          {recipe.tags && recipe.tags.length > 2 && (
            <Badge variant='outline' className='text-xs'>
              +{recipe.tags.length - 2}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2 pt-2'>
          <Button
            variant='default'
            size='sm'
            className='flex-1'
            onClick={handleView}
          >
            View Recipe
          </Button>
          <Button
            variant={recipe.isSaved ? 'default' : 'outline'}
            size='sm'
            onClick={handleSave}
          >
            {recipe.isSaved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
