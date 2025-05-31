'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChefHat, Loader2, Sparkles, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GenerationProgressProps {
  isGenerating: boolean;
  stage?: 'initializing' | 'generating' | 'validating' | 'complete';
  message?: string;
}

const GENERATION_STAGES = [
  {
    key: 'initializing',
    label: 'Analyzing your preferences',
    icon: UtensilsCrossed,
    duration: 1000,
  },
  {
    key: 'generating',
    label: 'Creating your personalized recipe',
    icon: ChefHat,
    duration: 3000,
  },
  {
    key: 'validating',
    label: 'Validating nutrition and ingredients',
    icon: Sparkles,
    duration: 1000,
  },
  {
    key: 'complete',
    label: 'Recipe ready!',
    icon: Sparkles,
    duration: 500,
  },
] as const;

export function GenerationProgress({
  isGenerating,
  stage = 'initializing',
  message,
}: GenerationProgressProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStageIndex(0);
      setProgress(0);
      return;
    }

    // Find the current stage index
    const stageIndex = GENERATION_STAGES.findIndex(s => s.key === stage);
    if (stageIndex !== -1) {
      setCurrentStageIndex(stageIndex);
    }

    // Calculate overall progress
    const totalStages = GENERATION_STAGES.length;
    const stageProgress = ((stageIndex + 1) / totalStages) * 100;
    setProgress(stageProgress);
  }, [isGenerating, stage]);

  if (!isGenerating) {
    return null;
  }

  const currentStage = GENERATION_STAGES[currentStageIndex];
  const IconComponent = currentStage.icon;

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader className='text-center'>
        <div className='flex justify-center mb-4'>
          <div className='relative'>
            <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center'>
              <IconComponent className='h-8 w-8 text-primary' />
            </div>
            <div className='absolute inset-0 rounded-full border-2 border-primary/20'>
              <div
                className='absolute inset-0 rounded-full border-2 border-primary transition-all duration-1000 ease-in-out'
                style={{
                  clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)`,
                }}
              />
            </div>
          </div>
        </div>
        <CardTitle className='flex items-center justify-center gap-2'>
          <Loader2 className='h-5 w-5 animate-spin' />
          {currentStage.label}
        </CardTitle>
        {message && (
          <p className='text-sm text-muted-foreground mt-2'>{message}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <Progress value={progress} className='w-full' />

          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>
              Step {currentStageIndex + 1} of {GENERATION_STAGES.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>

          {/* Stage indicators */}
          <div className='flex justify-between items-center mt-6'>
            {GENERATION_STAGES.map((stageItem, index) => {
              const StageIcon = stageItem.icon;
              const isActive = index === currentStageIndex;
              const isComplete = index < currentStageIndex;
              const _isPending = index > currentStageIndex;

              return (
                <div
                  key={stageItem.key}
                  className='flex flex-col items-center space-y-2 flex-1'
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                        : isComplete
                          ? 'bg-primary/80 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isActive ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <StageIcon className='h-4 w-4' />
                    )}
                  </div>
                  <span
                    className={`text-xs text-center max-w-[80px] leading-tight ${
                      isActive
                        ? 'text-foreground font-medium'
                        : isComplete
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {stageItem.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
