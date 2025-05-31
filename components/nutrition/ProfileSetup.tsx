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
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { calculateDailyCalories, calculateMacros } from '@/lib/utils/nutrition';
import {
  ACTIVITY_LEVELS,
  COMMON_ALLERGIES,
  CUISINE_TYPES,
  DIETARY_RESTRICTIONS,
  NutritionProfileSchema,
  type NutritionProfile,
} from '@/types/recipe';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { GoalsSelector } from './GoalsSelector';
import { MacroTracker } from './MacroTracker';

interface ProfileSetupProps {
  initialData?: Partial<NutritionProfile>;
  onSave: (data: Partial<NutritionProfile>) => Promise<void>;
  isLoading?: boolean;
}

export function ProfileSetup({
  initialData,
  onSave,
  isLoading = false,
}: ProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState(initialData?.goals || '');
  const [calculatedCalories, setCalculatedCalories] = useState<
    number | undefined
  >(initialData?.dailyCalories || undefined);

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
      title: 'Dietary Preferences',
      description: 'Food preferences and restrictions',
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
  }, watchedValues);

  const onSubmit = async (data: Partial<NutritionProfile>) => {
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
              {currentStep === 0 && (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <FormField
                    control={form.control}
                    name='age'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='25'
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
                    name='height'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='175'
                            {...field}
                            onChange={e =>
                              field.onChange(
                                parseInt(e.target.value) || undefined,
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Your height in centimeters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='weight'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='70'
                            {...field}
                            onChange={e =>
                              field.onChange(
                                parseInt(e.target.value) || undefined,
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Your current weight in kilograms
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 1 && (
                <div className='space-y-6'>
                  <FormField
                    control={form.control}
                    name='activityLevel'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select your activity level' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ACTIVITY_LEVELS.map(level => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This helps us calculate your daily calorie needs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <GoalsSelector
                    selectedGoal={selectedGoal}
                    onGoalSelect={goal => {
                      setSelectedGoal(goal);
                      form.setValue(
                        'goals',
                        goal as
                          | 'lose_weight'
                          | 'gain_weight'
                          | 'maintain_weight'
                          | 'gain_muscle'
                          | 'improve_health',
                      );
                    }}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className='space-y-6'>
                  <FormField
                    control={form.control}
                    name='allergies'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergies</FormLabel>
                        <FormDescription>
                          Select any food allergies you have
                        </FormDescription>
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                          {COMMON_ALLERGIES.map(allergy => (
                            <div
                              key={allergy}
                              className='flex items-center space-x-2'
                            >
                              <Checkbox
                                id={`allergy-${allergy}`}
                                checked={field.value?.includes(allergy)}
                                onCheckedChange={checked => {
                                  if (checked) {
                                    field.onChange([
                                      ...(field.value || []),
                                      allergy,
                                    ]);
                                  } else {
                                    field.onChange(
                                      field.value?.filter(
                                        item => item !== allergy,
                                      ),
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor={`allergy-${allergy}`}>
                                {allergy}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='dietaryRestrictions'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary Restrictions</FormLabel>
                        <FormDescription>
                          Select any dietary preferences you follow
                        </FormDescription>
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                          {DIETARY_RESTRICTIONS.map(restriction => (
                            <div
                              key={restriction}
                              className='flex items-center space-x-2'
                            >
                              <Checkbox
                                id={`restriction-${restriction}`}
                                checked={field.value?.includes(restriction)}
                                onCheckedChange={checked => {
                                  if (checked) {
                                    field.onChange([
                                      ...(field.value || []),
                                      restriction,
                                    ]);
                                  } else {
                                    field.onChange(
                                      field.value?.filter(
                                        item => item !== restriction,
                                      ),
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor={`restriction-${restriction}`}>
                                {restriction}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='cuisinePreferences'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Cuisines</FormLabel>
                        <FormDescription>
                          Select cuisines you enjoy (optional)
                        </FormDescription>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                          {CUISINE_TYPES.map(cuisine => (
                            <div
                              key={cuisine}
                              className='flex items-center space-x-2'
                            >
                              <Checkbox
                                id={`cuisine-${cuisine}`}
                                checked={field.value?.includes(cuisine)}
                                onCheckedChange={checked => {
                                  if (checked) {
                                    field.onChange([
                                      ...(field.value || []),
                                      cuisine,
                                    ]);
                                  } else {
                                    field.onChange(
                                      field.value?.filter(
                                        item => item !== cuisine,
                                      ),
                                    );
                                  }
                                }}
                              />
                              <Label htmlFor={`cuisine-${cuisine}`}>
                                {cuisine}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                  <div className='space-y-6'>
                    <FormField
                      control={form.control}
                      name='dailyCalories'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Calorie Target</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder='2000'
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

                    <div className='grid grid-cols-3 gap-4'>
                      <FormField
                        control={form.control}
                        name='macroProtein'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Protein (g)</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                placeholder='150'
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
                          <FormItem>
                            <FormLabel>Carbs (g)</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                placeholder='200'
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
                          <FormItem>
                            <FormLabel>Fat (g)</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                placeholder='65'
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
                  </div>

                  <MacroTracker
                    data-testid='macro-tracker'
                    dailyCalories={formValues.dailyCalories}
                    macroProtein={formValues.macroProtein}
                    macroCarbs={formValues.macroCarbs}
                    macroFat={formValues.macroFat}
                  />
                </div>
              )}

              {currentStep === 4 && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                  <div className='space-y-4'>
                    <h3 className='text-lg font-medium'>Profile Summary</h3>

                    <div className='space-y-4'>
                      <div>
                        <h4 className='font-medium text-sm'>Physical Stats</h4>
                        <p className='text-sm text-muted-foreground'>
                          {formValues.age} years old, {formValues.height}cm,{' '}
                          {formValues.weight}kg
                        </p>
                      </div>

                      <div>
                        <h4 className='font-medium text-sm'>
                          Activity & Goals
                        </h4>
                        <p className='text-sm text-muted-foreground'>
                          {
                            ACTIVITY_LEVELS.find(
                              l => l.value === formValues.activityLevel,
                            )?.label
                          }
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          Goal: {formValues.goals?.replace('_', ' ')}
                        </p>
                      </div>

                      {(formValues.allergies?.length ||
                        formValues.dietaryRestrictions?.length) && (
                        <div>
                          <h4 className='font-medium text-sm'>
                            Dietary Restrictions
                          </h4>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {formValues.allergies?.map(allergy => (
                              <Badge
                                key={allergy}
                                variant='destructive'
                                className='text-xs'
                              >
                                {allergy}
                              </Badge>
                            ))}
                            {formValues.dietaryRestrictions?.map(
                              restriction => (
                                <Badge
                                  key={restriction}
                                  variant='secondary'
                                  className='text-xs'
                                >
                                  {restriction}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {formValues.cuisinePreferences?.length && (
                        <div>
                          <h4 className='font-medium text-sm'>
                            Preferred Cuisines
                          </h4>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {formValues.cuisinePreferences.map(cuisine => (
                              <Badge
                                key={cuisine}
                                variant='outline'
                                className='text-xs'
                              >
                                {cuisine}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <MacroTracker
                    data-testid='macro-tracker'
                    dailyCalories={formValues.dailyCalories}
                    macroProtein={formValues.macroProtein}
                    macroCarbs={formValues.macroCarbs}
                    macroFat={formValues.macroFat}
                  />
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
