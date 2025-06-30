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

  // State for saved meals
  const [savedRecipes, setSavedRecipes] = useState<Recipe[] | null>(null);
  const [savedLoading, setSavedLoading] = useState(true);

  // Fetch recently generated (not saved) recipes
  useEffect(() => {
    setRecentLoading(true);
    // Fetch recipes with isSaved=false (recently generated, not saved)
    void fetch('/api/recipes/saved?limit=4&sort=newest&isSaved=false')
      .then(res => res.json())
      .then(data => {
        setRecentRecipes(data.data?.recipes || []);
        // Optionally store the raw API response for debug UI
        // setRecentRawResponse(data);
      })
      .finally(() => setRecentLoading(false));
  }, []);

  // Fetch saved recipes
  useEffect(() => {
    setSavedLoading(true);
    void fetch('/api/recipes/saved?limit=4&sort=newest&isSaved=true')
      .then(res => res.json())
      .then(data => {
        setSavedRecipes(data.data?.recipes || []);
      })
      .finally(() => setSavedLoading(false));
  }, []);

  // Add this function to handle saving/unsaving and refreshing saved recipes
  const handleToggleSave = async (
    recipeId: number,
    isCurrentlySaved: boolean,
  ) => {
    try {
      await fetch('/api/recipes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, isSaved: !isCurrentlySaved }),
      });
      // Optimistically update local state for recentRecipes
      setRecentRecipes(
        prev =>
          prev?.map(r =>
            r.id === recipeId ? { ...r, isSaved: !isCurrentlySaved } : r,
          ) || null,
      );
      setSavedRecipes(prev => {
        if (!prev) return prev;
        const alreadyInList = prev.some(r => r.id === recipeId);
        // If unsaving, remove from savedRecipes
        if (isCurrentlySaved) {
          return prev.filter(r => r.id !== recipeId);
        }
        // If saving and not already in list, add from recentRecipes if available
        if (!alreadyInList) {
          const recipeToAdd = recentRecipes?.find(r => r.id === recipeId);
          if (recipeToAdd) {
            return [{ ...recipeToAdd, isSaved: true }, ...prev];
          }
        }
        // Otherwise, just update isSaved property
        return prev.map(r => (r.id === recipeId ? { ...r, isSaved: true } : r));
      });
    } catch (err) {
      // Optionally show a toast or error
      console.error('Error toggling save:', err);
    }
  };

  return (
    <div className='container mx-auto py-6 space-y-10'>
      {/* Generate Recipe Button */}
      <div className='flex justify-end'>
        <Button
          onClick={() => router.push('/dashboard/recipes/generate')}
          className='gap-2'
          size='lg'
        >
          <PlusCircle className='h-5 w-5' />
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
            <div className='text-muted-foreground py-8 text-center'>
              Loading...
            </div>
          ) : recentRecipes && recentRecipes.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch'>
              {recentRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onView={id => router.push(`/dashboard/recipes/${id}`)}
                  onSave={id => void handleToggleSave(id, !!recipe.isSaved)}
                />
              ))}
            </div>
          ) : (
            <div className='text-muted-foreground py-8 text-center'>
              No recently generated meals found.
              <br />
              <Button
                className='mt-4'
                onClick={() => router.push('/dashboard/recipes/generate')}
                variant='default'
                size='lg'
              >
                Generate Your First Recipe
              </Button>
            </div>
          )}
          <div className='flex justify-end mt-4'>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/recipes/generate')}
            >
              View More
            </Button>
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
            <div className='text-muted-foreground py-8 text-center'>
              Loading...
            </div>
          ) : savedRecipes && savedRecipes.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch'>
              {savedRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onView={id => router.push(`/dashboard/recipes/${id}`)}
                  onSave={id => void handleToggleSave(id, !!recipe.isSaved)}
                />
              ))}
            </div>
          ) : (
            <div className='text-muted-foreground py-8 text-center'>
              No saved meals found.
              <br />
              <Button
                className='mt-4'
                onClick={() => router.push('/dashboard/recipes/generate')}
                variant='default'
                size='lg'
              >
                Generate Your First Recipe
              </Button>
            </div>
          )}
          <div className='flex justify-end mt-4'>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/recipes/saved')}
            >
              View More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
