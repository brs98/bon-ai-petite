'use client';

import { NutritionBadge } from '@/components/recipes/RecipeCard/NutritionBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MealPlanItem, Recipe } from '@/types/recipe';
import {
  Calendar,
  ChefHat,
  Clock,
  Loader2,
  Settings,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
const StarFilled = Star;

interface MealPlanCardProps {
  mealPlanItem: MealPlanItem;
  recipe?: Recipe;
  dayNumber: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onGenerate: () => void;
  onRegenerate: () => void;
  onCustomizePreferences?: () => void;
  onViewRecipe?: (recipeId: number) => void;
  isGenerating?: boolean;
  disabled?: boolean;
  showCustomPreferences?: boolean;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onSave?: (recipeId: number) => void;
  isSaved?: boolean;
}

const CATEGORY_COLORS = {
  breakfast:
    'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20',
  lunch:
    'border-secondary bg-secondary/50 dark:border-secondary dark:bg-secondary',
  dinner:
    'border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20',
  snack: 'border-primary bg-primary/10 dark:border-primary dark:bg-primary/20',
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
    color: 'text-secondary-foreground',
    bgColor: 'bg-secondary dark:bg-secondary',
    label: 'Generating recipe...',
  },
  generated: {
    icon: Sparkles,
    color: 'text-primary',
    bgColor: 'bg-primary/10 dark:bg-primary/20',
    label: 'Recipe generated',
  },
} as const;

export function MealPlanCard({
  mealPlanItem,
  recipe,
  dayNumber,
  category,
  onGenerate,
  onCustomizePreferences,
  onViewRecipe,
  isGenerating = false,
  disabled = false,
  showCustomPreferences = true,
  selected = false,
  onSelectChange,
  onSave,
  isSaved,
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

  // Make the entire card clickable for selection (unless disabled)
  const handleCardClick = () => {
    if (disabled || !onSelectChange) return;
    onSelectChange(!selected);
  };

  // Only handle 'pending', 'generating', 'generated'.
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
                <Loader2 className='h-12 w-12 text-secondary-foreground mx-auto mb-3 animate-spin' />
                <div className='absolute inset-0 rounded-full border-2 border-secondary dark:border-secondary animate-pulse' />
              </div>
              <h4 className='font-medium text-secondary-foreground mb-2'>
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
          <div className='flex flex-col flex-1 space-y-4'>
            {recipe && (
              <>
                {/* Recipe Header */}
                <div className='space-y-3'>
                  <div
                    style={{ minHeight: 60, maxHeight: 60, overflow: 'hidden' }}
                  >
                    <h4
                      className='font-semibold mb-1 truncate'
                      title={recipe.name}
                    >
                      {recipe.name}
                    </h4>
                    {recipe.description && (
                      <p
                        className='text-sm text-muted-foreground truncate'
                        title={recipe.description}
                      >
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
                <div className='flex-1' />{' '}
                {/* Spacer to push buttons to bottom */}
                {/* Action Buttons */}
                <div className='flex gap-2 items-center pt-2'>
                  {recipe.id && onViewRecipe && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      onClick={e => {
                        e.stopPropagation();
                        onViewRecipe(recipe.id!);
                      }}
                    >
                      View Recipe
                    </Button>
                  )}
                  {recipe.id && onSave && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='font-semibold px-4 py-2 flex-1 flex items-center gap-2 shadow-md border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-700'
                      onClick={e => {
                        e.stopPropagation();
                        onSave(recipe.id!);
                      }}
                      style={{ minWidth: 100 }}
                    >
                      {typeof isSaved !== 'undefined' && isSaved ? (
                        <StarFilled className='h-5 w-5 fill-yellow-400 text-yellow-500' />
                      ) : (
                        <Star className='h-5 w-5 text-yellow-500' />
                      )}
                      {typeof isSaved !== 'undefined' && isSaved
                        ? 'Saved'
                        : 'Save Recipe'}
                    </Button>
                  )}
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
        'transition-all duration-200 h-full cursor-pointer',
        CATEGORY_COLORS[category],
        {
          'ring-2 ring-primary shadow-md': selected,
          'hover:ring-2 hover:ring-primary/60 hover:shadow-lg':
            !selected && !disabled,
          'opacity-75': disabled,
        },
      )}
      onClick={handleCardClick}
      tabIndex={0}
      aria-pressed={selected}
      role='button'
      style={{ outline: 'none' }}
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
              variant={'secondary'}
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
