'use client';

import { PreferencesWizard } from '@/components/recipes/RecipeGenerator/PreferencesWizard';
import { Button } from '@/components/ui/button';
import { type NutritionProfile } from '@/types/recipe';
import { ArrowLeft, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PreferencesSetupPage() {
  const router = useRouter();
  const [existingProfile, setExistingProfile] =
    useState<NutritionProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const response = await fetch('/api/nutrition/profile');
      if (response.ok) {
        const profile = await response.json();
        setExistingProfile(profile);
      } else if (response.status === 401) {
        router.push('/login');
        return;
      }
      // If 404, no existing profile - that's ok
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (preferences: Partial<NutritionProfile>) => {
    setIsSaving(true);
    try {
      // Merge with existing profile if it exists
      const profileData = existingProfile
        ? { ...existingProfile, ...preferences }
        : preferences;

      const method = existingProfile ? 'PUT' : 'POST';
      const response = await fetch('/api/nutrition/profile', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        // Redirect to recipe generation page
        router.push('/dashboard/recipes/generate');
      } else {
        let errorMessage = 'Unknown error occurred';
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error || errorData.message || JSON.stringify(errorData);

          // Log validation details if available
          if (errorData.details) {
            console.error('Validation errors:', errorData.details);
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('Error saving preferences:', errorMessage);

        // TODO: Add toast notification here for user feedback
        alert(`Failed to save preferences: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving preferences:', errorMessage);
      alert(`Failed to save preferences: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepChange = async (preferences: Partial<NutritionProfile>) => {
    try {
      const profileData = existingProfile
        ? { ...existingProfile, ...preferences }
        : preferences;
      const method = existingProfile ? 'PUT' : 'POST';
      await fetch('/api/nutrition/profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      // No redirect, no error handling, silent
    } catch {
      // Silently ignore errors
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='text-muted-foreground'>Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push('/dashboard/recipes/generate')}
            className='gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to Generator
          </Button>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => router.push('/dashboard/settings/nutrition')}
          className='gap-2'
        >
          <Settings className='h-4 w-4' />
          Full Profile Settings
        </Button>
      </div>

      {/* Title */}
      <div className='text-center space-y-4'>
        <h1 className='text-3xl font-bold'>Recipe Preferences Setup</h1>
        <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
          Let's personalize your recipe experience. This will help us suggest
          recipes that match your taste and dietary needs.
        </p>
      </div>

      {/* Preferences Wizard */}
      <PreferencesWizard
        onComplete={preferences => {
          void handleComplete(preferences);
        }}
        isLoading={isSaving}
        initialData={existingProfile || undefined}
        onStepChange={preferences => {
          void handleStepChange(preferences);
        }} // ensure void return
      />
    </div>
  );
}
