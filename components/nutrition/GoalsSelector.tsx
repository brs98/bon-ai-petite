'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FITNESS_GOALS } from '@/types/recipe';

interface GoalsSelectorProps {
  selectedGoal?: string;
  onGoalSelect: (goal: string) => void;
}

export function GoalsSelector({
  selectedGoal,
  onGoalSelect,
}: GoalsSelectorProps) {
  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-medium'>
          What's your primary fitness goal?
        </h3>
        <p className='text-sm text-muted-foreground'>
          This helps us customize recipes to support your objectives
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        {FITNESS_GOALS.map(goal => (
          <Card
            key={goal.value}
            data-testid={`goal-${goal.value}`}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selectedGoal === goal.value
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-muted/50',
            )}
            onClick={() => onGoalSelect(goal.value)}
          >
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <h4 className='font-medium'>{goal.label}</h4>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {getGoalDescription(goal.value)}
                  </p>
                </div>
                {selectedGoal === goal.value && (
                  <Badge variant='default' className='ml-2'>
                    Selected
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getGoalDescription(goal: string): string {
  const descriptions = {
    lose_weight:
      'Recipes focused on creating a caloric deficit while maintaining nutrition',
    gain_weight:
      'Higher calorie, nutrient-dense recipes to support healthy weight gain',
    maintain_weight:
      'Balanced recipes to maintain your current weight and energy levels',
    gain_muscle: 'High-protein recipes to support muscle building and recovery',
    improve_health:
      'Nutrient-rich recipes focused on overall wellness and vitality',
  };

  return descriptions[goal as keyof typeof descriptions] || '';
}
