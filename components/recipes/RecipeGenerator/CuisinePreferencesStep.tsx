import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CUISINE_TYPES } from '@/types/recipe';
import { Check, UtensilsCrossed } from 'lucide-react';
import React from 'react';

interface CuisinePreferencesStepProps {
  value: string[];
  onChange: (cuisines: string[]) => void;
  allOptions?: string[];
}

export const CuisinePreferencesStep: React.FC<CuisinePreferencesStepProps> = ({
  value,
  onChange,
  allOptions = CUISINE_TYPES,
}) => {
  const toggleSelection = (item: string) => {
    if (value.includes(item)) {
      onChange(value.filter(i => i !== item));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='text-center space-y-2'>
        <UtensilsCrossed className='h-12 w-12 mx-auto text-primary' />
        <h2 className='text-2xl font-bold'>Preferred Cuisines</h2>
        <p className='text-muted-foreground'>
          Select cuisines you enjoy. This helps us tailor recipes to your tastes
          (optional).
        </p>
      </div>
      <div className='flex flex-wrap gap-3 justify-center max-w-4xl mx-auto'>
        {allOptions.map(cuisine => (
          <Badge
            key={cuisine}
            variant={value.includes(cuisine) ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer hover:bg-accent text-sm py-2 px-4 transition-all',
              value.includes(cuisine) && 'hover:text-foreground',
            )}
            onClick={() => toggleSelection(cuisine)}
          >
            {value.includes(cuisine) && <Check className='h-3 w-3 mr-1' />}
            {cuisine}
          </Badge>
        ))}
      </div>
      {value.length > 0 && (
        <p className='text-center text-sm text-muted-foreground'>
          Selected {value.length} cuisine{value.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
