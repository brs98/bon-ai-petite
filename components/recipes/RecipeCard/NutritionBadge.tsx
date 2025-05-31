import { Badge } from '@/components/ui/badge';
import { Nutrition } from '@/types/recipe';

interface NutritionBadgeProps {
  nutrition: Nutrition;
  showDetailed?: boolean;
}

export function NutritionBadge({
  nutrition,
  showDetailed = false,
}: NutritionBadgeProps) {
  if (showDetailed) {
    return (
      <div className='grid grid-cols-2 gap-2 text-xs'>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Calories:</span>
          <span className='font-medium'>{Math.round(nutrition.calories)}</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Protein:</span>
          <span className='font-medium'>{Math.round(nutrition.protein)}g</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Carbs:</span>
          <span className='font-medium'>{Math.round(nutrition.carbs)}g</span>
        </div>
        <div className='flex justify-between'>
          <span className='text-muted-foreground'>Fat:</span>
          <span className='font-medium'>{Math.round(nutrition.fat)}g</span>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-wrap gap-1'>
      <Badge variant='outline' className='text-xs px-2 py-1'>
        {Math.round(nutrition.calories)} cal
      </Badge>
      <Badge variant='outline' className='text-xs px-2 py-1'>
        {Math.round(nutrition.protein)}g protein
      </Badge>
      <Badge variant='outline' className='text-xs px-2 py-1'>
        {Math.round(nutrition.carbs)}g carbs
      </Badge>
      <Badge variant='outline' className='text-xs px-2 py-1'>
        {Math.round(nutrition.fat)}g fat
      </Badge>
    </div>
  );
}
