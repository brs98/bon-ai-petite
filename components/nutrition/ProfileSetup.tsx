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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { calculateMacroProfile } from '@/lib/utils/nutrition';
import {
  ACTIVITY_LEVELS,
  FITNESS_GOALS,
  NutritionProfileSchema,
  type NutritionProfile,
} from '@/types/recipe';
import { zodResolver } from '@hookform/resolvers/zod';
import { Apple, ChefHat, Dumbbell, Ruler, User, Weight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Cell, Pie, PieChart } from 'recharts';
import { AllergyPreferencesStep } from '../recipes/RecipeGenerator/AllergyPreferencesStep';
import { CuisinePreferencesStep } from '../recipes/RecipeGenerator/CuisinePreferencesStep';
import { DietaryPreferencesStep } from '../recipes/RecipeGenerator/DietaryPreferencesStep';

interface ProfileSetupProps {
  initialData?: Partial<NutritionProfile>;
  onSave: (
    data: Partial<NutritionProfile>,
    isFinalSave: boolean,
  ) => Promise<void>;
  isLoading?: boolean;
  currentStep: number;
  onStepChange: (step: number) => void;
  showConfirmation: boolean;
  onShowConfirmation: () => void;
  onComplete: () => void;
}

const WEIGHT_GOALS: ('lose_weight' | 'maintain_weight' | 'gain_weight')[] = [
  'lose_weight',
  'maintain_weight',
  'gain_weight',
];

function formatHeight(heightIn?: number) {
  if (!heightIn) return '';
  const feet = Math.floor(heightIn / 12);
  const inches = heightIn % 12;
  return `${feet}ft ${inches}in`;
}

