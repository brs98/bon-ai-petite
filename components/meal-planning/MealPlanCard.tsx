'use client';

import { NutritionBadge } from '@/components/recipes/RecipeCard/NutritionBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MealPlanItem, Recipe } from '@/types/recipe';
import {
  Calendar,
  Check,
  ChefHat,
  Clock,
  Loader2,
  Lock,
  RefreshCw,
  Settings,
  Sparkles,
  Unlock,
  Users,
} from 'lucide-react';

interface MealPlanCardProps {
  mealPlanItem: MealPlanItem;
  recipe?: Recipe;
  dayNumber: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onGenerate: () => void;
  onRegenerate: () => void;
  onLock: () => void;
  onUnlock: () => void;
  onCustomizePreferences?: () => void;
  onViewRecipe?: (recipeId: number) => void;
  isGenerating?: boolean;
  disabled?: boolean;
  showCustomPreferences?: boolean;
}

const CATEGORY_COLORS = {
  breakfast:
    'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20',
  lunch:
    'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
  dinner:
    'border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20',
  snack:
    'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20',
} as const;

const STATUS_CONFIG = {
  pending: {
    icon: Calendar,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    label: 'Ready to generate',
  },
  generating: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    label: 'Generating recipe...',
  },
  generated: {
    icon: Sparkles,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    label: 'Recipe generated',
  },
  locked: {
    icon: Check,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Confirmed',
  },
} as const;

