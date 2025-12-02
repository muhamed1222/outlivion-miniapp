'use client';

import { useEffect, useState } from 'react';
import { initTelegramWebApp, isTelegramWebApp } from '@/lib/telegram';
import { LoadingScreen } from '@/components/ui/loading';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Инициализация Telegram WebApp
    if (typeof window !== 'undefined') {
      const webApp = initTelegramWebApp();
      
      if (webApp || !isTelegramWebApp()) {
        // Если WebApp инициализирован или мы не в Telegram (dev режим)
        setIsInitialized(true);
      } else {
        // Если не удалось инициализировать и мы в Telegram - показываем ошибку
        console.error('Failed to initialize Telegram WebApp');
        setIsInitialized(true); // Всё равно показываем контент
      }
    }
  }, []);

  if (!isInitialized) {
    return <LoadingScreen message="Загрузка..." />;
  }

  return <>{children}</>;
}

