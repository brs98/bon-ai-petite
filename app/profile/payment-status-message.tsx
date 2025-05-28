'use client';

import { CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentStatusMessageProps {
  paymentStatus?: string;
}

export default function PaymentStatusMessage({ paymentStatus }: PaymentStatusMessageProps) {
  if (paymentStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 p-4 mb-6">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-green-800 font-medium">
            Payment successful! Your subscription is now active.
          </p>
        </div>
      </div>
    );
  }
  
  if (paymentStatus === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 p-4 mb-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-800 font-medium">
            There was an issue processing your payment. Please contact support if this persists.
          </p>
        </div>
      </div>
    );
  }

  return null;
} 