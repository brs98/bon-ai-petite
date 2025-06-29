'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardStep {
  id: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  label: string;
  description: string;
  icon: string;
  mealCount: number;
  isComplete: boolean;
  isActive: boolean;
  isSkipped: boolean;
}

interface WizardNavigationProps {
  steps: WizardStep[];
  currentStepIndex: number;
  totalSteps: number;
  completedSteps: number;
  canGoBack: boolean;
  canGoNext: boolean;
  canSkip: boolean;
  isGeneratingMeals: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
  onStepClick?: (stepIndex: number) => void;
  showProgressDetails?: boolean;
  estimatedTimeRemaining?: number;
}

const CATEGORY_DETAILS = {
  breakfast: {
    emoji: '🌅',
    color:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    ring: 'ring-orange-200 dark:ring-orange-800',
  },
  lunch: {
    emoji: '🥙',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    ring: 'ring-blue-200 dark:ring-blue-800',
  },
  dinner: {
    emoji: '🍽️',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    ring: 'ring-purple-200 dark:ring-purple-800',
  },
  snack: {
    emoji: '🍎',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    ring: 'ring-green-200 dark:ring-green-800',
  },
} as const;

export function WizardNavigation({
  steps,
  currentStepIndex,
  totalSteps,
  completedSteps,
  canGoBack,
  canGoNext,
  canSkip,
  isGeneratingMeals,
  onBack,
  onNext,
  onSkip,
  onStepClick,
}: WizardNavigationProps) {
  const currentStep = steps[currentStepIndex];
  const progressPercentage =
    totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const activeSteps = steps.filter(step => !step.isSkipped);

  const getStepStatus = (step: WizardStep, index: number) => {
    if (step.isSkipped) return 'skipped';
    if (step.isComplete) return 'complete';
    if (step.isActive) return 'active';
    if (index < currentStepIndex) return 'accessible';
    return 'upcoming';
  };

  return (
    <div className='space-y-6'>
      {/* Progress Header */}
      <Card>
        <CardContent className='pt-6'>
          <div className='space-y-4'>
            {/* Progress Bar */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='font-medium'>
                  Step {currentStepIndex + 1} of {activeSteps.length}
                </span>
                <span className='text-muted-foreground'>
                  {Math.round(progressPercentage)}% complete
                </span>
              </div>
              <Progress value={progressPercentage} className='h-2' />
            </div>

            {/* Current Step Info */}
            {currentStep && (
              <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
                <span className='text-2xl'>
                  {CATEGORY_DETAILS[currentStep.category].emoji}
                </span>
                <div className='flex-1'>
                  <h3 className='font-semibold'>{currentStep.label}</h3>
                  <p className='text-sm text-muted-foreground'>
                    {currentStep.description}
                  </p>
                  {currentStep.mealCount > 0 && (
                    <Badge variant='outline' className='mt-1'>
                      {currentStep.mealCount} meal
                      {currentStep.mealCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                {isGeneratingMeals && (
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <div className='animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent' />
                    <span>Generating...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      {steps.length > 1 && (
        <Card>
          <CardContent className='pt-6'>
            <div className='space-y-4'>
              <h4 className='font-medium text-sm'>Meal Categories</h4>

              {/* Step Pills */}
              <div className='flex flex-wrap gap-2'>
                {steps.map((step, index) => {
                  const status = getStepStatus(step, index);
                  const categoryDetail = CATEGORY_DETAILS[step.category];

                  return (
                    <button
                      key={step.id}
                      onClick={() => onStepClick?.(index)}
                      disabled={status === 'upcoming' || isGeneratingMeals}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 text-sm',
                        'disabled:cursor-not-allowed',
                        {
                          // Active state
                          [cn(
                            'border-primary ring-2',
                            categoryDetail.ring,
                            categoryDetail.color,
                          )]: status === 'active',

                          // Complete state
                          'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-100':
                            status === 'complete',

                          // Accessible state (clickable previous steps)
                          'border-border bg-background hover:bg-muted/50 hover:border-muted-foreground cursor-pointer':
                            status === 'accessible',

                          // Upcoming state
                          'border-border bg-muted/30 text-muted-foreground cursor-not-allowed':
                            status === 'upcoming',

                          // Skipped state
                          'border-border bg-muted/20 text-muted-foreground/60 relative':
                            status === 'skipped',
                        },
                      )}
                    >
                      <span className='text-lg'>{categoryDetail.emoji}</span>
                      <span className='font-medium'>{step.label}</span>

                      {status === 'complete' && (
                        <Check className='h-4 w-4 text-green-600' />
                      )}

                      {status === 'skipped' && (
                        <div className='absolute inset-0 flex items-center justify-center'>
                          <div className='w-full h-px bg-muted-foreground/40' />
                        </div>
                      )}

                      {step.mealCount > 0 && status !== 'skipped' && (
                        <Badge variant='outline' className='text-xs'>
                          {step.mealCount}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Controls */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-between'>
            <Button
              variant='outline'
              onClick={onBack}
              disabled={!canGoBack || isGeneratingMeals}
              className='flex items-center gap-2'
            >
              <ChevronLeft className='h-4 w-4' />
              Back
            </Button>

            <div className='flex items-center gap-3'>
              {canSkip && onSkip && (
                <Button
                  variant='ghost'
                  onClick={onSkip}
                  disabled={isGeneratingMeals}
                  className='text-muted-foreground hover:text-foreground'
                >
                  Skip Category
                </Button>
              )}

              <Button
                onClick={onNext}
                disabled={!canGoNext || isGeneratingMeals}
                className='flex items-center gap-2'
              >
                {currentStepIndex === activeSteps.length - 1
                  ? 'Complete Plan'
                  : 'Next'}
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Helpful Messages */}
          {!canGoNext &&
            !isGeneratingMeals &&
            currentStep &&
            currentStep.mealCount > 0 && (
              <div className='mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
                <div className='flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200'>
                  <AlertCircle className='h-4 w-4' />
                  <span>Complete all meals in this category to continue</span>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