// Utility to get user-friendly label for activity level
function getActivityLevelLabel(value?: string) {
  const found = ACTIVITY_LEVELS.find(l => l.value === value);
  return found
    ? found.label
    : value
      ? capitalizeFirst(value.replace('_', ' '))
      : '';
}
// Utility to get user-friendly label for goal
function getGoalLabel(value?: string) {
  const found = FITNESS_GOALS.find(g => g.value === value);
  return found
    ? found.label
    : value
      ? capitalizeFirst(value.replace('_', ' '))
      : '';
}
// Fallback capitalizeFirst utility
function capitalizeFirst(str?: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Macro split options for user selection
const MACRO_SPLIT_OPTIONS = [
  {
    label: 'Balanced / Zone Diet',
    split: { carbs: 40, protein: 30, fat: 30 },
    description: '40% carbs / 30% protein / 30% fat',
    benefits: [
      'Helps stabilize blood sugar and insulin',
      'Supports muscle maintenance while managing fat',
      'Reduces hunger by emphasizing protein and fat',
    ],
    commonFor: 'General health, body recomposition, insulin sensitivity',
    colors: ['#22c55e', '#ef4444', '#f59e0b'], // green, red, orange
  },
  {
    label: 'High-Protein Fat Loss',
    split: { carbs: 50, protein: 30, fat: 20 },
    description: '50% carbs / 30% protein / 20% fat',
    benefits: [
      'Promotes fat loss while preserving lean muscle',
      'Higher carbs can help support workouts and mood',
    ],
    commonFor: 'Cutting phases, fitness beginners, sustainable dieting',
    colors: ['#22c55e', '#ef4444', '#f59e0b'], // green, red, orange
  },
  {
    label: 'Athletic Performance',
    split: { carbs: 40, protein: 40, fat: 20 },
    description: '40% carbs / 40% protein / 20% fat',
    benefits: [
      'Supports high activity levels and muscle recovery',
      'Encourages muscle building while controlling fat',
    ],
    commonFor: 'Athletes, weightlifters, bodybuilders',
    colors: ['#22c55e', '#ef4444', '#f59e0b'], // green, red, orange
  },
  {
    label: 'High-Carb',
    split: { carbs: 60, protein: 20, fat: 20 },
    description: '60% carbs / 20% protein / 20% fat',
    benefits: [
      'Fuels endurance training and cardio-intensive sports',
      'Supports glycogen replenishment',
    ],
    commonFor: 'Runners, cyclists, swimmers, vegans',
    colors: ['#22c55e', '#ef4444', '#f59e0b'], // green, red, orange
  },
  {
    label: 'Low-Carb / Keto-Inspired',
    split: { carbs: 20, protein: 40, fat: 40 },
    description: '20% carbs / 40% protein / 40% fat',
    benefits: [
      'Stabilizes energy and curbs sugar cravings',
      'Can support fat loss through satiety and reduced insulin',
    ],
    commonFor: 'Low-carb dieters, insulin resistance, fat loss',
    colors: ['#22c55e', '#ef4444', '#f59e0b'], // green, red, orange
  },
  {
    label: 'Ketogenic Diet',
    split: { carbs: 5, protein: 25, fat: 70 },
    description: '5% carbs / 25% protein / 70% fat',
    benefits: [
      'Triggers ketosis (fat-burning state)',
      'Good for neurological disorders (e.g., epilepsy), some weight loss strategies',
    ],
    commonFor: 'Keto followers, therapeutic diets, carb-sensitive individuals',
    colors: ['#22c55e', '#ef4444', '#f59e0b'], // green, red, orange
  },
  {
    label: 'Muscle Gain / Bulking',
    split: { carbs: 30, protein: 50, fat: 20 },
    description: '30% carbs / 50% protein / 20% fat',
    benefits: [
      'Maximizes protein synthesis and muscle repair',
      'Still provides energy without excessive fat gain',
    ],
    commonFor: 'Lean bulking phases, hard gainers',
    colors: ['#22c55e', '#ef4444', '#f59e0b'], // green, red, orange
  },
  {
    label: 'Custom',
    split: null, // Will be calculated from manual values
    description: 'Custom macro split',
    benefits: [
      'Fully customizable to your specific needs',
      'Perfect for advanced users with specific requirements',
    ],
    commonFor: 'Advanced users, specific dietary needs, fine-tuned nutrition',
    colors: ['#22c55e', '#ef4444', '#f59e0b'], // green, red, orange
  },
];

export function ProfileSetup({
  initialData,
  isLoading = false,
  onSave,
  currentStep,
  onStepChange,
  showConfirmation,
  onShowConfirmation,
  onComplete,
}: ProfileSetupProps) {
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
  const router = useRouter();

  const form = useForm<Partial<NutritionProfile>>({
    resolver: zodResolver(NutritionProfileSchema.partial()),
    defaultValues: {
      age: initialData?.age || undefined,
      height: initialData?.height || undefined,
      weight: initialData?.weight || undefined,
      goalWeight: initialData?.goalWeight || undefined,
      activityLevel: initialData?.activityLevel || undefined,
      goals: initialData?.goals || [],
      dailyCalories: initialData?.dailyCalories || undefined,
      macroProtein: initialData?.macroProtein || undefined,
      macroCarbs: initialData?.macroCarbs || undefined,
      macroFat: initialData?.macroFat || undefined,
      allergies: initialData?.allergies || [],
      dietaryRestrictions: initialData?.dietaryRestrictions || [],
      cuisinePreferences: initialData?.cuisinePreferences || [],
      gender: initialData?.gender || 'male', // Default to male
    },
  });

  // Automatically set goalWeight to weight if maintain_weight is selected
  useEffect(() => {
    const subscription = form.watch(values => {
      const goals = values.goals;
      const weight = values.weight;
      if (
        Array.isArray(goals) &&
        goals[0] === 'maintain_weight' &&
        weight !== undefined
      ) {
        // Only update if goalWeight is not already equal to weight
        if (values.goalWeight !== weight) {
          form.setValue('goalWeight', weight);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const steps = [
    { title: 'Physical Stats', description: 'Basic information about you' },
    {
      title: 'Activity Level',
      description: 'Your lifestyle and daily activity',
    },
    { title: 'Weight Goal', description: 'Your weight goal and target' },
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
  useEffect(() => {
    const [
      age,
      weight,
      height,
      activityLevel,
      goals,
      gender,
      dietaryRestrictions,
    ] = form.watch([
      'age',
      'weight',
      'height',
      'activityLevel',
      'goals',
      'gender',
      'dietaryRestrictions',
    ]);

    // Convert height (in) to cm, weight (lbs) to kg
    const heightCm = height ? Math.round(height * 2.54) : undefined;
    const weightKg = weight ? Math.round(weight * 0.453592) : undefined;
    const primaryGoal =
      Array.isArray(goals) && goals.length > 0 ? goals[0] : 'maintain_weight';

    if (age && weightKg && heightCm && activityLevel && gender) {
      const macroProfile = calculateMacroProfile({
        age,
        gender: gender as 'male' | 'female',
        height: heightCm,
        weight: weightKg,
        activityLevel,
        goal: primaryGoal,
        dietaryPreferences: dietaryRestrictions,
      });
      setCalculatedCalories(macroProfile.calories);
      form.setValue('dailyCalories', macroProfile.calories);
      form.setValue('macroProtein', macroProfile.protein);
      form.setValue('macroCarbs', macroProfile.carbs);
      form.setValue('macroFat', macroProfile.fat);
    }
    // Sync form height/weight with local ft/in/lbs state
    if (typeof heightFeet === 'number' && typeof heightInches === 'number') {
      form.setValue('height', heightFeet * 12 + heightInches);
    }
    if (typeof weightLbs === 'number') {
      form.setValue('weight', weightLbs);
    }
  }, [form, heightFeet, heightInches, weightLbs]);

  // Trigger calculation when reaching the nutrition targets step
  useEffect(() => {
    if (currentStep === 6) {
      const [
        age,
        weight,
        height,
        activityLevel,
        goals,
        gender,
        dietaryRestrictions,
      ] = form.watch([
        'age',
        'weight',
        'height',
        'activityLevel',
        'goals',
        'gender',
        'dietaryRestrictions',
      ]);

      // Convert height (in) to cm, weight (lbs) to kg
      const heightCm = height ? Math.round(height * 2.54) : undefined;
      const weightKg = weight ? Math.round(weight * 0.453592) : undefined;
      const primaryGoal =
        Array.isArray(goals) && goals.length > 0 ? goals[0] : 'maintain_weight';

      if (age && weightKg && heightCm && activityLevel && gender) {
        const macroProfile = calculateMacroProfile({
          age,
          gender: gender as 'male' | 'female',
          height: heightCm,
          weight: weightKg,
          activityLevel,
          goal: primaryGoal,
          dietaryPreferences: dietaryRestrictions,
        });
        setCalculatedCalories(macroProfile.calories);
        form.setValue('dailyCalories', macroProfile.calories);
        form.setValue('macroProtein', macroProfile.protein);
        form.setValue('macroCarbs', macroProfile.carbs);
        form.setValue('macroFat', macroProfile.fat);
      }
    }
  }, [currentStep, form]);

  // Watch form values for calories and macros
  const formValues = form.watch();

  // Macro split selection state
  const [selectedMacroSplit, setSelectedMacroSplit] = useState<number | null>(
    null,
  );

  // When a macro split is selected, update macro grams in the form
  function handleMacroSplitSelect(index: number) {
    setSelectedMacroSplit(index);
    const split = MACRO_SPLIT_OPTIONS[index].split;
    const calories = form.getValues('dailyCalories');

    // If it's the custom option (index 7), don't update macros automatically
    if (index === 7) {
      return;
    }

    if (calories && split) {
      form.setValue(
        'macroCarbs',
        Math.round((calories * split.carbs) / 100 / 4),
      );
      form.setValue(
        'macroProtein',
        Math.round((calories * split.protein) / 100 / 4),
      );
      form.setValue('macroFat', Math.round((calories * split.fat) / 100 / 9));
    }
  }

  // If user edits macro grams manually, select the custom option
  function handleManualMacroChange(
    field: 'macroProtein' | 'macroCarbs' | 'macroFat',
    value: number | undefined,
  ) {
    setSelectedMacroSplit(7); // Select the "Custom" option
    form.setValue(field, value);
  }

  // If calories change and a split is selected, recalculate macro grams
  useEffect(() => {
    if (selectedMacroSplit !== null && selectedMacroSplit !== 7) {
      // Skip custom option
      const split = MACRO_SPLIT_OPTIONS[selectedMacroSplit].split;
      const calories = form.getValues('dailyCalories');
      if (calories && split) {
        form.setValue(
          'macroCarbs',
          Math.round((calories * split.carbs) / 100 / 4),
        );
        form.setValue(
          'macroProtein',
          Math.round((calories * split.protein) / 100 / 4),
        );
        form.setValue('macroFat', Math.round((calories * split.fat) / 100 / 9));
      }
    }
  }, [form.watch('dailyCalories')]);

  const onSubmit = async (data: Partial<NutritionProfile>) => {
    // Ensure height and weight are set from local state
    data.height =
      typeof heightFeet === 'number' && typeof heightInches === 'number'
        ? heightFeet * 12 + heightInches
        : undefined;
    data.weight = typeof weightLbs === 'number' ? weightLbs : undefined;
    // Only include goals if non-empty
    data.goals =
      Array.isArray(data.goals) && data.goals.length > 0
        ? data.goals
        : undefined;
    // Debug log
    console.log('[ProfileSetup] onSubmit data:', data);
    console.log('[ProfileSetup] macro fields:', {
      macroProtein: data.macroProtein,
      macroCarbs: data.macroCarbs,
      macroFat: data.macroFat,
    });
    // Final save
    await onSave(data, true);
    onShowConfirmation(); // Restored to show confirmation screen
  };

  // Add this function to handle silent save after every step
  const handleStepChange = async (nextStep: number) => {
    // Get the latest form values
    const values = form.getValues();
    // Ensure height and weight are set from local state
    const profileData = {
      ...values,
      height:
        typeof heightFeet === 'number' && typeof heightInches === 'number'
          ? heightFeet * 12 + heightInches
          : undefined,
      weight: typeof weightLbs === 'number' ? weightLbs : undefined,
      goals:
        Array.isArray(values.goals) && values.goals.length > 0
          ? values.goals
          : undefined,
    };
    // Debug log
    console.log('[ProfileSetup] handleStepChange data:', profileData);
    try {
      await onSave(profileData, false); // background save
    } catch {
      // Silently ignore errors
    }
    onStepChange(nextStep);
  };

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      await handleStepChange(currentStep + 1);
    }
  };

  const prevStep = async () => {
    if (currentStep > 0) {
      await handleStepChange(currentStep - 1);
    }
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6 sm:space-y-8'>
      {/* Show confirmation after save */}
      {showConfirmation ? (
        <div className='flex flex-col items-center justify-center min-h-[300px] space-y-6'>
          <div className='text-center'>
            <h2 className='text-xl sm:text-2xl font-bold mb-2'>
              Profile Saved!
            </h2>
            <p className='text-muted-foreground mb-4 text-sm sm:text-base'>
              Your nutrition profile has been saved successfully.
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 w-full sm:w-auto'>
            <Button
              size='lg'
              variant='default'
              onClick={() => {
                onComplete();
                router.push('/dashboard/recipes/generate');
              }}
              className='w-full sm:w-auto'
            >
              Generate a Recipe
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='flex items-center gap-2 border-primary text-primary w-full sm:w-auto'
              onClick={() => {
                onComplete();
                router.push('/dashboard/meal-planning/weekly');
              }}
            >
              <ChefHat className='h-5 w-5' />
              Create Weekly Meal Plan
            </Button>
          </div>
        </div>
      ) : (
        <>
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
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={e => {
                e.preventDefault();
                void form.handleSubmit(onSubmit)();
              }}
              className='space-y-6 sm:space-y-8'
            >
              {/* Step content */}
              <Card>
                <CardHeader className='pb-4 sm:pb-6'>
                  <CardTitle className='text-lg sm:text-xl'>
                    {steps[currentStep].title}
                  </CardTitle>
                  <CardDescription className='text-sm'>
                    {steps[currentStep].description}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {Number(currentStep) === 0 && (
                    <div className='space-y-6 sm:space-y-8 text-center'>
                      <div className='space-y-2'>
                        <User className='h-8 w-8 sm:h-12 sm:w-12 mx-auto text-primary' />
                        <h2 className='text-xl sm:text-2xl font-bold'>
                          Physical Stats
                        </h2>
                        <p className='text-muted-foreground text-sm sm:text-base'>
                          Tell us about yourself so we can personalize your
                          nutrition plan.
                        </p>
                      </div>
                      <div className='flex flex-col gap-4 sm:gap-6 max-w-3xl mx-auto'>
                        {/* Age */}
                        <div className='flex-1 flex flex-col items-center'>
                          <FormField
                            control={form.control}
                            name='age'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel className='flex items-center gap-2 justify-center text-sm sm:text-base'>
                                  <User className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />{' '}
                                  Age
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    min={0}
                                    placeholder='Enter your age'
                                    className='w-full text-base sm:text-lg py-3 sm:py-4 text-center'
                                    {...field}
                                    value={
                                      field.value === undefined
                                        ? ''
                                        : field.value
                                    }
                                    onChange={e => {
                                      const val = e.target.value;
                                      field.onChange(
                                        val === '' ? undefined : parseInt(val),
                                      );
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        {/* Gender selection */}
                        <FormField
                          control={form.control}
                          name='gender'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-sm sm:text-base'>
                                Gender
                              </FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className='flex flex-row gap-4 justify-center'
                                >
                                  <div className='flex items-center gap-2'>
                                    <RadioGroupItem
                                      value='male'
                                      id='gender-male'
                                    />
                                    <FormLabel
                                      htmlFor='gender-male'
                                      className='text-sm sm:text-base'
                                    >
                                      Male
                                    </FormLabel>
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    <RadioGroupItem
                                      value='female'
                                      id='gender-female'
                                    />
                                    <FormLabel
                                      htmlFor='gender-female'
                                      className='text-sm sm:text-base'
                                    >
                                      Female
                                    </FormLabel>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Height */}
                        <div className='flex-1 flex flex-col items-center'>
                          <FormItem className='w-full'>
                            <FormLabel className='flex items-center gap-2 justify-center text-sm sm:text-base'>
                              <Ruler className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />{' '}
                              Height
                            </FormLabel>
                            <div className='flex gap-2 items-end justify-center w-full'>
                              <Input
                                type='number'
                                min={0}
                                placeholder='Feet'
                                value={
                                  heightFeet === undefined ? '' : heightFeet
                                }
                                onChange={event => {
                                  const val = event.target.value;
                                  setHeightFeet(
                                    val === '' ? undefined : parseInt(val),
                                  );
                                }}
                                className='w-full text-base sm:text-lg py-3 sm:py-4 text-center'
                                aria-label='Height (feet)'
                              />
                              <span className='self-center text-sm sm:text-base'>
                                ft
                              </span>
                              <Input
                                type='number'
                                min={0}
                                max={11}
                                placeholder='Inches'
                                value={
                                  heightInches === undefined ? '' : heightInches
                                }
                                onChange={event => {
                                  const val = event.target.value;
                                  setHeightInches(
                                    val === '' ? undefined : parseInt(val),
                                  );
                                }}
                                className='w-full text-base sm:text-lg py-3 sm:py-4 text-center'
                                aria-label='Height (inches)'
                              />
                              <span className='self-center text-sm sm:text-base'>
                                in
                              </span>
                            </div>
                          </FormItem>
                        </div>
                        {/* Weight */}
                        <div className='flex-1 flex flex-col items-center'>
                          <FormItem className='w-full'>
                            <FormLabel className='flex items-center gap-2 justify-center text-sm sm:text-base'>
                              <Weight className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />{' '}
                              Weight (lbs)
                            </FormLabel>
                            <Input
                              type='number'
                              min={0}
                              placeholder='Pounds'
                              value={weightLbs === undefined ? '' : weightLbs}
                              onChange={event => {
                                const val = event.target.value;
                                setWeightLbs(
                                  val === '' ? undefined : parseInt(val),
                                );
                              }}
                              className='w-full text-base sm:text-lg py-3 sm:py-4 text-center'
                              aria-label='Weight (lbs)'
                            />
                          </FormItem>
                        </div>
                      </div>
                    </div>
                  )}

                  {Number(currentStep) === 1 && (
                    <div className='space-y-6 sm:space-y-8 text-center'>
                      <div className='space-y-2'>
                        <Dumbbell className='h-8 w-8 sm:h-12 sm:w-12 mx-auto text-primary' />
                        <h2 className='text-xl sm:text-2xl font-bold'>
                          Activity Level
                        </h2>
                        <p className='text-muted-foreground text-sm sm:text-base'>
                          Tell us about your lifestyle and daily activity so we
                          can personalize your nutrition plan.
                        </p>
                      </div>
                      <div className='flex flex-col gap-6 sm:gap-8 max-w-2xl mx-auto'>
                        {/* Activity Level Badge Group */}
                        <FormField
                          control={form.control}
                          name='activityLevel'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='flex items-center gap-2 justify-center text-sm sm:text-base'>
                                Activity Level
                              </FormLabel>
                              <div className='flex flex-wrap gap-2 sm:gap-3 justify-center'>
                                {ACTIVITY_LEVELS.map(level => (
                                  <Button
                                    key={level.value}
                                    type='button'
                                    variant={
                                      field.value === level.value
                                        ? 'default'
                                        : 'outline'
                                    }
                                    className='py-2 px-3 sm:px-4 text-xs sm:text-sm'
                                    onClick={() => field.onChange(level.value)}
                                  >
                                    {level.label}
                                  </Button>
                                ))}
                              </div>
                              <FormDescription className='text-xs sm:text-sm'>
                                This helps us calculate your daily calorie needs
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {Number(currentStep) === 2 && (
                    <div className='space-y-6 sm:space-y-8 text-center'>
                      <div className='space-y-2'>
                        <Weight className='h-8 w-8 sm:h-12 sm:w-12 mx-auto text-primary' />
                        <h2 className='text-xl sm:text-2xl font-bold'>
                          Weight Goal
                        </h2>
                        <p className='text-muted-foreground text-sm sm:text-base'>
                          What is your current weight goal?
                        </p>
                      </div>
                      <div className='flex flex-col gap-6 sm:gap-8 max-w-2xl mx-auto'>
                        {/* Weight Goal Selection */}
                        <FormField
                          control={form.control}
                          name='goals'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='flex items-center gap-2 justify-center text-sm sm:text-base'>
                                Weight Goal
                              </FormLabel>
                              <div className='flex flex-wrap gap-2 sm:gap-3 justify-center'>
                                {WEIGHT_GOALS.map(goal => {
                                  const selected = Array.isArray(field.value)
                                    ? field.value.includes(goal)
                                    : false;
                                  return (
                                    <Button
                                      key={goal}
                                      type='button'
                                      variant={selected ? 'default' : 'outline'}
                                      className='py-2 px-3 sm:px-4 text-xs sm:text-sm'
                                      onClick={() => field.onChange([goal])}
                                    >
                                      {goal === 'lose_weight' && 'Lose Weight'}
                                      {goal === 'maintain_weight' &&
                                        'Maintain Weight'}
                                      {goal === 'gain_weight' && 'Gain Weight'}
                                    </Button>
                                  );
                                })}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Goal Weight Input (if lose/gain) */}
                        {['lose_weight', 'gain_weight'].includes(
                          (form.watch('goals') ?? [])[0],
                        ) && (
                          <FormField
                            control={form.control}
                            name='goalWeight'
                            render={({ field }) => (
                              <FormItem className='w-full'>
                                <FormLabel className='flex items-center gap-2 justify-center text-sm sm:text-base'>
                                  Goal Weight (lbs)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    min={0}
                                    placeholder='Enter your goal weight'
                                    className='w-full text-base sm:text-lg py-3 sm:py-4 text-center'
                                    {...field}
                                    value={
                                      field.value === undefined
                                        ? ''
                                        : field.value
                                    }
                                    onChange={e => {
                                      const val = e.target.value;
                                      field.onChange(
                                        val === '' ? undefined : parseInt(val),
                                      );
                                    }}
                                  />
                                </FormControl>
                                <FormDescription className='text-xs sm:text-sm'>
                                  Setting a goal weight helps us personalize
                                  your calorie and macro targets.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {Number(currentStep) === 3 && (
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

                  {Number(currentStep) === 4 && (
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

                  {Number(currentStep) === 5 && (
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

                  {Number(currentStep) === 6 && (
                    <div className='space-y-6 text-center'>
                      <div className='space-y-2'>
                        <Apple className='h-8 w-8 sm:h-12 sm:w-12 mx-auto text-primary' />
                        <h2 className='text-xl sm:text-2xl font-bold'>
                          Nutrition Targets
                        </h2>
                        <p className='text-muted-foreground text-sm sm:text-base'>
                          Set your daily calorie and macronutrient goals. We'll
                          use these to personalize your meal plans.
                        </p>
                      </div>

                      {/* Macro Split Selection - Compact Cards */}
                      <div className='w-full max-w-6xl mx-auto'>
                        <h3 className='text-base sm:text-lg font-semibold mb-4'>
                          Choose Your Macro Split
                        </h3>

                        {/* Scrollable container */}
                        <div className='relative'>
                          {/* Scrollable cards */}
                          <div className='flex gap-2 sm:gap-3 overflow-x-auto py-4 scrollbar-hide px-4'>
                            {/* Add a spacer at the end to show partial card */}
                            <div className='flex-shrink-0 w-4' />
                            {MACRO_SPLIT_OPTIONS.map((option, idx) => (
                              <Card
                                key={option.label}
                                className={`min-w-[160px] sm:min-w-[200px] cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                  selectedMacroSplit === idx
                                    ? 'border-primary shadow-lg scale-105'
                                    : 'border-border hover:border-primary/50'
                                }`}
                                onClick={() => handleMacroSplitSelect(idx)}
                                style={{ flex: '0 0 auto' }}
                              >
                                <CardHeader className='pb-2'>
                                  <CardTitle className='text-xs sm:text-sm text-center'>
                                    {option.label}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-2'>
                                  {/* Compact macro breakdown */}
                                  <div className='grid grid-cols-3 gap-1 text-xs'>
                                    <div className='text-center'>
                                      <div className='font-semibold text-green-600'>
                                        {option.split?.carbs || '—'}%
                                      </div>
                                      <div className='text-muted-foreground'>
                                        C
                                      </div>
                                    </div>
                                    <div className='text-center'>
                                      <div className='font-semibold text-red-600'>
                                        {option.split?.protein || '—'}%
                                      </div>
                                      <div className='text-muted-foreground'>
                                        P
                                      </div>
                                    </div>
                                    <div className='text-center'>
                                      <div className='font-semibold text-orange-600'>
                                        {option.split?.fat || '—'}%
                                      </div>
                                      <div className='text-muted-foreground'>
                                        F
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            {/* Add a spacer at the end to show partial card */}
                            <div className='flex-shrink-0 w-4' />
                          </div>
                        </div>
                      </div>

                      {/* Single Pie Chart with Calorie Input in Center */}
                      {selectedMacroSplit !== null && (
                        <div className='w-full max-w-4xl mx-auto'>
                          {/* Desktop: Side-by-side layout */}
                          <div className='hidden lg:flex gap-6 items-start'>
                            {/* Left: Chart */}
                            <div className='flex-shrink-0'>
                              <div className='relative'>
                                <ChartContainer
                                  config={{
                                    carbs: {
                                      label: 'Carbs',
                                      color:
                                        selectedMacroSplit !== null
                                          ? MACRO_SPLIT_OPTIONS[
                                              selectedMacroSplit
                                            ].colors[0]
                                          : '#22c55e',
                                    },
                                    protein: {
                                      label: 'Protein',
                                      color:
                                        selectedMacroSplit !== null
                                          ? MACRO_SPLIT_OPTIONS[
                                              selectedMacroSplit
                                            ].colors[1]
                                          : '#ef4444',
                                    },
                                    fat: {
                                      label: 'Fat',
                                      color:
                                        selectedMacroSplit !== null
                                          ? MACRO_SPLIT_OPTIONS[
                                              selectedMacroSplit
                                            ].colors[2]
                                          : '#f59e0b',
                                    },
                                  }}
                                  className='w-48 h-48 hover:scale-105 transition-transform duration-200 cursor-pointer'
                                >
                                  <PieChart>
                                    <ChartTooltip
                                      cursor={false}
                                      content={
                                        <ChartTooltipContent
                                          hideLabel
                                          formatter={(value, name) => (
                                            <div className='flex items-center gap-2'>
                                              <span className='text-muted-foreground'>
                                                {name}
                                              </span>
                                              <span className='font-mono font-medium text-foreground'>
                                                {value}%
                                              </span>
                                            </div>
                                          )}
                                        />
                                      }
                                    />
                                    <Pie
                                      data={(() => {
                                        if (
                                          selectedMacroSplit !== null &&
                                          selectedMacroSplit !== 7
                                        ) {
                                          const split =
                                            MACRO_SPLIT_OPTIONS[
                                              selectedMacroSplit
                                            ].split;
                                          if (split) {
                                            return [
                                              {
                                                name: 'Carbs',
                                                value: split.carbs,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[0],
                                              },
                                              {
                                                name: 'Protein',
                                                value: split.protein,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[1],
                                              },
                                              {
                                                name: 'Fat',
                                                value: split.fat,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[2],
                                              },
                                            ];
                                          }
                                        }

                                        const totalCalories =
                                          (formValues.macroProtein || 0) * 4 +
                                          (formValues.macroCarbs || 0) * 4 +
                                          (formValues.macroFat || 0) * 9;
                                        if (totalCalories === 0) return [];

                                        return [
                                          {
                                            name: 'Carbs',
                                            value: Math.round(
                                              (((formValues.macroCarbs || 0) *
                                                4) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#22c55e',
                                          },
                                          {
                                            name: 'Protein',
                                            value: Math.round(
                                              (((formValues.macroProtein || 0) *
                                                4) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#ef4444',
                                          },
                                          {
                                            name: 'Fat',
                                            value: Math.round(
                                              (((formValues.macroFat || 0) *
                                                9) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#f59e0b',
                                          },
                                        ];
                                      })()}
                                      dataKey='value'
                                      nameKey='name'
                                      innerRadius={60}
                                      outerRadius={75}
                                      strokeWidth={3}
                                      stroke='#fff'
                                    >
                                      {(() => {
                                        if (
                                          selectedMacroSplit !== null &&
                                          selectedMacroSplit !== 7
                                        ) {
                                          const split =
                                            MACRO_SPLIT_OPTIONS[
                                              selectedMacroSplit
                                            ].split;
                                          if (split) {
                                            return [
                                              {
                                                name: 'Carbs',
                                                value: split.carbs,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[0],
                                              },
                                              {
                                                name: 'Protein',
                                                value: split.protein,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[1],
                                              },
                                              {
                                                name: 'Fat',
                                                value: split.fat,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[2],
                                              },
                                            ].map((entry, index) => (
                                              <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                              />
                                            ));
                                          }
                                        }

                                        const totalCalories =
                                          (formValues.macroProtein || 0) * 4 +
                                          (formValues.macroCarbs || 0) * 4 +
                                          (formValues.macroFat || 0) * 9;
                                        if (totalCalories === 0) return [];

                                        return [
                                          {
                                            name: 'Carbs',
                                            value: Math.round(
                                              (((formValues.macroCarbs || 0) *
                                                4) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#22c55e',
                                          },
                                          {
                                            name: 'Protein',
                                            value: Math.round(
                                              (((formValues.macroProtein || 0) *
                                                4) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#ef4444',
                                          },
                                          {
                                            name: 'Fat',
                                            value: Math.round(
                                              (((formValues.macroFat || 0) *
                                                9) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#f59e0b',
                                          },
                                        ].map((entry, index) => (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                          />
                                        ));
                                      })()}
                                    </Pie>
                                  </PieChart>
                                </ChartContainer>

                                {/* Calorie Input in Center */}
                                <div className='absolute inset-0 flex items-center justify-center'>
                                  <div className='text-center'>
                                    <label className='block text-xs font-medium text-muted-foreground mb-1'>
                                      Calories
                                    </label>
                                    <Input
                                      type='number'
                                      className='text-center text-sm font-mono w-20 h-8'
                                      value={formValues.dailyCalories || ''}
                                      onChange={e =>
                                        form.setValue(
                                          'dailyCalories',
                                          parseInt(e.target.value) || undefined,
                                        )
                                      }
                                      min={0}
                                      placeholder='0'
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right: Information and Controls */}
                            <div className='flex-1 space-y-4'>
                              {/* Interactive Macro breakdown */}
                              <div className='grid grid-cols-3 gap-4'>
                                <div className='text-center p-3 border rounded-lg bg-muted/30'>
                                  <div className='text-2xl mb-1'>🍚</div>
                                  <Input
                                    type='number'
                                    className='text-center font-bold text-green-600 text-lg border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                    value={formValues.macroCarbs || ''}
                                    onChange={e => {
                                      const value = e.target.value;
                                      handleManualMacroChange(
                                        'macroCarbs',
                                        value === ''
                                          ? undefined
                                          : parseInt(value),
                                      );
                                    }}
                                    min={0}
                                    placeholder='0'
                                  />
                                  <div className='text-sm text-muted-foreground'>
                                    Carbs
                                  </div>
                                </div>
                                <div className='text-center p-3 border rounded-lg bg-muted/30'>
                                  <div className='text-2xl mb-1'>🥩</div>
                                  <Input
                                    type='number'
                                    className='text-center font-bold text-red-600 text-lg border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                    value={formValues.macroProtein || ''}
                                    onChange={e => {
                                      const value = e.target.value;
                                      handleManualMacroChange(
                                        'macroProtein',
                                        value === ''
                                          ? undefined
                                          : parseInt(value),
                                      );
                                    }}
                                    min={0}
                                    placeholder='0'
                                  />
                                  <div className='text-sm text-muted-foreground'>
                                    Protein
                                  </div>
                                </div>
                                <div className='text-center p-3 border rounded-lg bg-muted/30'>
                                  <div className='text-2xl mb-1'>🥑</div>
                                  <Input
                                    type='number'
                                    className='text-center font-bold text-orange-600 text-lg border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                    value={formValues.macroFat || ''}
                                    onChange={e => {
                                      const value = e.target.value;
                                      handleManualMacroChange(
                                        'macroFat',
                                        value === ''
                                          ? undefined
                                          : parseInt(value),
                                      );
                                    }}
                                    min={0}
                                    placeholder='0'
                                  />
                                  <div className='text-sm text-muted-foreground'>
                                    Fat
                                  </div>
                                </div>
                              </div>

                              {/* Benefits or Custom message */}
                              {selectedMacroSplit !== null &&
                                selectedMacroSplit !== 7 && (
                                  <div className='p-3 border rounded-lg bg-muted/50'>
                                    <h4 className='font-semibold text-sm mb-2'>
                                      Benefits of{' '}
                                      {
                                        MACRO_SPLIT_OPTIONS[selectedMacroSplit]
                                          .label
                                      }
                                      :
                                    </h4>
                                    <ul className='text-sm space-y-1 mb-2'>
                                      {MACRO_SPLIT_OPTIONS[
                                        selectedMacroSplit
                                      ].benefits
                                        .slice(0, 2)
                                        .map((benefit: string, i: number) => (
                                          <li
                                            key={i}
                                            className='flex items-start gap-2'
                                          >
                                            <span className='text-primary mt-1'>
                                              •
                                            </span>
                                            <span>{benefit}</span>
                                          </li>
                                        ))}
                                    </ul>
                                    <div className='text-xs text-muted-foreground'>
                                      <strong>Common for:</strong>{' '}
                                      {
                                        MACRO_SPLIT_OPTIONS[selectedMacroSplit]
                                          .commonFor
                                      }
                                    </div>
                                  </div>
                                )}

                              {selectedMacroSplit === 7 && (
                                <div className='p-3 border rounded-lg bg-blue-50 border-blue-200'>
                                  <h4 className='font-semibold text-sm mb-2 text-blue-800'>
                                    Custom Macro Split
                                  </h4>
                                  <p className='text-sm text-blue-700'>
                                    You're using a custom macro split. The chart
                                    shows the percentage breakdown of your
                                    manually entered values.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Mobile: Stacked layout */}
                          <div className='lg:hidden'>
                            <div className='flex items-center justify-center mb-4'>
                              <div className='relative'>
                                <ChartContainer
                                  config={{
                                    carbs: {
                                      label: 'Carbs',
                                      color:
                                        selectedMacroSplit !== null
                                          ? MACRO_SPLIT_OPTIONS[
                                              selectedMacroSplit
                                            ].colors[0]
                                          : '#22c55e',
                                    },
                                    protein: {
                                      label: 'Protein',
                                      color:
                                        selectedMacroSplit !== null
                                          ? MACRO_SPLIT_OPTIONS[
                                              selectedMacroSplit
                                            ].colors[1]
                                          : '#ef4444',
                                    },
                                    fat: {
                                      label: 'Fat',
                                      color:
                                        selectedMacroSplit !== null
                                          ? MACRO_SPLIT_OPTIONS[
                                              selectedMacroSplit
                                            ].colors[2]
                                          : '#f59e0b',
                                    },
                                  }}
                                  className='w-48 h-48 sm:w-64 sm:h-64 hover:scale-105 transition-transform duration-200 cursor-pointer'
                                >
                                  <PieChart>
                                    <ChartTooltip
                                      cursor={false}
                                      content={
                                        <ChartTooltipContent
                                          hideLabel
                                          formatter={(value, name) => {
                                            // Calculate grams from percentage and total calories
                                            const totalCalories =
                                              (formValues.macroProtein || 0) *
                                                4 +
                                              (formValues.macroCarbs || 0) * 4 +
                                              (formValues.macroFat || 0) * 9;
                                            let grams = 0;
                                            if (totalCalories > 0) {
                                              const percentage =
                                                typeof value === 'number'
                                                  ? value
                                                  : parseFloat(String(value));
                                              if (name === 'Fat') {
                                                grams =
                                                  ((percentage / 100) *
                                                    totalCalories) /
                                                  9;
                                              } else {
                                                grams =
                                                  ((percentage / 100) *
                                                    totalCalories) /
                                                  4;
                                              }
                                            }

                                            return (
                                              <div className='flex items-center gap-2'>
                                                <span className='text-muted-foreground'>
                                                  {name}
                                                </span>
                                                <div className='flex flex-col'>
                                                  <span className='font-mono font-medium text-foreground'>
                                                    {typeof value === 'number'
                                                      ? `${value.toFixed(1)}%`
                                                      : `${value}%`}
                                                  </span>
                                                  <span className='text-xs text-muted-foreground'>
                                                    {grams.toFixed(0)}g
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          }}
                                        />
                                      }
                                    />
                                    <Pie
                                      data={(() => {
                                        if (
                                          selectedMacroSplit !== null &&
                                          selectedMacroSplit !== 7
                                        ) {
                                          const split =
                                            MACRO_SPLIT_OPTIONS[
                                              selectedMacroSplit
                                            ].split;
                                          if (split) {
                                            return [
                                              {
                                                name: 'Carbs',
                                                value: split.carbs,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[0],
                                              },
                                              {
                                                name: 'Protein',
                                                value: split.protein,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[1],
                                              },
                                              {
                                                name: 'Fat',
                                                value: split.fat,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[2],
                                              },
                                            ];
                                          }
                                        }

                                        const totalCalories =
                                          (formValues.macroProtein || 0) * 4 +
                                          (formValues.macroCarbs || 0) * 4 +
                                          (formValues.macroFat || 0) * 9;
                                        if (totalCalories === 0) return [];

                                        return [
                                          {
                                            name: 'Carbs',
                                            value: Math.round(
                                              (((formValues.macroCarbs || 0) *
                                                4) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#22c55e',
                                          },
                                          {
                                            name: 'Protein',
                                            value: Math.round(
                                              (((formValues.macroProtein || 0) *
                                                4) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#ef4444',
                                          },
                                          {
                                            name: 'Fat',
                                            value: Math.round(
                                              (((formValues.macroFat || 0) *
                                                9) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#f59e0b',
                                          },
                                        ];
                                      })()}
                                      dataKey='value'
                                      nameKey='name'
                                      innerRadius={60}
                                      outerRadius={75}
                                      strokeWidth={3}
                                      stroke='#fff'
                                    >
                                      {(() => {
                                        if (
                                          selectedMacroSplit !== null &&
                                          selectedMacroSplit !== 7
                                        ) {
                                          const split =
                                            MACRO_SPLIT_OPTIONS[
                                              selectedMacroSplit
                                            ].split;
                                          if (split) {
                                            return [
                                              {
                                                name: 'Carbs',
                                                value: split.carbs,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[0],
                                              },
                                              {
                                                name: 'Protein',
                                                value: split.protein,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[1],
                                              },
                                              {
                                                name: 'Fat',
                                                value: split.fat,
                                                color:
                                                  MACRO_SPLIT_OPTIONS[
                                                    selectedMacroSplit
                                                  ].colors[2],
                                              },
                                            ].map((entry, index) => (
                                              <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                              />
                                            ));
                                          }
                                        }

                                        const totalCalories =
                                          (formValues.macroProtein || 0) * 4 +
                                          (formValues.macroCarbs || 0) * 4 +
                                          (formValues.macroFat || 0) * 9;
                                        if (totalCalories === 0) return [];

                                        return [
                                          {
                                            name: 'Carbs',
                                            value: Math.round(
                                              (((formValues.macroCarbs || 0) *
                                                4) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#22c55e',
                                          },
                                          {
                                            name: 'Protein',
                                            value: Math.round(
                                              (((formValues.macroProtein || 0) *
                                                4) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#ef4444',
                                          },
                                          {
                                            name: 'Fat',
                                            value: Math.round(
                                              (((formValues.macroFat || 0) *
                                                9) /
                                                totalCalories) *
                                                100,
                                            ),
                                            color: '#f59e0b',
                                          },
                                        ].map((entry, index) => (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                          />
                                        ));
                                      })()}
                                    </Pie>
                                  </PieChart>
                                </ChartContainer>

                                {/* Calorie Input in Center */}
                                <div className='absolute inset-0 flex items-center justify-center'>
                                  <div className='text-center'>
                                    <label className='block text-xs sm:text-sm font-medium text-muted-foreground mb-1'>
                                      Daily Calories
                                    </label>
                                    <Input
                                      type='number'
                                      className='text-center text-base sm:text-lg font-mono w-24 sm:w-28 h-8 sm:h-10'
                                      value={formValues.dailyCalories || ''}
                                      onChange={e =>
                                        form.setValue(
                                          'dailyCalories',
                                          parseInt(e.target.value) || undefined,
                                        )
                                      }
                                      min={0}
                                      placeholder='0'
                                    />
                                    {calculatedCalories && (
                                      <div className='text-xs text-muted-foreground mt-1'>
                                        Suggested: {calculatedCalories}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Mobile interactive macro breakdown */}
                            <div className='grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto mb-4'>
                              <div className='text-center p-3 border rounded-lg bg-muted/30'>
                                <div className='text-xl sm:text-2xl mb-1'>
                                  🥩
                                </div>
                                <Input
                                  type='number'
                                  className='text-center font-bold text-red-600 text-sm sm:text-base border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                  value={formValues.macroProtein || ''}
                                  onChange={e => {
                                    const value = e.target.value;
                                    handleManualMacroChange(
                                      'macroProtein',
                                      value === ''
                                        ? undefined
                                        : parseInt(value),
                                    );
                                  }}
                                  min={0}
                                  placeholder='0'
                                />
                                <div className='text-xs sm:text-sm text-muted-foreground'>
                                  Protein
                                </div>
                              </div>
                              <div className='text-center p-3 border rounded-lg bg-muted/30'>
                                <div className='text-xl sm:text-2xl mb-1'>
                                  🍚
                                </div>
                                <Input
                                  type='number'
                                  className='text-center font-bold text-green-600 text-sm sm:text-base border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                  value={formValues.macroCarbs || ''}
                                  onChange={e => {
                                    const value = e.target.value;
                                    handleManualMacroChange(
                                      'macroCarbs',
                                      value === ''
                                        ? undefined
                                        : parseInt(value),
                                    );
                                  }}
                                  min={0}
                                  placeholder='0'
                                />
                                <div className='text-xs sm:text-sm text-muted-foreground'>
                                  Carbs
                                </div>
                              </div>
                              <div className='text-center p-3 border rounded-lg bg-muted/30'>
                                <div className='text-xl sm:text-2xl mb-1'>
                                  🥑
                                </div>
                                <Input
                                  type='number'
                                  className='text-center font-bold text-orange-600 text-sm sm:text-base border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                  value={formValues.macroFat || ''}
                                  onChange={e => {
                                    const value = e.target.value;
                                    handleManualMacroChange(
                                      'macroFat',
                                      value === ''
                                        ? undefined
                                        : parseInt(value),
                                    );
                                  }}
                                  min={0}
                                  placeholder='0'
                                />
                                <div className='text-xs sm:text-sm text-muted-foreground'>
                                  Fat
                                </div>
                              </div>
                            </div>

                            {/* Mobile benefits or custom message */}
                            {selectedMacroSplit !== null &&
                              selectedMacroSplit !== 7 && (
                                <div className='p-3 border rounded-lg bg-muted/50 text-left'>
                                  <h4 className='font-semibold text-xs sm:text-sm mb-2'>
                                    Benefits of{' '}
                                    {
                                      MACRO_SPLIT_OPTIONS[selectedMacroSplit]
                                        .label
                                    }
                                    :
                                  </h4>
                                  <ul className='text-xs sm:text-sm space-y-1 mb-3'>
                                    {MACRO_SPLIT_OPTIONS[
                                      selectedMacroSplit
                                    ].benefits.map(
                                      (benefit: string, i: number) => (
                                        <li
                                          key={i}
                                          className='flex items-start gap-2'
                                        >
                                          <span className='text-primary mt-1'>
                                            •
                                          </span>
                                          <span>{benefit}</span>
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                  <div className='text-xs sm:text-sm text-muted-foreground'>
                                    <strong>Common for:</strong>{' '}
                                    {
                                      MACRO_SPLIT_OPTIONS[selectedMacroSplit]
                                        .commonFor
                                    }
                                  </div>
                                </div>
                              )}

                            {selectedMacroSplit === 7 && (
                              <div className='p-3 border rounded-lg bg-blue-50 border-blue-200 text-left'>
                                <h4 className='font-semibold text-xs sm:text-sm mb-2 text-blue-800'>
                                  Custom Macro Split
                                </h4>
                                <p className='text-xs sm:text-sm text-blue-700'>
                                  You're using a custom macro split. The chart
                                  above shows the percentage breakdown of your
                                  manually entered values.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {Number(currentStep) === 7 && (
                    <div className='space-y-6 sm:space-y-8 text-center'>
                      <div className='space-y-2'>
                        <h2 className='text-xl sm:text-2xl font-bold'>
                          Review Your Profile
                        </h2>
                        <p className='text-muted-foreground text-sm sm:text-base'>
                          Please review your information below. You can edit any
                          section before saving.
                        </p>
                      </div>
                      <div className='flex flex-col gap-4 sm:gap-8 max-w-2xl mx-auto text-left'>
                        {/* Physical Stats */}
                        <div className='rounded-lg border p-3 sm:p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-base sm:text-lg'>
                              Physical Stats
                            </h3>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={() => onStepChange(0)}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className='text-muted-foreground text-sm sm:text-base'>
                            {formValues.age} years old,{' '}
                            {formatHeight(formValues.height)},{' '}
                            {formValues.weight} lbs
                          </div>
                          {/* Show goal weight and explanation if applicable */}
                          {((formValues.goals ?? []).includes('lose_weight') ||
                            (formValues.goals ?? []).includes('gain_weight')) &&
                            formValues.goalWeight &&
                            formValues.goalWeight !== formValues.weight && (
                              <div className='text-xs sm:text-sm text-primary mt-2'>
                                <span>
                                  Goal weight:{' '}
                                  <b>{formValues.goalWeight} lbs</b>
                                </span>
                                <br />
                                <span>
                                  Your calorie and macro targets are based on
                                  your goal weight to help you{' '}
                                  {(formValues.goals ?? []).includes(
                                    'lose_weight',
                                  )
                                    ? 'lose'
                                    : 'gain'}{' '}
                                  weight safely.
                                </span>
                              </div>
                            )}
                        </div>
                        {/* Activity Level */}
                        <div className='rounded-lg border p-3 sm:p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-base sm:text-lg'>
                              Activity Level
                            </h3>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={() => onStepChange(1)}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {formValues.activityLevel ? (
                              <span className='badge'>
                                {getActivityLevelLabel(
                                  formValues.activityLevel,
                                )}
                              </span>
                            ) : (
                              <span className='badge'>None</span>
                            )}
                          </div>
                        </div>
                        {/* Goals */}
                        <div className='rounded-lg border p-3 sm:p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-base sm:text-lg'>
                              Goals
                            </h3>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={() => onStepChange(2)}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {Array.isArray(formValues.goals) &&
                            formValues.goals.length > 0 ? (
                              formValues.goals.map(goal => (
                                <span className='badge' key={goal}>
                                  {getGoalLabel(goal)}
                                </span>
                              ))
                            ) : (
                              <span className='badge'>None</span>
                            )}
                          </div>
                        </div>
                        {/* Allergies */}
                        <div className='rounded-lg border p-3 sm:p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-base sm:text-lg'>
                              Allergies & Intolerances
                            </h3>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={() => onStepChange(3)}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {formValues.allergies &&
                            formValues.allergies.length > 0 ? (
                              formValues.allergies.map(a => (
                                <Badge key={a} variant='destructive'>
                                  {a}
                                </Badge>
                              ))
                            ) : (
                              <Badge key='None' variant='default'>
                                None
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Dietary Preferences */}
                        <div className='rounded-lg border p-3 sm:p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-base sm:text-lg'>
                              Dietary Preferences
                            </h3>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={() => onStepChange(4)}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {Array.isArray(formValues.dietaryRestrictions) &&
                            formValues.dietaryRestrictions.length > 0 ? (
                              (formValues.dietaryRestrictions as string[]).map(
                                (d: string) => (
                                  <Badge key={d} variant='secondary'>
                                    {d}
                                  </Badge>
                                ),
                              )
                            ) : (
                              <Badge key='None' variant='default'>
                                None
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Preferred Cuisines */}
                        <div className='rounded-lg border p-3 sm:p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-base sm:text-lg'>
                              Preferred Cuisines
                            </h3>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={() => onStepChange(5)}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            {formValues.cuisinePreferences &&
                            formValues.cuisinePreferences.length > 0 ? (
                              formValues.cuisinePreferences.map(c => (
                                <Badge key={c} variant='outline'>
                                  {c}
                                </Badge>
                              ))
                            ) : (
                              <Badge key='None' variant='default'>
                                None
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Nutrition Targets */}
                        <div className='rounded-lg border p-3 sm:p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-base sm:text-lg'>
                              Nutrition Targets
                            </h3>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={() => onStepChange(6)}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className='flex flex-wrap gap-2 sm:gap-4 text-sm sm:text-base'>
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
                  onClick={() => {
                    void prevStep();
                  }}
                  disabled={currentStep === 0}
                  className='text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-3'
                >
                  Previous
                </Button>

                <div className='flex gap-2 sm:gap-3'>
                  {currentStep < steps.length - 1 ? (
                    <Button
                      type='button'
                      onClick={() => {
                        void nextStep();
                      }}
                      className='text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-3'
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type='submit'
                      disabled={isLoading}
                      className='text-base sm:text-lg px-4 sm:px-6 py-2 sm:py-3'
                    >
                      {isLoading ? 'Saving...' : 'Save Profile'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </>
      )}
    </div>
  );
}