export function MealPlanCard({
  mealPlanItem,
  recipe,
  dayNumber,
  category,
  onGenerate,
  onRegenerate,
  onLock,
  onUnlock,
  onCustomizePreferences,
  onViewRecipe,
  isGenerating = false,
  disabled = false,
  showCustomPreferences = true,
}: MealPlanCardProps) {
  const status = isGenerating ? 'generating' : mealPlanItem.status;
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  const dayLabel = `Day ${dayNumber}`;

  const hasCustomPreferences =
    mealPlanItem.customPreferences &&
    Object.keys(mealPlanItem.customPreferences).length > 0;

  const totalTime = recipe
    ? (recipe.prepTime || 0) + (recipe.cookTime || 0)
    : 0;

  const renderContent = () => {
    switch (status) {
      case 'pending':
        return (
          <div className='space-y-4'>
            <div className='text-center py-8'>
              <Calendar className='h-12 w-12 text-muted-foreground mx-auto mb-3' />
              <h4 className='font-medium text-muted-foreground mb-2'>
                Ready to generate
              </h4>
              <p className='text-sm text-muted-foreground'>
                Click generate to create your {category} recipe
              </p>
            </div>

            <div className='flex gap-2'>
              <Button
                onClick={onGenerate}
                disabled={disabled}
                className='flex-1'
                size='sm'
              >
                <Sparkles className='h-4 w-4 mr-2' />
                Generate Recipe
              </Button>

              {showCustomPreferences && onCustomizePreferences && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={onCustomizePreferences}
                  disabled={disabled}
                  className={
                    hasCustomPreferences ? 'ring-2 ring-primary/20' : ''
                  }
                >
                  <Settings className='h-4 w-4' />
                </Button>
              )}
            </div>
          </div>
        );

      case 'generating':
        return (
          <div className='space-y-4'>
            <div className='text-center py-8'>
              <div className='relative'>
                <Loader2 className='h-12 w-12 text-blue-600 mx-auto mb-3 animate-spin' />
                <div className='absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-800 animate-pulse' />
              </div>
              <h4 className='font-medium text-blue-600 mb-2'>
                Generating your recipe...
              </h4>
              <p className='text-sm text-muted-foreground'>
                Creating the perfect {category} for {dayLabel}
              </p>
            </div>

            <div className='animate-pulse space-y-2'>
              <div className='h-3 bg-muted rounded' />
              <div className='h-3 bg-muted rounded w-4/5' />
              <div className='h-3 bg-muted rounded w-3/5' />
            </div>
          </div>
        );

      case 'generated':
        return (
          <div className='space-y-4'>
            {recipe && (
              <>
                {/* Recipe Header */}
                <div className='space-y-3'>
                  <div>
                    <h4 className='font-semibold line-clamp-2 mb-1'>
                      {recipe.name}
                    </h4>
                    {recipe.description && (
                      <p className='text-sm text-muted-foreground line-clamp-2'>
                        {recipe.description}
                      </p>
                    )}
                  </div>

                  {/* Recipe Stats */}
                  <div className='flex items-center justify-between text-sm text-muted-foreground'>
                    <div className='flex items-center gap-1'>
                      <Clock className='h-4 w-4' />
                      <span>{totalTime}m</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Users className='h-4 w-4' />
                      <span>{recipe.servings}</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <ChefHat className='h-4 w-4' />
                      <span className='capitalize'>{recipe.difficulty}</span>
                    </div>
                  </div>

                  {/* Nutrition */}
                  <NutritionBadge nutrition={recipe.nutrition} />

                  {/* Tags */}
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
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex gap-2'>
                  {recipe.id && onViewRecipe && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      onClick={() => onViewRecipe(recipe.id!)}
                    >
                      View Recipe
                    </Button>
                  )}

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={onRegenerate}
                    disabled={disabled}
                  >
                    <RefreshCw className='h-4 w-4' />
                  </Button>

                  <Button
                    size='sm'
                    onClick={onLock}
                    disabled={disabled}
                    className='bg-green-600 hover:bg-green-700 text-white'
                  >
                    <Lock className='h-4 w-4 mr-2' />
                    Lock In
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      case 'locked':
        return (
          <div className='space-y-4'>
            {recipe && (
              <>
                {/* Locked State Indicator */}
                <div className='flex items-center gap-2 p-2 bg-primary/10 rounded-lg'>
                  <Check className='h-5 w-5 text-primary' />
                  <span className='text-sm font-medium text-primary'>
                    Recipe confirmed for {dayLabel}
                  </span>
                </div>

                {/* Recipe Summary */}
                <div className='space-y-3'>
                  <div>
                    <h4 className='font-semibold line-clamp-2 mb-1'>
                      {recipe.name}
                    </h4>
                    {recipe.description && (
                      <p className='text-sm text-muted-foreground line-clamp-2'>
                        {recipe.description}
                      </p>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className='grid grid-cols-3 gap-4 text-center text-sm'>
                    <div>
                      <div className='font-semibold'>{totalTime}m</div>
                      <div className='text-muted-foreground text-xs'>
                        Total time
                      </div>
                    </div>
                    <div>
                      <div className='font-semibold'>
                        {recipe.nutrition.calories}
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        Calories
                      </div>
                    </div>
                    <div>
                      <div className='font-semibold capitalize'>
                        {recipe.difficulty}
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        Difficulty
                      </div>
                    </div>
                  </div>
                </div>

                {/* Locked Actions */}
                <div className='flex gap-2'>
                  {recipe.id && onViewRecipe && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      onClick={() => onViewRecipe(recipe.id!)}
                    >
                      View Recipe
                    </Button>
                  )}

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={onUnlock}
                    disabled={disabled}
                  >
                    <Unlock className='h-4 w-4' />
                  </Button>
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200 h-full',
        CATEGORY_COLORS[category],
        {
          'ring-2 ring-green-400/60 shadow-md': status === 'locked',
          'ring-2 ring-blue-400/60': status === 'generating',
          'hover:shadow-md': status === 'pending',
          'opacity-75': disabled,
        },
      )}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <CardTitle className='text-lg capitalize'>{category}</CardTitle>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Calendar className='h-4 w-4' />
              <span>{dayLabel}</span>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {hasCustomPreferences && (
              <Badge
                variant='outline'
                className='text-xs'
                title='Custom preferences applied'
              >
                Custom
              </Badge>
            )}

            <Badge
              variant={status === 'locked' ? 'default' : 'secondary'}
              className={cn('flex items-center gap-1', statusConfig.color)}
            >
              <StatusIcon
                className={cn(
                  'h-3 w-3',
                  status === 'generating' && 'animate-spin',
                )}
              />
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
