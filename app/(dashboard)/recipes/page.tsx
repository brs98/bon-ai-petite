'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, PlusCircle, Settings, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RecipesPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Recipe Generator</h1>
          <p className="text-muted-foreground">
            Create personalized recipes tailored to your nutrition goals and preferences
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/settings/nutrition')}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Nutrition Settings
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/dashboard/recipes/generate')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Generate Recipe
            </CardTitle>
            <CardDescription>
              Create a new personalized recipe based on your preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2">
              <PlusCircle className="h-4 w-4" />
              Start Generating
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/dashboard/recipes/saved')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Saved Recipes
            </CardTitle>
            <CardDescription>
              View and manage your collection of saved recipes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Saved Recipes
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => router.push('/dashboard/recipes/generate/preferences')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Recipe Preferences
            </CardTitle>
            <CardDescription>
              Set up your dietary preferences and cooking style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Setup Preferences
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            New to AI recipe generation? Here's how to get the best results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h3 className="font-medium">Set Up Your Profile</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Tell us about your nutrition goals, dietary restrictions, and preferences
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h3 className="font-medium">Generate Your First Recipe</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Choose a meal type and let our AI create a personalized recipe for you
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <h3 className="font-medium">Save & Cook</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Save recipes you love and follow the step-by-step instructions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 