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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { calculateMacroProfile } from '@/lib/utils/nutrition';
import {
  ACTIVITY_LEVELS,
  FITNESS_GOALS,
  NutritionProfileSchema,
  type NutritionProfile,
} from '@/types/recipe';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Apple,
  ChefHat,
  Dumbbell,
  Info,
  Ruler,
  User,
  Weight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AllergyPreferencesStep } from '../recipes/RecipeGenerator/AllergyPreferencesStep';
import { CuisinePreferencesStep } from '../recipes/RecipeGenerator/CuisinePreferencesStep';
import { DietaryPreferencesStep } from '../recipes/RecipeGenerator/DietaryPreferencesStep';
import { MacroTracker } from './MacroTracker';

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
        gender,
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

  // Macro split selection state
  const [selectedMacroSplit, setSelectedMacroSplit] = useState<number | null>(
    null,
  );

  // Add state for showing the benefits popover
  const [showBenefitsPopover, setShowBenefitsPopover] = useState<number | null>(
    null,
  );

  // Watch form values for calories and macros
  const formValues = form.watch();

  // When a macro split is selected, update macro grams in the form
  function handleMacroSplitSelect(index: number) {
    setSelectedMacroSplit(index);
    const split = MACRO_SPLIT_OPTIONS[index].split;
    const calories = form.getValues('dailyCalories');
    if (calories) {
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

  // If user edits macro grams manually, clear the selected split
  function handleManualMacroChange(
    field: 'macroProtein' | 'macroCarbs' | 'macroFat',
    value: number | undefined,
  ) {
    setSelectedMacroSplit(null);
    form.setValue(field, value);
  }

  // If calories change and a split is selected, recalculate macro grams
  useEffect(() => {
    if (selectedMacroSplit !== null) {
      const split = MACRO_SPLIT_OPTIONS[selectedMacroSplit].split;
      const calories = form.getValues('dailyCalories');
      if (calories) {
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
    <div className='max-w-4xl mx-auto space-y-8'>
      {/* Show confirmation after save */}
      {showConfirmation ? (
        <div className='flex flex-col items-center justify-center min-h-[300px] space-y-6'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold mb-2'>Profile Saved!</h2>
            <p className='text-muted-foreground mb-4'>
              Your nutrition profile has been saved successfully.
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Button
              size='lg'
              variant='default'
              onClick={() => {
                onComplete();
                router.push('/dashboard/recipes/generate');
              }}
            >
              Generate a Recipe
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='flex items-center gap-2 border-primary text-primary'
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
                              <FormLabel>Gender</FormLabel>
                              {/* FormControl should wrap only the RadioGroup, not each item */}
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className='flex flex-row gap-4'
                                >
                                  <div className='flex items-center gap-2'>
                                    <RadioGroupItem
                                      value='male'
                                      id='gender-male'
                                    />
                                    <FormLabel htmlFor='gender-male'>
                                      Male
                                    </FormLabel>
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    <RadioGroupItem
                                      value='female'
                                      id='gender-female'
                                    />
                                    <FormLabel htmlFor='gender-female'>
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
                            <FormLabel className='flex items-center gap-2 justify-center'>
                              <Ruler className='h-5 w-5 text-muted-foreground' />{' '}
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
                                className='w-full text-lg py-4 text-center'
                                aria-label='Height (feet)'
                              />
                              <span className='self-center'>ft</span>
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
                              value={weightLbs === undefined ? '' : weightLbs}
                              onChange={event => {
                                const val = event.target.value;
                                setWeightLbs(
                                  val === '' ? undefined : parseInt(val),
                                );
                              }}
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
                        <h2 className='text-2xl font-bold'>Activity Level</h2>
                        <p className='text-muted-foreground'>
                          Tell us about your lifestyle and daily activity so we
                          can personalize your nutrition plan.
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
                      </div>
                    </div>
                  )}

                  {Number(currentStep) === 2 && (
                    <div className='space-y-8 text-center'>
                      <div className='space-y-2'>
                        <Weight className='h-12 w-12 mx-auto text-primary' />
                        <h2 className='text-2xl font-bold'>Weight Goal</h2>
                        <p className='text-muted-foreground'>
                          What is your current weight goal?
                        </p>
                      </div>
                      <div className='flex flex-col gap-8 max-w-2xl mx-auto'>
                        {/* Weight Goal Selection */}
                        <FormField
                          control={form.control}
                          name='goals'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='flex items-center gap-2 justify-center'>
                                Weight Goal
                              </FormLabel>
                              <div className='flex flex-wrap gap-3 justify-center'>
                                {WEIGHT_GOALS.map(goal => {
                                  const selected = Array.isArray(field.value)
                                    ? field.value.includes(goal)
                                    : false;
                                  return (
                                    <Button
                                      key={goal}
                                      type='button'
                                      variant={selected ? 'default' : 'outline'}
                                      className='py-2 px-4 text-sm'
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
                                <FormLabel className='flex items-center gap-2 justify-center'>
                                  Goal Weight (lbs)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type='number'
                                    min={0}
                                    placeholder='Enter your goal weight'
                                    className='w-full text-lg py-4 text-center'
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
                                <FormDescription>
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
                        <Apple className='h-12 w-12 mx-auto text-primary' />
                        <h2 className='text-2xl font-bold'>
                          Nutrition Targets
                        </h2>
                        <p className='text-muted-foreground'>
                          Set your daily calorie and macronutrient goals. We'll
                          use these to personalize your meal plans.
                        </p>
                      </div>
                      {/* Daily Calorie Target input above macro targets */}
                      <div className='w-full max-w-3xl mx-auto mb-4 flex flex-col items-center'>
                        <label
                          className='font-semibold mb-1'
                          htmlFor='dailyCalories'
                        >
                          Daily Calorie Target
                        </label>
                        <Input
                          id='dailyCalories'
                          type='number'
                          className='text-center text-lg font-mono'
                          value={formValues.dailyCalories || ''}
                          onChange={e =>
                            form.setValue(
                              'dailyCalories',
                              parseInt(e.target.value) || undefined,
                            )
                          }
                          min={0}
                          style={{ width: 120 }}
                          placeholder='Calories'
                        />
                        {calculatedCalories && (
                          <span className='text-xs text-muted-foreground mt-1'>
                            Suggested: {calculatedCalories} calories based on
                            your profile
                          </span>
                        )}
                      </div>
                      {/* Macro Split Selection - Horizontal Scrollable */}
                      <div className='flex gap-2 overflow-x-auto pb-2'>
                        {MACRO_SPLIT_OPTIONS.map((option, idx) => (
                          <Card
                            key={option.label}
                            className={`min-w-[220px] cursor-pointer transition-all ${selectedMacroSplit === idx ? 'border-primary ring-2 ring-primary' : ''}`}
                            onClick={() => handleMacroSplitSelect(idx)}
                            style={{ flex: '0 0 auto' }}
                          >
                            <CardHeader>
                              <div className='flex items-center justify-between'>
                                <CardTitle className='text-base'>
                                  {option.label}
                                </CardTitle>
                                {selectedMacroSplit === idx && (
                                  <button
                                    type='button'
                                    className='ml-2 text-muted-foreground hover:text-primary focus:outline-none'
                                    onClick={e => {
                                      e.stopPropagation();
                                      setShowBenefitsPopover(show =>
                                        show === idx ? null : idx,
                                      );
                                    }}
                                    aria-label='Show benefits'
                                  >
                                    <Info className='h-4 w-4' />
                                  </button>
                                )}
                              </div>
                              <CardDescription className='text-xs'>
                                {option.description}
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                      {/* Benefits Popover (simple implementation) */}
                      {selectedMacroSplit !== null &&
                        showBenefitsPopover === selectedMacroSplit && (
                          <div className='mt-2 p-4 border rounded bg-muted max-w-xl mx-auto text-left z-10 relative'>
                            <h3 className='font-bold mb-2'>
                              {MACRO_SPLIT_OPTIONS[selectedMacroSplit].label}{' '}
                              Benefits
                            </h3>
                            <ul>
                              {MACRO_SPLIT_OPTIONS[
                                selectedMacroSplit
                              ].benefits.map(b => (
                                <li key={b}>• {b}</li>
                              ))}
                            </ul>
                            <div className='text-xs mt-2'>
                              <strong>Common For:</strong>{' '}
                              {
                                MACRO_SPLIT_OPTIONS[selectedMacroSplit]
                                  .commonFor
                              }
                            </div>
                          </div>
                        )}
                      {/* Concise Macro Targets card-like section (no Card wrapper) */}
                      <div className='w-full max-w-3xl mx-auto mb-6 rounded-lg border shadow-sm bg-muted/50 p-6'>
                        <div className='flex flex-row justify-around gap-4 items-center'>
                          {/* Protein */}
                          <div className='flex flex-col items-center flex-1'>
                            <span className='text-2xl mb-1'>🥩</span>
                            <span className='font-bold text-pink-600 mb-1'>
                              Protein
                            </span>
                            <div className='flex items-center gap-2'>
                              <Input
                                type='number'
                                className='text-center text-lg font-mono'
                                value={formValues.macroProtein || ''}
                                onChange={e =>
                                  handleManualMacroChange(
                                    'macroProtein',
                                    parseInt(e.target.value) || undefined,
                                  )
                                }
                                min={0}
                                style={{ width: 70 }}
                              />
                              <span className='text-sm text-muted-foreground'>
                                grams
                              </span>
                            </div>
                          </div>
                          {/* Carbs */}
                          <div className='flex flex-col items-center flex-1'>
                            <span className='text-2xl mb-1'>🍚</span>
                            <span className='font-bold text-green-600 mb-1'>
                              Carbs
                            </span>
                            <div className='flex items-center gap-2'>
                              <Input
                                type='number'
                                className='text-center text-lg font-mono'
                                value={formValues.macroCarbs || ''}
                                onChange={e =>
                                  handleManualMacroChange(
                                    'macroCarbs',
                                    parseInt(e.target.value) || undefined,
                                  )
                                }
                                min={0}
                                style={{ width: 70 }}
                              />
                              <span className='text-sm text-muted-foreground'>
                                grams
                              </span>
                            </div>
                          </div>
                          {/* Fat */}
                          <div className='flex flex-col items-center flex-1'>
                            <span className='text-2xl mb-1'>🥑</span>
                            <span className='font-bold text-yellow-600 mb-1'>
                              Fat
                            </span>
                            <div className='flex items-center gap-2'>
                              <Input
                                type='number'
                                className='text-center text-lg font-mono'
                                value={formValues.macroFat || ''}
                                onChange={e =>
                                  handleManualMacroChange(
                                    'macroFat',
                                    parseInt(e.target.value) || undefined,
                                  )
                                }
                                min={0}
                                style={{ width: 70 }}
                              />
                              <span className='text-sm text-muted-foreground'>
                                grams
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* MacroTracker below the macro targets section */}
                      <div className='w-full max-w-3xl mx-auto mb-6'>
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

                  {Number(currentStep) === 7 && (
                    <div className='space-y-8 text-center'>
                      <div className='space-y-2'>
                        <h2 className='text-2xl font-bold'>
                          Review Your Profile
                        </h2>
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
                              onClick={() => onStepChange(0)}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className='text-muted-foreground'>
                            {formValues.age} years old,{' '}
                            {formatHeight(formValues.height)},{' '}
                            {formValues.weight} lbs
                          </div>
                          {/* Show goal weight and explanation if applicable */}
                          {((formValues.goals ?? []).includes('lose_weight') ||
                            (formValues.goals ?? []).includes('gain_weight')) &&
                            formValues.goalWeight &&
                            formValues.goalWeight !== formValues.weight && (
                              <div className='text-xs text-primary mt-2'>
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
                        <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-lg'>
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
                        <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-lg'>Goals</h3>
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
                        <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-lg'>
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
                        <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-lg'>
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
                        <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-lg'>
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
                        <div className='rounded-lg border p-4 space-y-2 bg-muted/50'>
                          <div className='flex justify-between items-center'>
                            <h3 className='font-semibold text-lg'>
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
                  onClick={() => {
                    void prevStep();
                  }}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>

                <div className='flex gap-2'>
                  {currentStep < steps.length - 1 ? (
                    <Button
                      type='button'
                      onClick={() => {
                        void nextStep();
                      }}
                    >
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
        </>
      )}
    </div>
  );
}
