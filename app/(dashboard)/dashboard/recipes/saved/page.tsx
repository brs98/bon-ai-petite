'use client';

import { RecipeCard } from '@/components/recipes/RecipeCard/RecipeCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Recipe } from '@/types/recipe';
import { Filter, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface SavedRecipesData {
  recipes: Recipe[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function SavedRecipesPage() {
  const router = useRouter();
  const [data, setData] = useState<SavedRecipesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSavedRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort,
      });

      if (search) params.append('search', search);
      if (mealType && mealType !== 'all') params.append('mealType', mealType);
      if (difficulty && difficulty !== 'all')
        params.append('difficulty', difficulty);

      const response = await fetch(`/api/recipes/saved?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch saved recipes');
      }

      setData(result.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch saved recipes',
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, mealType, difficulty, sort]);

  useEffect(() => {
    void fetchSavedRecipes();
  }, [fetchSavedRecipes]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [search, mealType, difficulty, sort]);

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
      setData(prev => {
        if (!prev) return prev;
        const alreadyInList = prev.recipes.some(r => r.id === recipeId);
        // If unsaving, remove from the list
        if (isCurrentlySaved) {
          return {
            ...prev,
            recipes: prev.recipes.filter(r => r.id !== recipeId),
          };
        }
        // If saving and not already in list, fetch and add to top
        if (!alreadyInList) {
          // Fetch the full recipe object and add to the top
          void fetch(`/api/recipes/${recipeId}`)
            .then(res => res.json())
            .then(data => {
              if (data.recipe) {
                setData(prev2 =>
                  prev2
                    ? {
                        ...prev2,
                        recipes: [
                          { ...data.recipe, isSaved: true },
                          ...prev2.recipes,
                        ],
                      }
                    : prev2,
                );
              }
            });
          return prev;
        }
        // Otherwise, just update isSaved property
        return {
          ...prev,
          recipes: prev.recipes.map(r =>
            r.id === recipeId ? { ...r, isSaved: true } : r,
          ),
        };
      });
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  const handleView = (recipeId: number) => {
    router.push(`/dashboard/recipes/${recipeId}`);
  };

  const clearFilters = () => {
    setSearch('');
    setMealType('all');
    setDifficulty('all');
    setSort('newest');
    setCurrentPage(1);
  };

  if (loading && !data) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
          <p className='mt-2 text-muted-foreground'>Loading saved recipes...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Error Loading Recipes</h2>
          <p className='text-muted-foreground mb-4'>{error}</p>
          <Button onClick={() => void fetchSavedRecipes()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Saved Recipes</h1>
        <p className='text-muted-foreground'>
          Your collection of saved recipes
        </p>
      </div>

      {/* Filters */}
      <div className='mb-6 space-y-4'>
        <div className='flex flex-col sm:flex-row gap-4'>
          {/* Search */}
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search recipes...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='pl-10'
            />
          </div>

          {/* Meal Type Filter */}
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder='Meal Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Meals</SelectItem>
              <SelectItem value='breakfast'>Breakfast</SelectItem>
              <SelectItem value='lunch'>Lunch</SelectItem>
              <SelectItem value='dinner'>Dinner</SelectItem>
              <SelectItem value='snack'>Snack</SelectItem>
            </SelectContent>
          </Select>

          {/* Difficulty Filter */}
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder='Difficulty' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Levels</SelectItem>
              <SelectItem value='easy'>Easy</SelectItem>
              <SelectItem value='medium'>Medium</SelectItem>
              <SelectItem value='hard'>Hard</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='newest'>Newest First</SelectItem>
              <SelectItem value='oldest'>Oldest First</SelectItem>
              <SelectItem value='name'>Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active filters and clear button */}
        {(search ||
          mealType !== 'all' ||
          difficulty !== 'all' ||
          sort !== 'newest') && (
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm text-muted-foreground'>
              Filters active
            </span>
            <Button variant='ghost' size='sm' onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      {data && (
        <>
          <div className='mb-4'>
            <p className='text-sm text-muted-foreground'>
              {data.pagination.totalCount} recipe
              {data.pagination.totalCount !== 1 ? 's' : ''} found
            </p>
          </div>

          {data.recipes.length === 0 ? (
            <div className='text-center py-12'>
              <h3 className='text-lg font-semibold mb-2'>
                No saved recipes found
              </h3>
              <p className='text-muted-foreground mb-4'>
                {search || mealType !== 'all' || difficulty !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Start saving recipes to see them here.'}
              </p>
              <Button
                onClick={() => router.push('/dashboard/recipes/generate')}
                variant='default'
                size='lg'
              >
                Generate Your First Recipe
              </Button>
            </div>
          ) : (
            <>
              {/* Recipe Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 items-stretch'>
                {data.recipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onSave={id => void handleToggleSave(id, !!recipe.isSaved)}
                    onView={handleView}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className='flex items-center justify-center gap-2'>
                  <Button
                    variant='outline'
                    onClick={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
                    disabled={!data.pagination.hasPreviousPage || loading}
                  >
                    Previous
                  </Button>

                  <span className='text-sm text-muted-foreground px-4'>
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>

                  <Button
                    variant='outline'
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!data.pagination.hasNextPage || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
