'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface MacroTrackerProps extends React.HTMLAttributes<HTMLDivElement> {
  dailyCalories?: number;
  macroProtein?: number; // in grams
  macroCarbs?: number; // in grams
  macroFat?: number; // in grams;
  showDetailed?: boolean;
  // Add props for weight, goalWeight, and goal
  weight?: number;
  goalWeight?: number;
  goal?: string;
}

export function MacroTracker({
  dailyCalories,
  macroProtein,
  macroCarbs,
  macroFat,
  showDetailed = true,
  weight,
  goalWeight,
  goal,
  ...props
}: MacroTrackerProps) {
  // Calculate calories from macros
  const proteinCalories = (macroProtein || 0) * 4;
  const carbCalories = (macroCarbs || 0) * 4;
  const fatCalories = (macroFat || 0) * 9;
  const totalMacroCalories = proteinCalories + carbCalories + fatCalories;

  // Calculate percentages
  const proteinPercentage =
    totalMacroCalories > 0 ? (proteinCalories / totalMacroCalories) * 100 : 0;
  const carbPercentage =
    totalMacroCalories > 0 ? (carbCalories / totalMacroCalories) * 100 : 0;
  const fatPercentage =
    totalMacroCalories > 0 ? (fatCalories / totalMacroCalories) * 100 : 0;

  const usesGoalWeight =
    (goal === 'lose_weight' || goal === 'gain_weight') &&
    goalWeight &&
    weight &&
    goalWeight !== weight;

  if (!dailyCalories && !macroProtein && !macroCarbs && !macroFat) {
    return (
      <Card {...props}>
        <CardContent className='p-6'>
          <div className='text-center text-muted-foreground'>
            <p>Set your nutrition targets to see macro breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className='text-lg'>Macro Targets</CardTitle>
        {dailyCalories && (
          <p className='text-sm text-muted-foreground' data-testid='calories'>
            Daily calorie target: {dailyCalories} kcal
          </p>
        )}
        {/* Show current and goal weight if using goal weight */}
        {usesGoalWeight && (
          <div className='text-xs text-primary mt-2'>
            <span>
              Current weight: <b>{weight} lbs</b>
            </span>{' '}
            &rarr;{' '}
            <span>
              Goal weight: <b>{goalWeight} lbs</b>
            </span>
            <br />
            <span>
              Your calorie and macro targets are based on your goal weight to
              help you {goal === 'lose_weight' ? 'lose' : 'gain'} weight safely.
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Display current and goal weight if applicable */}
        {/* In MacroTracker, extract goalWeight, weight, and goal from the profile/props */}
        {/* Determine if goal weight is used */}
        {/* ... existing code ... */}
        {/* Macro breakdown */}
        <div className='space-y-4'>
          {macroProtein !== undefined && (
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-secondary rounded-full' />
                  <span className='font-medium'>Protein</span>
                </div>
                <div className='text-right'>
                  <Badge variant='outline'>{macroProtein}g</Badge>
                  {showDetailed && (
                    <span className='text-sm text-muted-foreground ml-2'>
                      ({proteinCalories} kcal)
                    </span>
                  )}
                </div>
              </div>
              <Progress value={proteinPercentage} className='h-2' />
              {showDetailed && (
                <p className='text-xs text-muted-foreground'>
                  {proteinPercentage.toFixed(1)}% of total macros
                </p>
              )}
            </div>
          )}

          {macroCarbs !== undefined && (
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-primary rounded-full' />
                  <span className='font-medium'>Carbohydrates</span>
                </div>
                <div className='text-right'>
                  <Badge variant='outline'>{macroCarbs}g</Badge>
                  {showDetailed && (
                    <span className='text-sm text-muted-foreground ml-2'>
                      ({carbCalories} kcal)
                    </span>
                  )}
                </div>
              </div>
              <Progress value={carbPercentage} className='h-2' />
              {showDetailed && (
                <p className='text-xs text-muted-foreground'>
                  {carbPercentage.toFixed(1)}% of total macros
                </p>
              )}
            </div>
          )}

          {macroFat !== undefined && (
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-orange-500 rounded-full' />
                  <span className='font-medium'>Fat</span>
                </div>
                <div className='text-right'>
                  <Badge variant='outline'>{macroFat}g</Badge>
                  {showDetailed && (
                    <span className='text-sm text-muted-foreground ml-2'>
                      ({fatCalories} kcal)
                    </span>
                  )}
                </div>
              </div>
              <Progress value={fatPercentage} className='h-2' />
              {showDetailed && (
                <p className='text-xs text-muted-foreground'>
                  {fatPercentage.toFixed(1)}% of total macros
                </p>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        {showDetailed && totalMacroCalories > 0 && (
          <div className='pt-4 border-t'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-muted-foreground'>Macro calories</p>
                <p className='font-medium'>{totalMacroCalories} kcal</p>
              </div>
              {dailyCalories && (
                <div>
                  <p className='text-muted-foreground'>Remaining</p>
                  <p className='font-medium'>
                    {Math.max(0, dailyCalories - totalMacroCalories)} kcal
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
