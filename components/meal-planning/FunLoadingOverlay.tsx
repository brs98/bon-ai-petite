import { useEffect, useState } from 'react';

// Default fun, food-themed messages
const DEFAULT_MESSAGES = [
  'Whisking up your meal plan magic... 🥄',
  'Chopping veggies and ideas... 🥕',
  'Simmering some delicious recipes... 🍲',
  'Tossing salads and inspiration... 🥗',
  'Preheating the AI oven... 🔥',
  'Plating your weekly feast... 🍽️',
  'Mixing flavors and nutrients... 🧂',
  'Almost ready to serve! 🍴',
];

interface FunLoadingOverlayProps {
  messages?: string[];
  emoji?: string; // Optionally override the main emoji
}

/**
 * Full-page fun loading overlay for meal plan generation.
 * Cycles through playful messages while loading.
 */
export function FunLoadingOverlay({
  messages = DEFAULT_MESSAGES,
  emoji = '👩‍🍳',
}: FunLoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6">
        <div className="text-7xl animate-bounce drop-shadow-lg">{emoji}</div>
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">AI</span>
          </div>
        </div>
        <div className="text-xl font-semibold text-center text-muted-foreground min-h-[2.5em] transition-all duration-500">
          {messages[messageIndex]}
        </div>
        <div className="text-sm text-muted-foreground opacity-70 mt-2">
          This usually takes a few moments. Thank you for your patience!
        </div>
      </div>
    </div>
  );
} 