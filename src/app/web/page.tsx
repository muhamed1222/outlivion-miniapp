'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/loading';

/**
 * Web Portal Home Page
 * Временное решение: редирект на dashboard/login
 * TODO Phase 2: Создать полноценную landing page
 */
export default function WebHomePage() {
  const router = useRouter();

  useEffect(() => {
    // TODO: Проверить авторизацию через isAuthenticated()
    // Пока просто показываем заглушку
    setTimeout(() => {
      router.replace('/web/login');
    }, 1000);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-primary">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-text-primary">Outlivion VPN</h1>
        <p className="text-text-secondary">Быстрый и безопасный VPN сервис</p>
        <Loading size="lg" />
      </div>
    </div>
  );
}

