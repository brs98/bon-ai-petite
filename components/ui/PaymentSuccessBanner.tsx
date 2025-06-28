"use client";

import { useSearchParams } from 'next/navigation';
import { NotificationBanner } from './NotificationBanner';

export function PaymentSuccessBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('payment') !== 'success') return null;
  return (
    <NotificationBanner
      message='Your payment was successful! Welcome to your upgraded plan.'
      variant='success'
      className='mb-6'
    />
  );
} 