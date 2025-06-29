'use client';

import { CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';

interface NotificationBannerProps {
  message: string;
  variant?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
  className?: string;
}

const icons = {
  success: <CheckCircle className='h-5 w-5 text-green-600' />,
  error: <XCircle className='h-5 w-5 text-red-600' />,
  info: <Info className='h-5 w-5 text-blue-600' />,
};

const bgColors = {
  success: 'bg-green-50 dark:bg-green-950/20 border-l-green-500',
  error: 'bg-red-50 dark:bg-red-950/20 border-l-red-500',
  info: 'bg-blue-50 dark:bg-blue-950/20 border-l-blue-500',
};

export function NotificationBanner({
  message,
  variant = 'info',
  onDismiss,
  className = '',
}: NotificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Card className={`border-l-4 ${bgColors[variant]} ${className}`}>
      <CardContent className='p-4 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {icons[variant]}
          <span className='font-medium'>{message}</span>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className='p-1 h-auto text-muted-foreground hover:text-foreground'
          aria-label='Dismiss notification'
        >
          <X className='h-4 w-4' />
        </Button>
      </CardContent>
    </Card>
  );
}
