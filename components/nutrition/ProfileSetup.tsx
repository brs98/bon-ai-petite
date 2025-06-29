'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { calculateDailyCalories, calculateMacros } from '@/lib/utils/nutrition';
import {
  ACTIVITY_LEVELS,
  FITNESS_GOALS,
  NutritionProfileSchema,
  type NutritionProfile,
} from '@/types/recipe';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Apple,
  ClipboardCheck,
  Dumbbell,
  Ruler,
  User,
  Weight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AllergyPreferencesStep } from '../recipes/RecipeGenerator/AllergyPreferencesStep';
import { CuisinePreferencesStep } from '../recipes/RecipeGenerator/CuisinePreferencesStep';
import { DietaryPreferencesStep } from '../recipes/RecipeGenerator/DietaryPreferencesStep';
import { MacroTracker } from './MacroTracker';

interface ProfileSetupProps {
  initialData?: Partial<NutritionProfile>;
  onSave: (data: Partial<NutritionProfile>) => Promise<void>;
  isLoading?: boolean;
}

function formatHeight(heightIn?: number) {
  if (!heightIn) return '';
  const feet = Math.floor(heightIn / 12);
  const inches = heightIn % 12;
  return `${feet}ft ${inches}in`;
}

export function ProfileSetup({
  initialData,
  onSave,
  isLoading = false,
}: ProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [calculatedCalories, setCalculatedCalories] = useState<
    number | undefined
  >(initialData?.dailyCalories || undefined);
  const [heightFeet, setHeightFeet] = useState<number | undefined>(
    initialData?.height ? Math.floor(initialData.height / 12) : undefined,
  );
  const [heightInches, setHeightInches] = useState<number | undefined>(
    initialData?.height ? initialData.height % 12 : undefined,
  );
  const [weightLbs, setWeightLbs] = useState<number | undefined>(
    initialData?.weight || undefined,
  );

  const form = useForm<Partial<NutritionProfile>>({
    resolver: zodResolver(NutritionProfileSchema.partial()),
    defaultValues: {
      age: initialData?.age || undefined,
      height: initialData?.height || undefined,
      weight: initialData?.weight || undefined,
      activityLevel: initialData?.activityLevel || undefined,
      goals: initialData?.goals || undefined,
      dailyCalories: initialData?.dailyCalories || undefined,
      macroProtein: initialData?.macroProtein || undefined,
      macroCarbs: initialData?.macroCarbs || undefined,
      macroFat: initialData?.macroFat || undefined,
      allergies: initialData?.allergies || [],
      dietaryRestrictions: initialData?.dietaryRestrictions || [],
      cuisinePreferences: initialData?.cuisinePreferences || [],
    },
  });

  const steps = [
    { title: 'Physical Stats', description: 'Basic information about you' },
    { title: 'Activity & Goals', description: 'Your lifestyle and objectives' },
    {
      title: 'Allergies & Intolerances',
      description: 'Select any food allergies or intolerances you have.',
    },
    {
      title: 'Dietary Preferences',
      description: 'Select dietary patterns or restrictions you follow.',
    },
    {
      title: 'Preferred Cuisines',
      description: 'Select cuisines you enjoy (optional).',
    },
    { title: 'Nutrition Targets', description: 'Calorie and macro goals' },
    { title: 'Review', description: 'Review and save your profile' },
  ];

  // Auto-calculate calories when physical stats, activity level, or goals change
  const watchedValues = form.watch([
    'age',
    'weight',
    'height',
    'activityLevel',
    'goals',
  ]);

  useEffect(() => {
    const [age, weight, height, activityLevel, goals] = watchedValues;

    if (age && weight && height && activityLevel) {
      // Assuming male for now - in a real app, you'd ask for gender
      const calories = calculateDailyCalories({
        age,
        weight,
        height,
        activityLevel,
        goals: goals || 'maintain_weight',
        gender: 'male', // Default assumption
      });

      setCalculatedCalories(calories);
      form.setValue('dailyCalories', calories);

      // Auto-calculate macros
      const macros = calculateMacros(calories, goals || 'maintain_weight');
      form.setValue('macroProtein', macros.protein);
      form.setValue('macroCarbs', macros.carbs);
      form.setValue('macroFat', macros.fat);
    }

    // Sync form height/weight with local ft/in/lbs state
    if (typeof heightFeet === 'number' && typeof heightInches === 'number') {
      form.setValue('height', heightFeet * 12 + heightInches);
    }
    if (typeof weightLbs === 'number') {
      form.setValue('weight', weightLbs);
    }
  }, watchedValues);

  const onSubmit = async (data: Partial<NutritionProfile>) => {
    // Ensure height and weight are set from local state
    data.height =
      typeof heightFeet === 'number' && typeof heightInches === 'number'
        ? heightFeet * 12 + heightInches
        : undefined;
    data.weight = typeof weightLbs === 'number' ? weightLbs : undefined;
    await onSave(data);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formValues = form.watch();

  return (
    <div className='max-w-4xl mx-auto space-y-8'>
      {/* Progress indicator */}
      <div className='space-y-2'>
        <div className='flex justify-between text-sm text-muted-foreground'>
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span>
            {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
          </span>
        </div>
        <div className='w-full bg-muted h-2 rounded-full'>
          <div
            className='bg-primary h-2 rounded-full transition-all duration-300'
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={e => {
            e.preventDefault();
            void form.handleSubmit(onSubmit)(e);
          }}
          className='space-y-8'
        >
          {/* Step content */}
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>
                {steps[currentStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {Number(currentStep) === 0 && (
                <div className='space-y-8 text-center'>
                  <div className='space-y-2'>
                    <User className='h-12 w-12 mx-auto text-primary' />
                    <h2 className='text-2xl font-bold'>Physical Stats</h2>
                    <p className='text-muted-foreground'>
                      Tell us about yourself so we can personalize your
                      nutrition plan.
                    </p>
                  </div>
                  <div className='flex flex-col md:flex-row gap-6 max-w-3xl mx-auto'>
                    {/* Age */}
                    <div className='flex-1 flex flex-col items-center'>
                      <FormField
                        control={form.control}
                        name='age'
                        render={({ field }) => (
                          <FormItem className='w-full'>
                            <FormLabel className='flex items-center gap-2 justify-center'>
                              <User className='h-5 w-5 text-muted-foreground' />{' '}
                              Age
                            </FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min={0}
                                placeholder='Enter your age'
                                className='w-full text-lg py-4 text-center'
                                {...field}
                                onChange={e =>
                                  field.onChange(
                                    parseInt(e.target.value) || undefined,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Height */}
                    <div className='flex-1 flex flex-col items-center'>
                      <FormItem className='w-full'>
                        <FormLabel className='flex items-center gap-2 justify-center'>
                          <Ruler className='h-5 w-5 text-muted-foreground' />{' '}
                          Height
                        </FormLabel>
                        <div className='flex gap-2 items-end justify-center w-full'>
                          <Input
                            type='number'
                            min={0}
                            placeholder='Feet'
                            value={heightFeet ?? ''}
                            onChange={e =>
                              setHeightFeet(parseInt(e.target.value) || 0)
                            }
                            className='w-full text-lg py-4 text-center'
                            aria-label='Height (feet)'
                          />
                          <span className='self-center'>ft</span>
                          <Input
                            type='number'
                            min={0}
                            max={11}
                            placeholder='Inches'
                            value={heightInches ?? ''}
                            onChange={e =>
                              setHeightInches(parseInt(e.target.value) || 0)
                            }
                            className='w-full text-lg py-4 text-center'
                            aria-label='Height (inches)'
                          />
                          <span className='self-center'>in</span>
                        </div>
                      </FormItem>
                    </div>
                    {/* Weight */}
                    <div className='flex-1 flex flex-col items-center'>
                      <FormItem className='w-full'>
                        <FormLabel className='flex items-center gap-2 justify-center'>
                          <Weight className='h-5 w-5 text-muted-foreground' />{' '}
                          Weight (lbs)
                        </FormLabel>
                        <Input
                          type='number'
                          min={0}
                          placeholder='Pounds'
                          value={weightLbs ?? ''}
                          onChange={e =>
                            setWeightLbs(parseInt(e.target.value) || 0)
                          }
                          className='w-full text-lg py-4 text-center'
                          aria-label='Weight (lbs)'
                        />
                      </FormItem>
                    </div>
                  </div>
                </div>
              )}

              {Number(currentStep) === 1 && (
                <div className='space-y-8 text-center'>
                  <div className='space-y-2'>
                    <Dumbbell className='h-12 w-12 mx-auto text-primary' />
                    <h2 className='text-2xl font-bold'>Activity & Goals</h2>
                    <p className='text-muted-foreground'>
                      Tell us about your lifestyle and fitness goals so we can
                      personalize your nutrition plan.
                    </p>
                  </div>
                  <div className='flex flex-col gap-8 max-w-2xl mx-auto'>
                    {/* Activity Level Badge Group */}
                    <FormField
                      control={form.control}
                      name='activityLevel'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-2 justify-center'>
                            Activity Level
                          </FormLabel>
                          <div className='flex flex-wrap gap-3 justify-center'>
                            {ACTIVITY_LEVELS.map(level => (
                              <Button
                                key={level.value}
                                type='button'
                                variant={
                                  field.value === level.value
                                    ? 'default'
                                    : 'outline'
                                }
                                className='py-2 px-4 text-sm'
                                onClick={() => field.onChange(level.value)}
                              >
                                {level.label}
                              </Button>
                            ))}
                          </div>
                          <FormDescription>
                            This helps us calculate your daily calorie needs
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Goals Badge Group */}
                    <FormField
                      control={form.control}
                      name='goals'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-2 justify-center'>
                            Fitness Goal
                          </FormLabel>
                          <div className='flex flex-wrap gap-3 justify-center'>
                            {FITNESS_GOALS.map(goal => (
                              <Button
                                key={goal.value}
                                type='button'
                                variant={
                                  field.value === goal.value
                                    ? 'default'
                                    : 'outline'
                                }
                                className='py-2 px-4 text-sm'
                                onClick={() => {
                                  field.onChange(goal.value);
                                }}
                              >
                                {goal.label}
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {Number(currentStep) === 2 && (
                <FormField
                  control={form.control}
                  name='allergies'
                  render={({ field }) => (
                    <AllergyPreferencesStep
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}

              {Number(currentStep) === 3 && (
                <FormField
                  control={form.control}
                  name='dietaryRestrictions'
                  render={({ field }) => (
                    <DietaryPreferencesStep
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}

              {Number(currentStep) === 4 && (
                <FormField
                  control={form.control}
                  name='cuisinePreferences'
                  render={({ field }) => (
                    <CuisinePreferencesStep
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}

              {Number(currentStep) === 5 && (
                <div className='space-y-8 text-center'>
                  <div className='space-y-2'>
                    <Apple className='h-12 w-12 mx-auto text-primary' />
                    <h2 className='text-2xl font-bold'>Nutrition Targets</h2>
                    <p className='text-muted-foreground'>
                      Set your daily calorie and macronutrient goals. We'll use
                      these to personalize your meal plans.
                    </p>
                  </div>
                  <div className='flex flex-col gap-8 max-w-2xl mx-auto'>
                    <FormField
                      control={form.control}
                      name='dailyCalories'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-2 justify-center'>
                            Daily Calorie Target
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder='Daily calorie target'
                              className='text-lg py-4 text-center'
                              {...field}
                              onChange={e =>
                                field.onChange(
                                  parseInt(e.target.value) || undefined,
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            {calculatedCalories && (
                              <span>
                                Suggested: {calculatedCalories} calories based
                                on your profile
                              </span>
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className='flex flex-col md:flex-row gap-6 justify-center'>
                      <FormField
                        control={form.control}
                        name='macroProtein'
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <FormLabel className='flex items-center gap-2 justify-center'>
                              Protein (g)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                placeholder='Protein (g)'
                                className='text-lg py-4 text-center'
                                {...field}
                                onChange={e =>
                                  field.onChange(
                                    parseInt(e.target.value) || undefined,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='macroCarbs'
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <FormLabel className='flex items-center gap-2 justify-center'>
                              Carbs (g)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                placeholder='Carbs (g)'
                                className='text-lg py-4 text-center'
                                {...field}
                                onChange={e =>
                                  field.onChange(
                                    parseInt(e.target.value) || undefined,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='macroFat'
                        render={({ field }) => (
                          <FormItem className='flex-1'>
                            <FormLabel className='flex items-center gap-2 justify-center'>
                              Fat (g)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                placeholder='Fat (g)'
                                className='text-lg py-4 text-center'
                                {...field}
                                onChange={e =>
                                  field.onChange(
                                    parseInt(e.target.value) || undefined,
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <MacroTracker
                      data-testid='macro-tracker'
                      dailyCalories={formValues.dailyCalories}
                      macroProtein={formValues.macroProtein}
                      macroCarbs={formValues.macroCarbs}
                      macroFat={formValues.macroFat}
                    />
                  </div>
                </div>
              )}

              {Number(currentStep) === 6 && (
                <div className='space-y-8 text-center'>
                  <div className='space-y-2'>
                    <ClipboardCheck className='h-12 w-12 mx-auto text-primary' />
                    <h2 className='text-2xl font-bold'>Review Your Profile</h2>
                    <p className='text-muted-foreground'>
                      Please review your information below. You can edit any
                      section before saving.
                    </p>
                  </div>
                  <div className='flex flex-col gap-8 max-w-2xl mx-auto text-left'>
                    {/* Physical Stats */}
                    <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                      <div className='flex justify-between items-center'>
                        <h3 className='font-semibold text-lg'>
                          Physical Stats
                        </h3>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          onClick={() => setCurrentStep(0)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className='text-muted-foreground'>
                        {formValues.age} years old,{' '}
                        {formatHeight(formValues.height)}, {formValues.weight}{' '}
                        lbs
                      </div>
                    </div>
                    {/* Activity & Goals */}
                    <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                      <div className='flex justify-between items-center'>
                        <h3 className='font-semibold text-lg'>
                          Activity & Goals
                        </h3>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          onClick={() => setCurrentStep(1)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <Badge>
                          {ACTIVITY_LEVELS.find(
                            l => l.value === formValues.activityLevel,
                          )?.label || formValues.activityLevel}
                        </Badge>
                        <Badge>
                          {FITNESS_GOALS.find(g => g.value === formValues.goals)
                            ?.label || formValues.goals}
                        </Badge>
                      </div>
                    </div>
                    {/* Allergies */}
                    <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                      <div className='flex justify-between items-center'>
                        <h3 className='font-semibold text-lg'>
                          Allergies & Intolerances
                        </h3>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          onClick={() => setCurrentStep(2)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {(formValues.allergies?.length
                          ? formValues.allergies
                          : ['None']
                        ).map(a => (
                          <Badge key={a}>{a}</Badge>
                        ))}
                      </div>
                    </div>
                    {/* Dietary Preferences */}
                    <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                      <div className='flex justify-between items-center'>
                        <h3 className='font-semibold text-lg'>
                          Dietary Preferences
                        </h3>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          onClick={() => setCurrentStep(3)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {(formValues.dietaryRestrictions?.length
                          ? formValues.dietaryRestrictions
                          : ['None']
                        ).map(d => (
                          <Badge key={d}>{d}</Badge>
                        ))}
                      </div>
                    </div>
                    {/* Preferred Cuisines */}
                    <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                      <div className='flex justify-between items-center'>
                        <h3 className='font-semibold text-lg'>
                          Preferred Cuisines
                        </h3>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          onClick={() => setCurrentStep(4)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {(formValues.cuisinePreferences?.length
                          ? formValues.cuisinePreferences
                          : ['None']
                        ).map(c => (
                          <Badge key={c}>{c}</Badge>
                        ))}
                      </div>
                    </div>
                    {/* Nutrition Targets */}
                    <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                      <div className='flex justify-between items-center'>
                        <h3 className='font-semibold text-lg'>
                          Nutrition Targets
                        </h3>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          onClick={() => setCurrentStep(5)}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className='flex flex-wrap gap-4'>
                        <div>
                          <span className='font-medium'>Calories:</span>{' '}
                          {formValues.dailyCalories || '—'} kcal
                        </div>
                        <div>
                          <span className='font-medium'>Protein:</span>{' '}
                          {formValues.macroProtein || '—'} g
                        </div>
                        <div>
                          <span className='font-medium'>Carbs:</span>{' '}
                          {formValues.macroCarbs || '—'} g
                        </div>
                        <div>
                          <span className='font-medium'>Fat:</span>{' '}
                          {formValues.macroFat || '—'} g
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className='flex justify-between'>
            <Button
              type='button'
              variant='outline'
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className='flex gap-2'>
              {currentStep < steps.length - 1 ? (
                <Button type='button' onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type='submit' disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
