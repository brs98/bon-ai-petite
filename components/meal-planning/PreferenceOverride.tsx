'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  COMMON_ALLERGIES,
  CUISINE_TYPES,
  DIETARY_RESTRICTIONS,
  NutritionProfile,
} from '@/types/recipe';
import {
  AlertCircle,
  Clock,
  Globe,
  RotateCcw,
  Save,
  Settings,
  Target,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface PreferenceOverrides {
  allergies?: string[];
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
  maxPrepTime?: number;
  maxCookTime?: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

interface PreferenceOverrideProps {
  userProfile?: NutritionProfile;
  globalPreferences?: PreferenceOverrides;
  currentPreferences?: PreferenceOverrides;
  mealCategory?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealTitle?: string;
  onSave: (preferences: PreferenceOverrides) => void;
  onReset: () => void;
  onCancel: () => void;
  isGlobalOverride?: boolean;
  disabled?: boolean;
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy (30 min or less)', icon: '🟢' },
  { value: 'medium', label: 'Medium (30-60 min)', icon: '🟡' },
  { value: 'hard', label: 'Advanced (60+ min)', icon: '🔴' },
] as const;

const MEAL_CALORIE_SUGGESTIONS = {
  breakfast: { min: 300, max: 600, default: 450 },
  lunch: { min: 400, max: 800, default: 600 },
  dinner: { min: 500, max: 900, default: 700 },
  snack: { min: 100, max: 300, default: 200 },
} as const;

export function PreferenceOverride({
  userProfile,
  globalPreferences,
  currentPreferences,
  mealCategory,
  mealTitle,
  onSave,
  onReset: _onReset,
  onCancel,
  isGlobalOverride = false,
  disabled = false,
}: PreferenceOverrideProps) {
  const [preferences, setPreferences] = useState<PreferenceOverrides>(
    currentPreferences || {},
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const hasChanges =
      JSON.stringify(preferences) !== JSON.stringify(currentPreferences || {});
    setHasChanges(hasChanges);
  }, [preferences, currentPreferences]);

  // Get default values from user profile or global preferences
  const getDefaultValues = () => {
    if (isGlobalOverride) {
      return {
        allergies: userProfile?.allergies || [],
        dietaryRestrictions: userProfile?.dietaryRestrictions || [],
        cuisinePreferences: userProfile?.cuisinePreferences || [],
        maxPrepTime: 30,
        maxCookTime: 45,
        difficultyLevel: 'medium' as const,
        targetCalories: mealCategory
          ? MEAL_CALORIE_SUGGESTIONS[mealCategory].default
          : undefined,
      };
    } else {
      return globalPreferences || {};
    }
  };

  const defaultValues = getDefaultValues();

  const handleArrayChange = (
    field: 'allergies' | 'dietaryRestrictions' | 'cuisinePreferences',
    value: string,
    checked: boolean,
  ) => {
    setPreferences(prev => {
      const currentArray = prev[field] || [];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentArray, value],
        };
      } else {
        return {
          ...prev,
          [field]: currentArray.filter(item => item !== value),
        };
      }
    });
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    setPreferences(prev => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(preferences);
  };

  const handleResetToDefaults = () => {
    setPreferences(defaultValues);
  };

  const isValueDefault = (field: keyof PreferenceOverrides, value: unknown) => {
    const defaultValue = defaultValues[field];
    if (Array.isArray(value) && Array.isArray(defaultValue)) {
      return (
        JSON.stringify([...value].sort()) ===
        JSON.stringify([...defaultValue].sort())
      );
    }
    return value === defaultValue;
  };

  return (
    <Card className='w-full max-w-4xl'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            {isGlobalOverride ? (
              <Globe className='h-5 w-5 text-secondary-foreground' />
            ) : (
              <User className='h-5 w-5 text-primary' />
            )}
            <div>
              <CardTitle className='text-lg'>
                {isGlobalOverride
                  ? 'Global Preferences'
                  : 'Custom Meal Preferences'}
              </CardTitle>
              <p className='text-sm text-muted-foreground'>
                {isGlobalOverride
                  ? 'Apply these preferences to all meals in this category'
                  : `Custom preferences for ${mealTitle || mealCategory}`}
              </p>
            </div>
          </div>

          <Badge
            variant={isGlobalOverride ? 'default' : 'secondary'}
            className='flex items-center gap-1'
          >
            {isGlobalOverride ? (
              <Globe className='h-3 w-3' />
            ) : (
              <User className='h-3 w-3' />
            )}
            {isGlobalOverride ? 'Global' : 'Individual'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Dietary Restrictions */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Settings className='h-4 w-4 text-muted-foreground' />
            <Label className='text-sm font-medium'>Dietary Restrictions</Label>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {DIETARY_RESTRICTIONS.map(restriction => (
              <div key={restriction} className='flex items-center space-x-2'>
                <Checkbox
                  id={`dietary-${restriction}`}
                  checked={
                    preferences.dietaryRestrictions?.includes(restriction) ||
                    false
                  }
                  onCheckedChange={checked =>
                    handleArrayChange(
                      'dietaryRestrictions',
                      restriction,
                      !!checked,
                    )
                  }
                  disabled={disabled}
                />
                <Label
                  htmlFor={`dietary-${restriction}`}
                  className={cn(
                    'text-sm cursor-pointer',
                    isValueDefault(
                      'dietaryRestrictions',
                      preferences.dietaryRestrictions,
                    ) && 'text-muted-foreground',
                  )}
                >
                  {restriction}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Allergies */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <AlertCircle className='h-4 w-4 text-red-500' />
            <Label className='text-sm font-medium'>
              Allergies & Intolerances
            </Label>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {COMMON_ALLERGIES.map(allergy => (
              <div key={allergy} className='flex items-center space-x-2'>
                <Checkbox
                  id={`allergy-${allergy}`}
                  checked={preferences.allergies?.includes(allergy) || false}
                  onCheckedChange={checked =>
                    handleArrayChange('allergies', allergy, !!checked)
                  }
                  disabled={disabled}
                />
                <Label
                  htmlFor={`allergy-${allergy}`}
                  className={cn(
                    'text-sm cursor-pointer',
                    isValueDefault('allergies', preferences.allergies) &&
                      'text-muted-foreground',
                  )}
                >
                  {allergy}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Cuisine Preferences */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Globe className='h-4 w-4 text-muted-foreground' />
            <Label className='text-sm font-medium'>Preferred Cuisines</Label>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {CUISINE_TYPES.map(cuisine => (
              <div key={cuisine} className='flex items-center space-x-2'>
                <Checkbox
                  id={`cuisine-${cuisine}`}
                  checked={
                    preferences.cuisinePreferences?.includes(cuisine) || false
                  }
                  onCheckedChange={checked =>
                    handleArrayChange('cuisinePreferences', cuisine, !!checked)
                  }
                  disabled={disabled}
                />
                <Label
                  htmlFor={`cuisine-${cuisine}`}
                  className={cn(
                    'text-sm cursor-pointer',
                    isValueDefault(
                      'cuisinePreferences',
                      preferences.cuisinePreferences,
                    ) && 'text-muted-foreground',
                  )}
                >
                  {cuisine}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Cooking Constraints */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-muted-foreground' />
            <Label className='text-sm font-medium'>Cooking Constraints</Label>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Prep Time */}
            <div className='space-y-2'>
              <Label htmlFor='prep-time' className='text-sm'>
                Max Prep Time (minutes)
              </Label>
              <Input
                id='prep-time'
                type='number'
                min='5'
                max='120'
                step='5'
                value={
                  preferences.maxPrepTime === undefined ||
                  preferences.maxPrepTime === 0
                    ? ''
                    : preferences.maxPrepTime
                }
                onChange={e =>
                  handleNumberChange('maxPrepTime', e.target.value)
                }
                placeholder='30'
                disabled={disabled}
              />
            </div>

            {/* Cook Time */}
            <div className='space-y-2'>
              <Label htmlFor='cook-time' className='text-sm'>
                Max Cook Time (minutes)
              </Label>
              <Input
                id='cook-time'
                type='number'
                min='5'
                max='180'
                step='5'
                value={
                  preferences.maxCookTime === undefined ||
                  preferences.maxCookTime === 0
                    ? ''
                    : preferences.maxCookTime
                }
                onChange={e =>
                  handleNumberChange('maxCookTime', e.target.value)
                }
                placeholder='45'
                disabled={disabled}
              />
            </div>

            {/* Difficulty */}
            <div className='space-y-2'>
              <Label htmlFor='difficulty' className='text-sm'>
                Difficulty Level
              </Label>
              <Select
                value={preferences.difficultyLevel || ''}
                onValueChange={value =>
                  handleSelectChange('difficultyLevel', value)
                }
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select difficulty' />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className='flex items-center gap-2'>
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Nutrition Targets (for individual meals) */}
        {!isGlobalOverride && mealCategory && (
          <>
            <Separator />
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Target className='h-4 w-4 text-muted-foreground' />
                <Label className='text-sm font-medium'>
                  Nutrition Targets (Optional)
                </Label>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='target-calories' className='text-sm'>
                    Calories
                  </Label>
                  <Input
                    id='target-calories'
                    type='number'
                    min={MEAL_CALORIE_SUGGESTIONS[mealCategory].min}
                    max={MEAL_CALORIE_SUGGESTIONS[mealCategory].max}
                    step='25'
                    value={
                      preferences.targetCalories === undefined ||
                      preferences.targetCalories === 0
                        ? ''
                        : preferences.targetCalories
                    }
                    onChange={e =>
                      handleNumberChange('targetCalories', e.target.value)
                    }
                    placeholder={MEAL_CALORIE_SUGGESTIONS[
                      mealCategory
                    ].default.toString()}
                    disabled={disabled}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='target-protein' className='text-sm'>
                    Protein (g)
                  </Label>
                  <Input
                    id='target-protein'
                    type='number'
                    min='5'
                    max='100'
                    step='5'
                    value={
                      preferences.targetProtein === undefined ||
                      preferences.targetProtein === 0
                        ? ''
                        : preferences.targetProtein
                    }
                    onChange={e =>
                      handleNumberChange('targetProtein', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='target-carbs' className='text-sm'>
                    Carbs (g)
                  </Label>
                  <Input
                    id='target-carbs'
                    type='number'
                    min='10'
                    max='150'
                    step='5'
                    value={
                      preferences.targetCarbs === undefined ||
                      preferences.targetCarbs === 0
                        ? ''
                        : preferences.targetCarbs
                    }
                    onChange={e =>
                      handleNumberChange('targetCarbs', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='target-fat' className='text-sm'>
                    Fat (g)
                  </Label>
                  <Input
                    id='target-fat'
                    type='number'
                    min='5'
                    max='80'
                    step='5'
                    value={
                      preferences.targetFat === undefined ||
                      preferences.targetFat === 0
                        ? ''
                        : preferences.targetFat
                    }
                    onChange={e =>
                      handleNumberChange('targetFat', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className='flex items-center justify-between pt-4'>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleResetToDefaults}
              disabled={disabled}
              className='flex items-center gap-2'
            >
              <RotateCcw className='h-4 w-4' />
              Reset to Defaults
            </Button>

            {hasChanges && (
              <Badge variant='outline' className='text-xs'>
                Unsaved changes
              </Badge>
            )}
          </div>

          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={onCancel} disabled={disabled}>
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={disabled || !hasChanges}
              className='flex items-center gap-2'
            >
              <Save className='h-4 w-4' />
              Save Preferences
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
