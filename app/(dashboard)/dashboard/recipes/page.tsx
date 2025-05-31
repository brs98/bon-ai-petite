import { NutritionProfileBanner } from '@/components/nutrition/NutritionProfileBanner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BookOpen,
  ChefHat,
  Clock,
  Plus,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import Link from 'next/link';

export default function RecipesPage() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-foreground'>Recipe Hub</h1>
              <p className='text-muted-foreground mt-2'>
                Generate personalized recipes, save your favorites, and plan
                your meals
              </p>
            </div>
            <Button asChild size='lg' className='hidden sm:flex'>
              <Link href='/dashboard/recipes/generate'>
                <Plus className='h-5 w-5 mr-2' />
                Generate Recipe
              </Link>
            </Button>
          </div>
        </div>

        {/* Nutrition Profile Banner */}
        <div className='mb-8'>
          <NutritionProfileBanner />
        </div>

        {/* Quick Actions Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {/* Generate Recipe Card */}
          <Card className='hover:shadow-lg transition-shadow duration-200 cursor-pointer'>
            <Link href='/dashboard/recipes/generate'>
              <CardHeader className='pb-3'>
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-primary/10 rounded-lg'>
                    <ChefHat className='h-6 w-6 text-primary' />
                  </div>
                  <CardTitle className='text-lg'>Generate Recipe</CardTitle>
                </div>
                <CardDescription>
                  Create AI-powered recipes tailored to your nutrition goals and
                  preferences
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          {/* Nutrition Profile Card */}
          <Card className='hover:shadow-lg transition-shadow duration-200 cursor-pointer'>
            <Link href='/settings/nutrition'>
              <CardHeader className='pb-3'>
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-green-100 dark:bg-green-900/20 rounded-lg'>
                    <Utensils className='h-6 w-6 text-green-600 dark:text-green-400' />
                  </div>
                  <CardTitle className='text-lg'>Nutrition Profile</CardTitle>
                </div>
                <CardDescription>
                  Set your dietary goals, restrictions, and preferences for
                  personalized recipes
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>

          {/* Saved Recipes Card */}
          <Card className='hover:shadow-lg transition-shadow duration-200 cursor-pointer'>
            <Link href='/dashboard/recipes/saved'>
              <CardHeader className='pb-3'>
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-secondary/10 rounded-lg'>
                    <BookOpen className='h-6 w-6 text-secondary-foreground' />
                  </div>
                  <CardTitle className='text-lg'>Saved Recipes</CardTitle>
                </div>
                <CardDescription>
                  Browse and manage your collection of saved recipes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant='outline' className='w-full'>
                  View Collection
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Meal Planning Card */}
          <Card className='hover:shadow-lg transition-shadow duration-200 cursor-pointer'>
            <Link href='/dashboard/recipes/meal-planning'>
              <CardHeader className='pb-3'>
                <div className='flex items-center space-x-3'>
                  <div className='p-2 bg-accent/10 rounded-lg'>
                    <Clock className='h-6 w-6 text-accent-foreground' />
                  </div>
                  <div>
                    <CardTitle className='text-lg'>Meal Planning</CardTitle>
                    <div className='bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-xs font-semibold'>
                      PREMIUM
                    </div>
                  </div>
                </div>
                <CardDescription>
                  Plan your weekly meals and generate shopping lists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant='outline' className='w-full'>
                  Plan Meals
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Recent Activity / Stats Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Recent Recipes */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5' />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your latest recipe generations and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='text-center py-8 text-muted-foreground'>
                  <ChefHat className='h-12 w-12 mx-auto mb-3 opacity-50' />
                  <p>No recent activity</p>
                  <p className='text-sm'>
                    Generate your first recipe to get started!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Recipe Stats</CardTitle>
              <CardDescription>
                Track your recipe generation and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4'>
                <div className='text-center p-4 bg-primary/5 rounded-lg'>
                  <div className='text-2xl font-bold text-primary'>0</div>
                  <div className='text-sm text-muted-foreground'>
                    Recipes Generated
                  </div>
                </div>
                <div className='text-center p-4 bg-secondary/5 rounded-lg'>
                  <div className='text-2xl font-bold text-secondary-foreground'>
                    0
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Recipes Saved
                  </div>
                </div>
                <div className='text-center p-4 bg-accent/5 rounded-lg'>
                  <div className='text-2xl font-bold text-accent-foreground'>
                    3
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Daily Limit
                  </div>
                </div>
                <div className='text-center p-4 bg-muted/50 rounded-lg'>
                  <div className='text-2xl font-bold text-muted-foreground'>
                    3
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Remaining Today
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Generate Button */}
        <div className='fixed bottom-6 right-6 sm:hidden'>
          <Button asChild size='lg' className='rounded-full shadow-lg'>
            <Link href='/dashboard/recipes/generate'>
              <Plus className='h-6 w-6' />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
