import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Recipe } from '@/types/recipe';
import { Heart, MoreHorizontal, ThumbsDown } from 'lucide-react';
import { useState } from 'react';

interface FeedbackButtonsProps {
  recipe: Recipe;
  onFeedback?: (
    recipeId: number,
    liked: boolean,
    feedback?: string,
  ) => void | Promise<void>;
  onRegenerate?: (recipeId: number) => void;
  onShare?: (recipeId: number) => void;
  userFeedback?: {
    liked: boolean;
    feedback?: string;
  };
}

export function FeedbackButtons({
  recipe,
  onFeedback,
  onRegenerate,
  onShare,
  userFeedback,
}: FeedbackButtonsProps) {
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleLike = async () => {
    if (!recipe.id || !onFeedback) return;

    setIsSubmittingFeedback(true);
    try {
      const result = onFeedback(recipe.id, true);
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleDislike = async () => {
    if (!recipe.id || !onFeedback) return;

    setIsSubmittingFeedback(true);
    try {
      const result = onFeedback(recipe.id, false, 'Recipe disliked');
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleRegenerate = () => {
    if (recipe.id && onRegenerate) {
      onRegenerate(recipe.id);
    }
  };

  const handleShare = () => {
    if (recipe.id && onShare) {
      onShare(recipe.id);
    }
  };

  return (
    <div className='flex items-center gap-2'>
      {/* Like/Dislike buttons */}
      <div className='flex items-center gap-1'>
        <Button
          variant={userFeedback?.liked === true ? 'default' : 'ghost'}
          size='sm'
          onClick={() => void handleLike()}
          disabled={isSubmittingFeedback}
          className='h-8 w-8 p-0'
        >
          <Heart
            className={`h-4 w-4 ${userFeedback?.liked === true ? 'fill-current' : ''}`}
          />
        </Button>
        <Button
          variant={userFeedback?.liked === false ? 'default' : 'ghost'}
          size='sm'
          onClick={() => void handleDislike()}
          disabled={isSubmittingFeedback}
          className='h-8 w-8 p-0'
        >
          <ThumbsDown
            className={`h-4 w-4 ${userFeedback?.liked === false ? 'fill-current' : ''}`}
          />
        </Button>
      </div>

      {/* More actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={handleRegenerate}>
            Regenerate Similar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            Share Recipe
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
