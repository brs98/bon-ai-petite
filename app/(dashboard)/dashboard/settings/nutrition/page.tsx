'use client';

import { ProfileSetup } from '@/components/nutrition/ProfileSetup';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PaymentSuccessBanner } from '@/components/ui/PaymentSuccessBanner';
import { type NutritionProfile } from '@/types/recipe';
import { Loader2, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function formatHeight(heightIn?: number) {
  if (!heightIn) return '';
  const feet = Math.floor(heightIn / 12);
  const inches = heightIn % 12;
  return `${feet}ft ${inches}in`;
}

function capitalizeFirst(str?: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function NutritionSettingsPage() {
  const [profile, setProfile] = useState<NutritionProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const router = useRouter();

  // Fetch existing profile on mount
  useEffect(() => {
    void fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/nutrition/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setShowSetup(!data); // Show setup if no profile exists
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (
    data: Partial<NutritionProfile>,
    isFinalSave: boolean,
  ) => {
    setIsSaving(true);
    try {
      const method = profile ? 'PUT' : 'POST';
      const response = await fetch('/api/nutrition/profile', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const savedProfile = await response.json();
        if (isFinalSave) {
          setProfile(savedProfile);
          setShowSetup(false);
        }
      } else {
        const error = await response.json();
        console.error('Error saving profile:', error);
        // Optionally show a toast or error message to the user
        alert(
          error?.error ||
            'Failed to save profile. Please refresh and try again.',
        );
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please refresh and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (showSetup || !profile) {
    return (
      <div className='space-y-6'>
        <PaymentSuccessBanner />
        <div className='flex items-center gap-2'>
          <Settings className='h-6 w-6' />
          <h1 className='text-2xl font-bold'>Nutrition Profile Setup</h1>
        </div>
        <p className='text-muted-foreground'>
          Set up your nutrition profile to get personalized recipe
          recommendations.
        </p>

        <ProfileSetup
          initialData={profile || undefined}
          onSave={handleSaveProfile}
          isLoading={isSaving}
        />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <PaymentSuccessBanner />
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <User className='h-6 w-6' />
          <h1 className='text-2xl font-bold'>Nutrition Profile</h1>
        </div>
        <Button onClick={() => setShowSetup(true)}>Edit Profile</Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
            <CardDescription>Your current nutrition settings</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm font-medium'>Age</p>
                <p className='text-2xl font-bold'>{profile.age}</p>
              </div>
              <div>
                <p className='text-sm font-medium'>Height</p>
                <p className='text-2xl font-bold'>
                  {formatHeight(profile.height)}
                </p>
              </div>
              <div>
                <p className='text-sm font-medium'>Weight</p>
                <p className='text-2xl font-bold'>{profile.weight} lbs</p>
              </div>
              <div>
                <p className='text-sm font-medium'>Daily Calories</p>
                <p className='text-2xl font-bold'>{profile.dailyCalories}</p>
              </div>
            </div>

            <div className='space-y-2'>
              <p className='text-sm font-medium'>Activity Level</p>
              <Badge variant='outline'>
                {capitalizeFirst(profile.activityLevel?.replace('_', ' '))}
              </Badge>
            </div>

            <div className='space-y-2'>
              <p className='text-sm font-medium'>Primary Goal</p>
              <Badge variant='default'>
                {Array.isArray(profile.goals)
                  ? profile.goals
                      .map(g => capitalizeFirst(g.replace('_', ' ')))
                      .join(', ')
                  : ''}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Macro Targets */}
        <Card>
          <CardHeader>
            <CardTitle>Macro Targets</CardTitle>
            <CardDescription>Daily macronutrient goals</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-3 gap-4'>
              <div className='text-center'>
                <div className='flex items-center justify-center w-12 h-12 bg-secondary rounded-full mx-auto mb-2'>
                  <span className='text-secondary-foreground font-bold'>P</span>
                </div>
                <p className='text-sm text-muted-foreground'>Protein</p>
                <p className='text-xl font-bold'>{profile.macroProtein}g</p>
                <p className='text-xs text-muted-foreground'>
                  {profile.macroProtein ? profile.macroProtein * 4 : 0} kcal
                </p>
              </div>
              <div className='text-center'>
                <div className='flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2'>
                  <span className='text-green-600 font-bold'>C</span>
                </div>
                <p className='text-sm text-muted-foreground'>Carbs</p>
                <p className='text-xl font-bold'>{profile.macroCarbs}g</p>
                <p className='text-xs text-muted-foreground'>
                  {profile.macroCarbs ? profile.macroCarbs * 4 : 0} kcal
                </p>
              </div>
              <div className='text-center'>
                <div className='flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2'>
                  <span className='text-orange-600 font-bold'>F</span>
                </div>
                <p className='text-sm text-muted-foreground'>Fat</p>
                <p className='text-xl font-bold'>{profile.macroFat}g</p>
                <p className='text-xs text-muted-foreground'>
                  {profile.macroFat ? profile.macroFat * 9 : 0} kcal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dietary Preferences */}
        {(profile.allergies?.length ||
          profile.dietaryRestrictions?.length ||
          profile.cuisinePreferences?.length) && (
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Dietary Preferences</CardTitle>
              <CardDescription>
                Your food preferences and restrictions
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {
                <div>
                  <p className='text-sm font-medium mb-2'>Allergies</p>
                  <div className='flex flex-wrap gap-2'>
                    {!profile.allergies || profile.allergies?.length === 0 ? (
                      <Badge key={'None'} variant='default'>
                        None
                      </Badge>
                    ) : (
                      <>
                        {profile.allergies?.map(allergy => (
                          <Badge key={allergy} variant='destructive'>
                            {allergy}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              }

              {profile.dietaryRestrictions && (
                <div>
                  <p className='text-sm font-medium mb-2'>
                    Dietary Restrictions
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {!profile.dietaryRestrictions ||
                    profile.dietaryRestrictions.length === 0 ? (
                      <Badge key={'None'} variant='default'>
                        None
                      </Badge>
                    ) : (
                      <>
                        {profile.dietaryRestrictions.map(restriction => (
                          <Badge key={restriction} variant='secondary'>
                            {restriction}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className='text-sm font-medium mb-2'>Preferred Cuisines</p>
                <div className='flex flex-wrap gap-2'>
                  {!profile.cuisinePreferences ||
                  profile.cuisinePreferences.length === 0 ? (
                    <Badge key={'None'} variant='default'>
                      None
                    </Badge>
                  ) : (
                    <>
                      {profile.cuisinePreferences.map(cuisine => (
                        <Badge key={cuisine} variant='outline'>
                          {cuisine}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
