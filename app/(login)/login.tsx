'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChefHat, Loader2, Sparkles } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const plan = searchParams.get('plan');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' },
  );

  // Plan display information
  const planInfo = {
    essential: {
      name: 'Essential Plan',
      price: '$8/month',
      features: [
        'AI-Generated Meal Plans',
        'Basic Dietary Preferences',
        'Shopping List Generation',
      ],
    },
    premium: {
      name: 'Premium Plan',
      price: '$12/month',
      features: [
        'Everything in Essential',
        'Advanced Nutrition Tracking',
        'Family Meal Planning',
      ],
    },
  };

  const selectedPlan =
    plan && planInfo[plan as keyof typeof planInfo]
      ? planInfo[plan as keyof typeof planInfo]
      : null;

  return (
    <div className='min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-background to-accent/10'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='flex justify-center mb-6'>
          <Link href='/' className='flex items-center group'>
            <div className='w-12 h-12 bg-gradient-to-r from-primary to-primary/90 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200'>
              <ChefHat className='h-6 w-6 text-primary-foreground' />
            </div>
            <span className='ml-3 text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'>
              AI Petite
            </span>
          </Link>
        </div>

        <div className='text-center mb-8'>
          <h2 className='text-3xl font-bold text-foreground mb-2'>
            {mode === 'signin' ? 'Welcome back!' : 'Start your healthy journey'}
          </h2>
          <p className='text-muted-foreground'>
            {mode === 'signin'
              ? 'Sign in to access your personalized meal plans'
              : 'Create your account and get AI-powered nutrition in minutes'}
          </p>
          {mode === 'signup' && selectedPlan && (
            <div className='mt-4 p-4 bg-gradient-to-r from-primary/10 to-emerald-100/50 rounded-xl border border-primary/20'>
              <div className='flex items-center justify-center mb-2'>
                <Sparkles className='h-5 w-5 text-primary mr-2' />
                <span className='font-semibold text-primary'>
                  Selected Plan: {selectedPlan.name}
                </span>
              </div>
              <p className='text-sm text-muted-foreground mb-2'>
                {selectedPlan.price} • 7-day free trial
              </p>
              <div className='text-xs text-muted-foreground'>
                {selectedPlan.features.slice(0, 2).join(' • ')}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-card py-8 px-6 shadow-xl rounded-3xl border border-border'>
          <form className='space-y-6' action={formAction}>
            <input type='hidden' name='redirect' value={redirect || ''} />
            <input type='hidden' name='priceId' value={priceId || ''} />
            <input type='hidden' name='inviteId' value={inviteId || ''} />
            <input type='hidden' name='plan' value={plan || ''} />

            <div>
              <Label
                htmlFor='email'
                className='block text-sm font-medium text-card-foreground mb-2'
              >
                Email address
              </Label>
              <Input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                defaultValue={state.email}
                required
                maxLength={50}
                className='w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors duration-200'
                placeholder='Enter your email'
              />
            </div>

            <div>
              <Label
                htmlFor='password'
                className='block text-sm font-medium text-card-foreground mb-2'
              >
                Password
              </Label>
              <Input
                id='password'
                name='password'
                type='password'
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                className='w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors duration-200'
                placeholder={
                  mode === 'signin'
                    ? 'Enter your password'
                    : 'Create a password (min. 8 characters)'
                }
              />
            </div>

            {state?.error && (
              <div className='bg-destructive/10 border border-destructive/20 rounded-xl p-4'>
                <div className='text-destructive text-sm'>{state.error}</div>
              </div>
            )}

            <div>
              <Button
                type='submit'
                className='w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold'
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className='animate-spin mr-2 h-4 w-4' />
                    Loading...
                  </>
                ) : mode === 'signin' ? (
                  'Sign in'
                ) : (
                  <>
                    <Sparkles className='mr-2 h-4 w-4' />
                    Start Free Trial
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className='mt-6'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-border' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-4 bg-card text-muted-foreground'>
                  {mode === 'signin'
                    ? 'New to AI Petite?'
                    : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className='mt-6'>
              <Link
                href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                  redirect ? `?redirect=${redirect}` : ''
                }${priceId ? `&priceId=${priceId}` : ''}`}
                className='w-full flex justify-center py-3 px-4 border-2 border-border rounded-xl shadow-sm text-sm font-medium text-muted-foreground bg-card hover:bg-muted hover:border-ring hover:text-ring focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200'
              >
                {mode === 'signin'
                  ? 'Create your account'
                  : 'Sign in to your account'}
              </Link>
            </div>
          </div>
        </div>

        {mode === 'signup' && (
          <div className='mt-8 text-center'>
            <div className='bg-card rounded-2xl p-6 shadow-lg border border-border'>
              <div className='flex items-center justify-center space-x-6 text-sm text-muted-foreground'>
                <div className='flex items-center'>
                  <div className='w-2 h-2 bg-primary rounded-full mr-2'></div>
                  <span>7-day free trial</span>
                </div>
                <div className='flex items-center'>
                  <div className='w-2 h-2 bg-primary rounded-full mr-2'></div>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
