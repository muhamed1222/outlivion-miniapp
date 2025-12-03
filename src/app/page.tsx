'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/loading';
import { detectEnvironment } from '@/lib/utils/environment';

/**
 * Root page - автоматический редирект в зависимости от среды
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const env = detectEnvironment();
    
    // Редирект в соответствующую среду
    if (env === 'telegram') {
      router.replace('/telegram');
    } else {
      router.replace('/web');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary">
      <Loading size="lg" />
      <p className="mt-4 text-text-secondary">Перенаправление...</p>
    </div>
  );
}

