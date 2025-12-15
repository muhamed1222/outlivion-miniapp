'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { initTelegramWebApp, isTelegramWebApp, getTelegramInitData } from '@/lib/telegram';
import { autoLoginTelegramMiniApp, isAuthenticated } from '@/lib/auth';
import { LoadingScreen } from '@/components/ui/loading';

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initialize() {
      if (typeof window === 'undefined') return;

      try {
        // 1. Инициализация Telegram WebApp
        const webApp = initTelegramWebApp();
        
        const inTelegram = isTelegramWebApp();
        
        if (!webApp && inTelegram) {
          console.error('Failed to initialize Telegram WebApp');
          setError('Ошибка инициализации Telegram WebApp');
          setIsInitialized(true);
          setAuthChecked(true);
          return;
        }
        
        setIsInitialized(true);

        // 2. Проверка авторизации
        const alreadyAuthed = isAuthenticated();
        
        if (alreadyAuthed) {
          console.log('User already authenticated');
          setAuthChecked(true);
          return;
        }

          // 3. Попытка auto-login для Telegram пользователей
        if (inTelegram || process.env.NODE_ENV === 'development') {
          console.log('Attempting auto-login...');
          
          const initData = getTelegramInitData();
          
          // В dev режиме можем работать без initData
          if (!initData && process.env.NODE_ENV === 'production') {
            console.warn('No initData available in production');
            setError('Нет данных авторизации от Telegram');
            setAuthChecked(true);
            return;
          }

          // Добавляем таймаут для логина (10 секунд), чтобы не висело вечно
          const loginPromise = autoLoginTelegramMiniApp();
          const timeoutPromise = new Promise<{ success: boolean; error?: string }>((resolve) => {
            setTimeout(() => {
                resolve({ success: false, error: 'Timeout waiting for auto-login (possible API connection issue)' });
            }, 8000); 
          });

          const result = await Promise.race([loginPromise, timeoutPromise]);
          
          if (result.success) {
            console.log('Auto-login successful:', result.user);
            
            // Если мы на главной странице, перезагружаем для обновления данных
            if (pathname === '/telegram') {
              router.refresh();
            }
          } else {
            console.warn('Auto-login failed or timed out:', result.error);
            // Не блокируем приложение, даем пользователю войти вручную или увидеть ошибку на странице
            if (result.error?.includes('Timeout') && process.env.NODE_ENV === 'production') {
               // Если таймаут, возможно проблема с API, но мы все равно пускаем пользователя
               // Можно сохранить ошибку в стейт, чтобы показать тост
               console.error('API Connection timeout during init');
            }
          }
        }

        setAuthChecked(true);
      } catch (err: any) {
        console.error('TelegramProvider initialization error:', err);
        setError(err.message || 'Ошибка инициализации');
        setIsInitialized(true);
        setAuthChecked(true);
      }
    }

    initialize();
  }, [pathname, router]);

  if (!isInitialized || !authChecked) {
    return <LoadingScreen message="Загрузка..." />;
  }

  // Показываем ошибку только в production и если она критичная
  if (error && process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary p-4">
        <div className="max-w-md w-full bg-background-secondary rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-status-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">Ошибка инициализации</h3>
          <p className="text-text-secondary text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-main text-white rounded-lg font-medium"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

