'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
}

export function Loading({ size = 'md', className, fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-primary-main border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background-primary z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background-primary z-50 gap-4">
      <Loading size="lg" />
      {message && <p className="text-text-secondary text-sm">{message}</p>}
    </div>
  );
}

