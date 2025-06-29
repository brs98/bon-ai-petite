'use client';

import { RecipeCard } from '@/components/recipes/RecipeCard/RecipeCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Recipe } from '@/types/recipe';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RecipesPage() {
  const router = useRouter();

  // State for recently generated meals
  const [recentRecipes, setRecentRecipes] = useState<Recipe[] | null>(null);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);

  // State for saved meals
  const [savedRecipes, setSavedRecipes] = useState<Recipe[] | null>(null);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState<string | null>(null);

  // Fetch recently generated (not saved) recipes
  useEffect(() => {
    setRecentLoading(true);
    fetch('/api/recipes/saved?limit=4&sort=newest&isSaved=false')
      .then(res => res.json())
      .then(data => {
        setRecentRecipes(data.data?.recipes || []);
        setRecentError(null);
      })
      .catch(err => setRecentError('Failed to load recent recipes'))
      .finally(() => setRecentLoading(false));
  }, []);

  // Fetch saved recipes
  useEffect(() => {
    setSavedLoading(true);
    fetch('/api/recipes/saved?limit=4&sort=newest&isSaved=true')
      .then(res => res.json())
      .then(data => {
        setSavedRecipes(data.data?.recipes || []);
        setSavedError(null);
      })
      .catch(err => setSavedError('Failed to load saved recipes'))
      .finally(() => setSavedLoading(false));
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-10">
      {/* Generate Recipe Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => router.push('/dashboard/recipes/generate')}
          className="gap-2"
          size="lg"
        >
          <PlusCircle className="h-5 w-5" />
          Generate Recipe
        </Button>
      </div>

      {/* Recently Generated Meals */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Generated Meals</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="text-muted-foreground py-8 text-center">Loading...</div>
          ) : recentError ? (
            <div className="text-destructive py-8 text-center">{recentError}</div>
          ) : recentRecipes && recentRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onView={id => router.push(`/dashboard/recipes/${id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">No recently generated meals found.</div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => router.push('/dashboard/recipes/generate')}>View More</Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Meals */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Meals</CardTitle>
        </CardHeader>
        <CardContent>
          {savedLoading ? (
            <div className="text-muted-foreground py-8 text-center">Loading...</div>
          ) : savedError ? (
            <div className="text-destructive py-8 text-center">{savedError}</div>
          ) : savedRecipes && savedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {savedRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onView={id => router.push(`/dashboard/recipes/${id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">No saved meals found.</div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => router.push('/dashboard/recipes/saved')}>View More</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
