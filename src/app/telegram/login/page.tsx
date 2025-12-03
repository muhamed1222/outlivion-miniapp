'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { autoLoginTelegramMiniApp, isAuthenticated } from '@/lib/auth';
import { Loading } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TelegramLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    attemptLogin();
  }, []);

  const attemptLogin = async () => {
    setLoading(true);
    setError(null);

    // Check if already authenticated
    if (isAuthenticated()) {
      router.replace('/telegram');
      return;
    }

    // Try auto-login with initData
    const result = await autoLoginTelegramMiniApp();

    if (result.success) {
      // Success - redirect to home
      router.replace('/telegram');
    } else {
      // Failed - show error
      setError(result.error || 'Не удалось авторизоваться');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    attemptLogin().finally(() => setRetrying(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-primary p-4">
        <div className="text-center space-y-4">
          <Loading size="lg" />
          <h2 className="text-xl font-bold text-text-primary">
            Авторизация...
          </h2>
          <p className="text-text-secondary">
            Подключаемся к Telegram
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-primary p-4">
      <div className="max-w-[448px] w-full space-y-4">
        {/* Error Card */}
        <Card className="p-6 border-status-error/30 bg-status-error/5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-status-error/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-status-error mb-1">
                Ошибка авторизации
              </h3>
              <p className="text-text-secondary text-sm">
                {error}
              </p>
            </div>
          </div>

          <Button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full"
            size="lg"
          >
            {retrying ? (
              <>
                <Loading size="sm" className="mr-2" />
                Повторная попытка...
              </>
            ) : (
              'Попробовать снова'
            )}
          </Button>
        </Card>

        {/* Info Card */}
        <Card className="p-5">
          <h4 className="font-semibold text-text-primary mb-2">
            Что делать?
          </h4>
          <ul className="space-y-2 text-text-secondary text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary-main">•</span>
              <span>Убедитесь, что открываете приложение в Telegram</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-main">•</span>
              <span>Проверьте подключение к интернету</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-main">•</span>
              <span>Попробуйте перезапустить Mini App</span>
            </li>
          </ul>
        </Card>

        {/* Support */}
        <div className="text-center">
          <p className="text-text-tertiary text-sm">
            Проблемы с входом?{' '}
            <a
              href="https://t.me/outlivion_support"
              className="text-primary-main hover:underline"
            >
              Написать в поддержку
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

