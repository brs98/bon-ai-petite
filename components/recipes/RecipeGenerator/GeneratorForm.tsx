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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  COMMON_ALLERGIES,
  CUISINE_TYPES,
  DIETARY_RESTRICTIONS,
  type RecipeGenerationRequest,
} from '@/types/recipe';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChefHat, Clock, Target, Utensils } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const GeneratorFormSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  cuisinePreferences: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  targetCalories: z.string().optional(),
  targetProtein: z.string().optional(),
});

type GeneratorFormData = z.infer<typeof GeneratorFormSchema>;

interface GeneratorFormProps {
  onGenerate: (request: RecipeGenerationRequest) => void;
  isGenerating: boolean;
  hasNutritionProfile: boolean;
  onSetupProfile: () => void;
}

export function GeneratorForm({
  onGenerate,
  isGenerating,
  hasNutritionProfile,
  onSetupProfile,
}: GeneratorFormProps) {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>(
    [],
  );
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  const form = useForm<GeneratorFormData>({
    resolver: zodResolver(GeneratorFormSchema),
    defaultValues: {
      mealType: 'dinner',
      cuisinePreferences: [],
      dietaryRestrictions: [],
      allergies: [],
    },
  });

  const onSubmit = (data: GeneratorFormData) => {
    const request: RecipeGenerationRequest = {
      mealType: data.mealType,
      cuisinePreferences:
        selectedCuisines.length > 0 ? selectedCuisines : undefined,
      dietaryRestrictions:
        selectedRestrictions.length > 0 ? selectedRestrictions : undefined,
      allergies: selectedAllergies.length > 0 ? selectedAllergies : undefined,
      calories: data.targetCalories ? parseInt(data.targetCalories) : undefined,
      protein: data.targetProtein ? parseInt(data.targetProtein) : undefined,
    };
    onGenerate(request);
  };

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

  if (!hasNutritionProfile) {
    return (
      <Card className='w-full max-w-2xl mx-auto'>
        <CardHeader className='text-center'>
          <Target className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
          <CardTitle>Set Up Your Nutrition Profile</CardTitle>
          <p className='text-muted-foreground'>
            To generate personalized recipes, we need to know your nutrition
            goals and preferences.
          </p>
        </CardHeader>
        <CardContent className='text-center'>
          <Button onClick={onSetupProfile} size='lg'>
            Set Up Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='w-full max-w-4xl mx-auto space-y-6'>
      <div className='text-center space-y-2'>
        <ChefHat className='h-12 w-12 mx-auto text-primary' />
        <h1 className='text-3xl font-bold'>Generate Your Recipe</h1>
        <p className='text-muted-foreground'>
          Tell us what you're in the mood for, and we'll create a personalized
          recipe just for you.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={e => {
            e.preventDefault();
            void form.handleSubmit(onSubmit)(e);
          }}
          className='space-y-6'
        >
          {/* Meal Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Utensils className='h-5 w-5' />
                Meal Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name='mealType'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className='grid grid-cols-2 md:grid-cols-4 gap-4'
                      >
                        {(
                          ['breakfast', 'lunch', 'dinner', 'snack'] as const
                        ).map(meal => (
                          <FormItem key={meal}>
                            <FormControl>
                              <div className='flex items-center space-x-2'>
                                <RadioGroupItem value={meal} id={meal} />
                                <FormLabel
                                  htmlFor={meal}
                                  className='cursor-pointer capitalize font-medium'
                                >
                                  {meal}
                                </FormLabel>
                              </div>
                            </FormControl>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Cuisine Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Cuisine Preferences</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Select the cuisines you'd like to explore (optional)
              </p>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                {CUISINE_TYPES.map(cuisine => (
                  <Badge
                    key={cuisine}
                    variant={
                      selectedCuisines.includes(cuisine) ? 'default' : 'outline'
                    }
                    className='cursor-pointer hover:bg-accent'
                    onClick={() =>
                      toggleSelection(
                        cuisine,
                        selectedCuisines,
                        setSelectedCuisines,
                      )
                    }
                  >
                    {cuisine}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dietary Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle>Dietary Restrictions</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Select any dietary restrictions to follow (optional)
              </p>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                {DIETARY_RESTRICTIONS.map(restriction => (
                  <Badge
                    key={restriction}
                    variant={
                      selectedRestrictions.includes(restriction)
                        ? 'default'
                        : 'outline'
                    }
                    className='cursor-pointer hover:bg-accent'
                    onClick={() =>
                      toggleSelection(
                        restriction,
                        selectedRestrictions,
                        setSelectedRestrictions,
                      )
                    }
                  >
                    {restriction}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Allergies */}
          <Card>
            <CardHeader>
              <CardTitle>Allergies & Intolerances</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Select any ingredients to avoid (optional)
              </p>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                {COMMON_ALLERGIES.map(allergy => (
                  <Badge
                    key={allergy}
                    variant={
                      selectedAllergies.includes(allergy)
                        ? 'destructive'
                        : 'outline'
                    }
                    className='cursor-pointer hover:bg-accent'
                    onClick={() =>
                      toggleSelection(
                        allergy,
                        selectedAllergies,
                        setSelectedAllergies,
                      )
                    }
                  >
                    {allergy}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optional Nutrition Targets */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Target className='h-5 w-5' />
                Custom Nutrition Targets
              </CardTitle>
              <p className='text-sm text-muted-foreground'>
                Override your profile defaults for this recipe (optional)
              </p>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='targetCalories'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Calories</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Use profile default' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='300'>300 kcal</SelectItem>
                          <SelectItem value='500'>500 kcal</SelectItem>
                          <SelectItem value='700'>700 kcal</SelectItem>
                          <SelectItem value='900'>900 kcal</SelectItem>
                          <SelectItem value='1200'>1200 kcal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='targetProtein'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Protein (g)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Use profile default' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='20'>20g</SelectItem>
                          <SelectItem value='30'>30g</SelectItem>
                          <SelectItem value='40'>40g</SelectItem>
                          <SelectItem value='50'>50g</SelectItem>
                          <SelectItem value='60'>60g</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Generate Button */}
          <div className='text-center'>
            <Button
              type='submit'
              size='lg'
              disabled={isGenerating}
              className='min-w-[200px]'
            >
              {isGenerating ? (
                <>
                  <Clock className='h-4 w-4 mr-2 animate-spin' />
                  Generating Recipe...
                </>
              ) : (
                <>
                  <ChefHat className='h-4 w-4 mr-2' />
                  Generate Recipe
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
