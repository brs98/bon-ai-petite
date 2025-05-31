'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  COMMON_ALLERGIES,
  CUISINE_TYPES,
  DIETARY_RESTRICTIONS,
  type NutritionProfile,
} from '@/types/recipe';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  Heart,
  Shield,
  UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const PreferencesSchema = z.object({
  favoriteTypes: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  preferredMealTimes: z.array(z.string()).optional(),
  cookingSkillLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional(),
  timePreference: z.enum(['quick', 'moderate', 'elaborate']).optional(),
});

type PreferencesData = z.infer<typeof PreferencesSchema>;

interface PreferencesWizardProps {
  onComplete: (preferences: Partial<NutritionProfile>) => void;
  isLoading: boolean;
  initialData?: Partial<NutritionProfile>;
}

const STEPS = [
  {
    id: 'cuisine',
    title: 'Favorite Cuisines',
    description: 'What types of cuisine do you enjoy?',
    icon: UtensilsCrossed,
  },
  {
    id: 'dietary',
    title: 'Dietary Preferences',
    description: 'Any dietary restrictions or preferences?',
    icon: Heart,
  },
  {
    id: 'allergies',
    title: 'Allergies & Intolerances',
    description: 'What ingredients should we avoid?',
    icon: Shield,
  },
  {
    id: 'cooking',
    title: 'Cooking Preferences',
    description: 'Tell us about your cooking style',
    icon: ChefHat,
  },
] as const;

