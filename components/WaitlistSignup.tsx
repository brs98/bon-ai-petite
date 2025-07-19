'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useForm } from 'react-hook-form';
import { useWindowSize } from 'react-use';
import { z } from 'zod';

// Simplified validation schema for quick signup
const _quickSignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
});

// Full validation schema for detailed feedback
const detailedFeedbackSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  reasonForInterest: z
    .string()
    .min(10, 'Please provide a detailed reason (at least 10 characters)')
    .max(1000, 'Reason must be less than 1000 characters')
    .optional(),
  featurePriorities: z.array(z.string()).optional(),
  dietaryGoals: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  cookingExperience: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .optional(),
  householdSize: z.number().min(1).max(20).optional(),
  referralSource: z.string().max(100).optional(),
});

type QuickSignupData = z.infer<typeof _quickSignupSchema>;
type DetailedFeedbackData = z.infer<typeof detailedFeedbackSchema>;

// Predefined options
const FEATURE_PRIORITIES = [
  'Meal Planning',
  'Recipe Generation',
  'Nutrition Tracking',
  'Shopping Lists',
  'Dietary Restrictions',
  'Family Meals',
  'Quick Recipes',
  'Gourmet Cooking',
  'Budget-Friendly',
  'Health Goals',
];

const DIETARY_GOALS = [
  'lose_weight',
  'gain_muscle',
  'maintain',
  'improve_health',
  'energy_boost',
  'better_sleep',
];

const DIETARY_RESTRICTIONS = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'keto',
  'paleo',
  'low_carb',
  'low_sodium',
  'nut_free',
  'shellfish_free',
];

