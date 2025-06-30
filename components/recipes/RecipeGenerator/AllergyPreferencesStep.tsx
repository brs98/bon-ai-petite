import { Badge } from '@/components/ui/badge';
import { COMMON_ALLERGIES } from '@/types/recipe';
import { Check, Shield } from 'lucide-react';
import React from 'react';

interface AllergyPreferencesStepProps {
  value: string[];
  onChange: (allergies: string[]) => void;
  allOptions?: string[];
}

export const AllergyPreferencesStep: React.FC<AllergyPreferencesStepProps> = ({
  value,
  onChange,
  allOptions = COMMON_ALLERGIES,
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
        <Shield className='h-12 w-12 mx-auto text-primary' />
        <h2 className='text-2xl font-bold'>Allergies & Intolerances</h2>
        <p className='text-muted-foreground'>
          Select any food allergies or intolerances you have. We'll make sure to
          avoid these ingredients.
        </p>
      </div>
      <div className='flex flex-wrap gap-3 justify-center max-w-4xl mx-auto'>
        {optionsWithNone.map(allergy => (
          <Badge
            key={allergy}
            variant={value.includes(allergy) ? 'default' : 'outline'}
            className='cursor-pointer hover:bg-accent text-sm py-2 px-4 transition-all'
            onClick={() => toggleSelection(allergy)}
          >
            {value.includes(allergy) && <Check className='h-3 w-3 mr-1' />}
            {allergy}
          </Badge>
        ))}
      </div>
      {value.length > 0 && (
        <p className='text-center text-sm text-muted-foreground'>
          Selected {value.length} allerg{value.length === 1 ? 'y' : 'ies'}
        </p>
      )}
    </div>
  );
};
