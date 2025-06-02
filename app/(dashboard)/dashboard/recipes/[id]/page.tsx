'use client';

import { RecipeDetail } from '@/components/recipes/RecipeDetail/RecipeDetail';
import { Recipe } from '@/types/recipe';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

interface RecipeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<
    | {
        liked: boolean;
        feedback?: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`/api/recipes/${resolvedParams.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch recipe');
        }

        setRecipe(data.recipe);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recipe');
      } finally {
        setLoading(false);
      }
    };

    void fetchRecipe();
  }, [resolvedParams.id]);

  const handleBack = () => {
    router.back();
  };

  const handleSave = async (recipeId: number) => {
    if (!recipe) return;

    try {
      const response = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId,
          isSaved: !recipe.isSaved,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save recipe');
      }

      setRecipe(prev => (prev ? { ...prev, isSaved: !prev.isSaved } : null));
    } catch (err) {
      console.error('Error saving recipe:', err);
      // You might want to show a toast notification here
    }
  };

  const handleFeedback = async (
    recipeId: number,
    liked: boolean,
    feedback?: string,
  ) => {
    try {
      const response = await fetch('/api/recipes/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId,
          liked,
          feedback,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setUserFeedback({ liked, feedback });
    } catch (err) {
      console.error('Error submitting feedback:', err);
      // You might want to show a toast notification here
    }
  };

  const handleRegenerate = (recipeId: number) => {
    // Navigate to recipe generation with similar parameters
    router.push(`/dashboard/recipes/generate?regenerate=${recipeId}`);
  };

  const handleShare = async (recipeId: number) => {
    if (!recipe) return;

    try {
      // Create a shareable URL
      const shareUrl = `${window.location.origin}/recipes/${recipeId}`;

      if (navigator.share) {
        await navigator.share({
          title: recipe.name,
          text:
            recipe.description || `Check out this ${recipe.mealType} recipe!`,
          url: shareUrl,
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareUrl);
        // You might want to show a toast notification here
        console.log('Recipe URL copied to clipboard');
      }
    } catch (err) {
      console.error('Error sharing recipe:', err);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
          <p className='mt-2 text-muted-foreground'>Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold mb-2'>Recipe Not Found</h2>
          <p className='text-muted-foreground mb-4'>
            {error || 'The recipe you are looking for does not exist.'}
          </p>
          <button onClick={handleBack} className='text-primary hover:underline'>
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      <RecipeDetail
        recipe={recipe}
        onBack={handleBack}
        onSave={recipeId => void handleSave(recipeId)}
        onFeedback={(recipeId, liked, feedback) =>
          void handleFeedback(recipeId, liked, feedback)
        }
        onRegenerate={handleRegenerate}
        onShare={recipeId => void handleShare(recipeId)}
        userFeedback={userFeedback}
      />
    </div>
  );
}
