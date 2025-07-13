import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DIETARY_RESTRICTIONS } from '@/types/recipe';
import { Check, Heart } from 'lucide-react';
import React from 'react';

interface DietaryPreferencesStepProps {
  value: string[];
  onChange: (restrictions: string[]) => void;
  allOptions?: string[];
}

export const DietaryPreferencesStep: React.FC<DietaryPreferencesStepProps> = ({
  value,
  onChange,
  allOptions = DIETARY_RESTRICTIONS,
}) => {
  const NONE_OPTION = 'None';
  const optionsWithNone = [
    NONE_OPTION,
    ...allOptions.filter(opt => opt !== NONE_OPTION),
  ];

  const toggleSelection = (item: string) => {
    if (item === NONE_OPTION) {
      onChange([NONE_OPTION]);
    } else {
      let newSelection = value.filter(i => i !== NONE_OPTION);
      if (value.includes(item)) {
        newSelection = newSelection.filter(i => i !== item);
      } else {
        newSelection = [...newSelection, item];
      }
      onChange(newSelection);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='text-center space-y-2'>
        <Heart className='h-12 w-12 mx-auto text-primary' />
        <h2 className='text-2xl font-bold'>Dietary preferences</h2>
        <p className='text-muted-foreground'>
          Do you follow any specific dietary patterns? This helps us suggest
          appropriate recipes.
        </p>
      </div>
      <div className='flex flex-wrap gap-3 justify-center max-w-4xl mx-auto'>
        {optionsWithNone.map(restriction => (
          <Badge
            key={restriction}
            variant={value.includes(restriction) ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer hover:bg-accent text-sm py-2 px-4 transition-all',
              value.includes(restriction) && 'hover:text-foreground'
            )}
            onClick={() => toggleSelection(restriction)}
          >
            {value.includes(restriction) && <Check className='h-3 w-3 mr-1' />}
            {restriction}
          </Badge>
        ))}
      </div>
      {value.length > 0 && (
        <p className='text-center text-sm text-muted-foreground'>
          Selected {value.length} preference{value.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