export function PreferencesWizard({
  onComplete,
  isLoading,
  initialData,
}: PreferencesWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(
    initialData?.cuisinePreferences || [],
  );
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>(
    initialData?.dietaryRestrictions || [],
  );
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    initialData?.allergies || [],
  );

  const form = useForm<PreferencesData>({
    resolver: zodResolver(PreferencesSchema),
    defaultValues: {
      favoriteTypes: selectedCuisines,
      dietaryRestrictions: selectedRestrictions,
      allergies: selectedAllergies,
      cookingSkillLevel: 'intermediate',
      timePreference: 'moderate',
    },
  });

  const toggleSelection = (
    item: string,
    currentSelection: string[],
    setSelection: (items: string[]) => void,
  ) => {
    if (currentSelection.includes(item)) {
      setSelection(currentSelection.filter(i => i !== item));
    } else {
      setSelection([...currentSelection, item]);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = (_data: PreferencesData) => {
    const preferences: Partial<NutritionProfile> = {
      cuisinePreferences:
        selectedCuisines.length > 0 ? selectedCuisines : undefined,
      dietaryRestrictions:
        selectedRestrictions.length > 0 ? selectedRestrictions : undefined,
      allergies: selectedAllergies.length > 0 ? selectedAllergies : undefined,
    };
    onComplete(preferences);
  };

  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;

  const renderCuisineStep = () => (
    <div className='space-y-6'>
      <div className='text-center space-y-2'>
        <UtensilsCrossed className='h-12 w-12 mx-auto text-primary' />
        <h2 className='text-2xl font-bold'>What cuisines do you love?</h2>
        <p className='text-muted-foreground'>
          Select all the cuisines you'd like to see in your recipes. You can
          always change this later.
        </p>
      </div>

      <div className='flex flex-wrap gap-3 justify-center max-w-4xl mx-auto'>
        {CUISINE_TYPES.map(cuisine => (
          <Badge
            key={cuisine}
            variant={selectedCuisines.includes(cuisine) ? 'default' : 'outline'}
            className='cursor-pointer hover:bg-accent text-sm py-2 px-4 transition-all'
            onClick={() =>
              toggleSelection(cuisine, selectedCuisines, setSelectedCuisines)
            }
          >
            {selectedCuisines.includes(cuisine) && (
              <Check className='h-3 w-3 mr-1' />
            )}
            {cuisine}
          </Badge>
        ))}
      </div>

      {selectedCuisines.length > 0 && (
        <p className='text-center text-sm text-muted-foreground'>
          Selected {selectedCuisines.length} cuisine
          {selectedCuisines.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );

  const renderDietaryStep = () => (
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
        {DIETARY_RESTRICTIONS.map(restriction => (
          <Badge
            key={restriction}
            variant={
              selectedRestrictions.includes(restriction) ? 'default' : 'outline'
            }
            className='cursor-pointer hover:bg-accent text-sm py-2 px-4 transition-all'
            onClick={() =>
              toggleSelection(
                restriction,
                selectedRestrictions,
                setSelectedRestrictions,
              )
            }
          >
            {selectedRestrictions.includes(restriction) && (
              <Check className='h-3 w-3 mr-1' />
            )}
            {restriction}
          </Badge>
        ))}
      </div>

      {selectedRestrictions.length === 0 && (
        <p className='text-center text-sm text-muted-foreground'>
          No dietary restrictions? That's perfectly fine - we'll show you
          recipes from all categories.
        </p>
      )}
    </div>
  );

  const renderAllergiesStep = () => (
    <div className='space-y-6'>
      <div className='text-center space-y-2'>
        <Shield className='h-12 w-12 mx-auto text-primary' />
        <h2 className='text-2xl font-bold'>Allergies & intolerances</h2>
        <p className='text-muted-foreground'>
          Select any ingredients we should avoid in your recipes for your safety
          and comfort.
        </p>
      </div>

      <div className='flex flex-wrap gap-3 justify-center max-w-4xl mx-auto'>
        {COMMON_ALLERGIES.map(allergy => (
          <Badge
            key={allergy}
            variant={
              selectedAllergies.includes(allergy) ? 'destructive' : 'outline'
            }
            className='cursor-pointer hover:bg-accent text-sm py-2 px-4 transition-all'
            onClick={() =>
              toggleSelection(allergy, selectedAllergies, setSelectedAllergies)
            }
          >
            {selectedAllergies.includes(allergy) && (
              <Check className='h-3 w-3 mr-1' />
            )}
            {allergy}
          </Badge>
        ))}
      </div>

      {selectedAllergies.length === 0 && (
        <p className='text-center text-sm text-muted-foreground'>
          No allergies or intolerances? Great - we can use the full range of
          ingredients.
        </p>
      )}
    </div>
  );

  const renderCookingStep = () => (
    <div className='space-y-6'>
      <div className='text-center space-y-2'>
        <ChefHat className='h-12 w-12 mx-auto text-primary' />
        <h2 className='text-2xl font-bold'>Cooking preferences</h2>
        <p className='text-muted-foreground'>
          Tell us about your cooking style so we can suggest appropriate
          recipes.
        </p>
      </div>

      <Form {...form}>
        <div className='max-w-2xl mx-auto space-y-8'>
          <FormField
            control={form.control}
            name='cookingSkillLevel'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-base font-medium'>
                  What's your cooking skill level?
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className='grid grid-cols-1 gap-4'
                  >
                    <FormItem>
                      <FormControl>
                        <div className='flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer'>
                          <RadioGroupItem value='beginner' id='beginner' />
                          <div>
                            <FormLabel
                              htmlFor='beginner'
                              className='cursor-pointer font-medium'
                            >
                              Beginner
                            </FormLabel>
                            <p className='text-sm text-muted-foreground'>
                              I'm just starting out and prefer simple recipes
                            </p>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <div className='flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer'>
                          <RadioGroupItem
                            value='intermediate'
                            id='intermediate'
                          />
                          <div>
                            <FormLabel
                              htmlFor='intermediate'
                              className='cursor-pointer font-medium'
                            >
                              Intermediate
                            </FormLabel>
                            <p className='text-sm text-muted-foreground'>
                              I can handle most recipes and enjoy trying new
                              techniques
                            </p>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <div className='flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer'>
                          <RadioGroupItem value='advanced' id='advanced' />
                          <div>
                            <FormLabel
                              htmlFor='advanced'
                              className='cursor-pointer font-medium'
                            >
                              Advanced
                            </FormLabel>
                            <p className='text-sm text-muted-foreground'>
                              I love complex recipes and challenging cooking
                              techniques
                            </p>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='timePreference'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-base font-medium'>
                  How much time do you usually have for cooking?
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className='grid grid-cols-1 gap-4'
                  >
                    <FormItem>
                      <FormControl>
                        <div className='flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer'>
                          <RadioGroupItem value='quick' id='quick' />
                          <div>
                            <FormLabel
                              htmlFor='quick'
                              className='cursor-pointer font-medium'
                            >
                              Quick (15-30 minutes)
                            </FormLabel>
                            <p className='text-sm text-muted-foreground'>
                              I prefer fast, simple meals
                            </p>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <div className='flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer'>
                          <RadioGroupItem value='moderate' id='moderate' />
                          <div>
                            <FormLabel
                              htmlFor='moderate'
                              className='cursor-pointer font-medium'
                            >
                              Moderate (30-60 minutes)
                            </FormLabel>
                            <p className='text-sm text-muted-foreground'>
                              I don't mind spending some time cooking
                            </p>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <div className='flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer'>
                          <RadioGroupItem value='elaborate' id='elaborate' />
                          <div>
                            <FormLabel
                              htmlFor='elaborate'
                              className='cursor-pointer font-medium'
                            >
                              Elaborate (60+ minutes)
                            </FormLabel>
                            <p className='text-sm text-muted-foreground'>
                              I love taking my time and creating elaborate meals
                            </p>
                          </div>
                        </div>
                      </FormControl>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderCuisineStep();
      case 1:
        return renderDietaryStep();
      case 2:
        return renderAllergiesStep();
      case 3:
        return renderCookingStep();
      default:
        return renderCuisineStep();
    }
  };

  return (
    <div className='w-full max-w-6xl mx-auto space-y-8'>
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <currentStepData.icon className='h-5 w-5' />
                {currentStepData.title}
              </CardTitle>
              <p className='text-sm text-muted-foreground mt-1'>
                Step {currentStep + 1} of {STEPS.length}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-sm font-medium'>
                {Math.round(progress)}% complete
              </p>
            </div>
          </div>
          <Progress value={progress} className='w-full' />
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className='py-8'>{renderCurrentStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className='flex justify-between'>
        <Button
          variant='outline'
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className='gap-2'
        >
          <ArrowLeft className='h-4 w-4' />
          Previous
        </Button>

        {isLastStep ? (
          <Button
            onClick={e => {
              e.preventDefault();
              void form.handleSubmit(handleComplete)(e);
            }}
            disabled={isLoading}
            size='lg'
            className='gap-2'
          >
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Check className='h-4 w-4' />
                Complete Setup
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} className='gap-2'>
            Next
            <ArrowRight className='h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  );
}