export function WaitlistSignup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [quickSignupComplete, setQuickSignupComplete] = useState(false);
  const [_quickSignupData, setQuickSignupData] =
    useState<QuickSignupData | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Get window dimensions for confetti
  const { width, height } = useWindowSize();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<DetailedFeedbackData>({
    resolver: zodResolver(detailedFeedbackSchema),
    defaultValues: {
      featurePriorities: [],
      dietaryGoals: [],
      dietaryRestrictions: [],
    },
    mode: 'onChange',
  });

  const watchedFeaturePriorities = watch('featurePriorities') || [];
  const watchedDietaryGoals = watch('dietaryGoals') || [];
  const watchedDietaryRestrictions = watch('dietaryRestrictions') || [];
  const watchedEmail = watch('email') || '';
  const watchedName = watch('name') || '';

  // Check if quick signup fields are valid
  const isQuickSignupValid =
    watchedEmail && watchedName && !errors.email && !errors.name;

  const onSubmit = async (data: DetailedFeedbackData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        if (!showDetailedForm) {
          // Quick signup successful, show detailed form option
          setQuickSignupComplete(true);
          setQuickSignupData({ email: data.email, name: data.name });
          setShowDetailedForm(true);
          setIsSubmitting(false);
          // Trigger confetti for quick signup too!
          setShowConfetti(true);
        } else {
          // Detailed form submitted
          setSubmitStatus('success');
          setShowConfetti(true);
          reset();
          setShowDetailedForm(false);
          setQuickSignupComplete(false);
          setQuickSignupData(null);
        }
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || 'Failed to join waitlist');
      }
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSignup = (data: DetailedFeedbackData) => {
    // For quick signup, we'll submit with minimal data
    const quickData = {
      ...data,
      reasonForInterest: 'Quick signup - will provide details later',
      featurePriorities: [],
      dietaryGoals: [],
      dietaryRestrictions: [],
    };
    void onSubmit(quickData);
  };

  const handleShowDetailedForm = () => {
    // Validate quick signup fields before showing detailed form
    if (isQuickSignupValid) {
      setShowDetailedForm(true);
    }
  };

  const handleFeaturePriorityToggle = (feature: string) => {
    const current = watchedFeaturePriorities;
    const updated = current.includes(feature)
      ? current.filter(f => f !== feature)
      : [...current, feature];
    setValue('featurePriorities', updated);
  };

  const handleDietaryGoalToggle = (goal: string) => {
    const current = watchedDietaryGoals;
    const updated = current.includes(goal)
      ? current.filter(g => g !== goal)
      : [...current, goal];
    setValue('dietaryGoals', updated);
  };

  const handleDietaryRestrictionToggle = (restriction: string) => {
    const current = watchedDietaryRestrictions;
    const updated = current.includes(restriction)
      ? current.filter(r => r !== restriction)
      : [...current, restriction];
    setValue('dietaryRestrictions', updated);
  };

  // Custom submit handler that validates based on current form state
  const handleFormSubmit = (data: DetailedFeedbackData) => {
    if (!showDetailedForm) {
      // Quick signup - only validate email and name
      handleQuickSignup(data);
    } else {
      // Detailed form - validate everything
      void onSubmit(data);
    }
  };

  useEffect(() => {
    if (submitStatus === 'success') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [submitStatus]);

  // Stop confetti after 5 seconds
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  if (submitStatus === 'success') {
    return (
      <>
        {showConfetti && (
          <Confetti
            width={width}
            height={height}
            numberOfPieces={200}
            recycle={false}
            colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']}
          />
        )}
        <Card className='w-full max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm'>
          <CardHeader className='text-center pb-6'>
            <CardTitle className='text-3xl font-bold text-primary font-cursive mb-3'>
              🎉 Welcome to the Waitlist!
            </CardTitle>
            <CardDescription className='text-lg text-gray-600 max-w-md mx-auto leading-relaxed'>
              Thank you for your interest in Bon AI Petite! We'll use your
              feedback to prioritize the features that matter most to our
              community.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <p className='text-sm text-gray-500 mb-6'>
              We'll be in touch soon with updates and early access
              opportunities.
            </p>
            <Button
              onClick={() => {
                setSubmitStatus('idle');
                setShowDetailedForm(false);
                setQuickSignupComplete(false);
                setQuickSignupData(null);
                setShowConfetti(false);
                reset();
              }}
              variant='outline'
              className='border-primary/30 text-primary hover:bg-primary/5'
            >
              Join Another Person
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={200}
          recycle={false}
          colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']}
        />
      )}
      <Card
        className='w-full max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm'
        data-waitlist-form
      >
        <CardHeader className='text-center pb-6'>
          <div className='mb-4'>
            <div className='inline-flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-primary/10 px-4 py-2 rounded-full border border-primary/20 mb-4'>
              <Sparkles className='h-4 w-4 text-primary' />
              <span className='text-primary font-medium text-sm'>
                Exclusive Access
              </span>
            </div>
          </div>
          <CardTitle className='text-3xl font-bold mb-3 font-cursive'>
            Join the <span className='text-primary'>Bon AI Petite</span>{' '}
            Waitlist
          </CardTitle>
          <CardDescription className='text-lg text-gray-600 max-w-md mx-auto leading-relaxed'>
            {!showDetailedForm
              ? 'Get early access to the future of AI-powered nutrition.'
              : 'Help us build the perfect AI-powered nutrition assistant. Your feedback will directly influence which features we develop first!'}
          </CardDescription>
        </CardHeader>
        <CardContent className='px-6 pb-8'>
          <form
            onSubmit={e => {
              void handleSubmit(handleFormSubmit)(e);
            }}
            className='space-y-8'
          >
            {/* Quick Signup Section */}
            {!showDetailedForm && (
              <div className='space-y-6'>
                <div>
                  <Label
                    htmlFor='name'
                    className='text-sm font-semibold text-gray-700 mb-2 block'
                  >
                    Name *
                  </Label>
                  <Input
                    id='name'
                    {...register('name')}
                    placeholder='Your full name'
                    className={`h-12 text-base ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary'}`}
                  />
                  {errors.name && (
                    <p className='text-sm text-red-500 mt-2'>
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='email'
                    className='text-sm font-semibold text-gray-700 mb-2 block'
                  >
                    Email Address *
                  </Label>
                  <Input
                    id='email'
                    type='email'
                    {...register('email')}
                    placeholder='your.email@example.com'
                    className={`h-12 text-base ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary'}`}
                  />
                  {errors.email && (
                    <p className='text-sm text-red-500 mt-2'>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Quick Signup Button */}
                <div className='pt-4'>
                  <Button
                    type='submit'
                    disabled={isSubmitting || !isQuickSignupValid}
                    className='w-full h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? (
                      <div className='flex items-center'>
                        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3'></div>
                        Joining Waitlist...
                      </div>
                    ) : (
                      <div className='flex items-center'>
                        <Sparkles className='mr-2 h-5 w-5' />
                        Join the Waitlist
                      </div>
                    )}
                  </Button>
                </div>

                <div className='text-center'>
                  <p className='text-xs text-gray-500 mb-4'>
                    By joining our waitlist, you'll be among the first to know
                    when Bon AI Petite launches.
                  </p>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={handleShowDetailedForm}
                    disabled={!isQuickSignupValid}
                    className={`text-sm transition-all duration-200 ${
                      isQuickSignupValid
                        ? 'text-primary hover:text-primary/80 hover:bg-primary/5'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isQuickSignupValid
                      ? 'Tell us more for priority access →'
                      : ''}
                  </Button>
                </div>
              </div>
            )}

            {/* Detailed Form Section */}
            {showDetailedForm && (
              <>
                {quickSignupComplete && (
                  <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center'>
                        <div className='w-2 h-2 bg-green-500 rounded-full mr-3'></div>
                        <p className='text-sm text-green-700 font-medium'>
                          ✅ You're on the waitlist! Help us prioritize features
                          for you.
                        </p>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          setShowDetailedForm(false);
                          setQuickSignupComplete(false);
                          setQuickSignupData(null);
                        }}
                        className='text-gray-400 hover:text-gray-600'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reason for Interest */}
                <div>
                  <Label
                    htmlFor='reasonForInterest'
                    className='text-sm font-semibold text-gray-700 mb-2 block'
                  >
                    Why are you interested in Bon AI Petite? *
                  </Label>
                  <Textarea
                    id='reasonForInterest'
                    {...register('reasonForInterest')}
                    placeholder="Tell us what you're hoping to achieve with AI-powered nutrition and meal planning..."
                    rows={4}
                    className={`text-base resize-none ${errors.reasonForInterest ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-primary'}`}
                  />
                  {errors.reasonForInterest && (
                    <p className='text-sm text-red-500 mt-2'>
                      {errors.reasonForInterest.message}
                    </p>
                  )}
                  <p className='text-xs text-gray-500 mt-2'>
                    This helps us prioritize features that will benefit you
                    most!
                  </p>
                </div>

                {/* Feature Priorities */}
                <div>
                  <Label className='text-sm font-semibold text-gray-700 mb-3 block'>
                    Which features are most important to you?
                  </Label>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {FEATURE_PRIORITIES.map(feature => (
                      <div
                        key={feature}
                        className='flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors'
                      >
                        <Checkbox
                          id={`feature-${feature}`}
                          checked={watchedFeaturePriorities.includes(feature)}
                          onCheckedChange={() =>
                            handleFeaturePriorityToggle(feature)
                          }
                          className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                        />
                        <Label
                          htmlFor={`feature-${feature}`}
                          className='text-sm font-medium cursor-pointer'
                        >
                          {feature}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dietary Goals */}
                <div>
                  <Label className='text-sm font-semibold text-gray-700 mb-3 block'>
                    What are your primary dietary goals?
                  </Label>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {DIETARY_GOALS.map(goal => (
                      <div
                        key={goal}
                        className='flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors'
                      >
                        <Checkbox
                          id={`goal-${goal}`}
                          checked={watchedDietaryGoals.includes(goal)}
                          onCheckedChange={() => handleDietaryGoalToggle(goal)}
                          className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                        />
                        <Label
                          htmlFor={`goal-${goal}`}
                          className='text-sm font-medium cursor-pointer'
                        >
                          {goal
                            .replace('_', ' ')
                            .replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div>
                  <Label className='text-sm font-semibold text-gray-700 mb-3 block'>
                    Do you have any dietary restrictions?
                  </Label>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {DIETARY_RESTRICTIONS.map(restriction => (
                      <div
                        key={restriction}
                        className='flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-primary/30 hover:bg-primary/5 transition-colors'
                      >
                        <Checkbox
                          id={`restriction-${restriction}`}
                          checked={watchedDietaryRestrictions.includes(
                            restriction,
                          )}
                          onCheckedChange={() =>
                            handleDietaryRestrictionToggle(restriction)
                          }
                          className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                        />
                        <Label
                          htmlFor={`restriction-${restriction}`}
                          className='text-sm font-medium cursor-pointer'
                        >
                          {restriction
                            .replace('_', ' ')
                            .replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Information */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                  <div>
                    <Label
                      htmlFor='cookingExperience'
                      className='text-sm font-semibold text-gray-700 mb-2 block'
                    >
                      Cooking Experience
                    </Label>
                    <Select
                      onValueChange={value =>
                        setValue(
                          'cookingExperience',
                          value as 'beginner' | 'intermediate' | 'advanced',
                        )
                      }
                    >
                      <SelectTrigger className='h-12 text-base border-gray-200 focus:border-primary'>
                        <SelectValue placeholder='Select experience level' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='beginner'>Beginner</SelectItem>
                        <SelectItem value='intermediate'>
                          Intermediate
                        </SelectItem>
                        <SelectItem value='advanced'>Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label
                      htmlFor='householdSize'
                      className='text-sm font-semibold text-gray-700 mb-2 block'
                    >
                      Household Size
                    </Label>
                    <Input
                      id='householdSize'
                      type='number'
                      min='1'
                      max='20'
                      {...register('householdSize', { valueAsNumber: true })}
                      placeholder='Number of people'
                      className='h-12 text-base border-gray-200 focus:border-primary'
                    />
                  </div>
                </div>

                {/* Error Message */}
                {submitStatus === 'error' && (
                  <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                    <p className='text-sm text-red-600 font-medium'>
                      {errorMessage}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className='pt-4'>
                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='w-full h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50'
                  >
                    {isSubmitting ? (
                      <div className='flex items-center'>
                        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3'></div>
                        Updating Preferences...
                      </div>
                    ) : (
                      <div className='flex items-center'>
                        <ArrowRight className='mr-2 h-5 w-5' />
                        Update My Preferences
                      </div>
                    )}
                  </Button>
                </div>

                <p className='text-xs text-gray-500 text-center leading-relaxed'>
                  By providing additional details, you'll get priority access
                  and help us build features that matter to you.
                </p>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </>
  );
}
