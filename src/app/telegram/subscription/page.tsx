'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { NavigationBar } from '@/components/navigation-bar';
import { useToast } from '@/components/ui/toast';
import { userApi, Subscription, User } from '@/lib/api';
import { hapticImpact, showBackButton, hideBackButton } from '@/lib/telegram';
import { formatDate, formatDays, getSubscriptionStatusText, getStatusColor } from '@/lib/utils';

export default function SubscriptionPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Показать кнопку "Назад" в Telegram
    showBackButton(() => {
      router.push('/');
    });

    return () => {
      hideBackButton();
    };
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subscriptionData, userData] = await Promise.all([
          userApi.getSubscription(),
          userApi.getUser(),
        ]);

        setSubscription(subscriptionData);
        setUser(userData);
      } catch (error: any) {
        console.error('Failed to fetch subscription:', error);
        showToast(error.message || 'Ошибка загрузки подписки', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [showToast]);

  const handleRenew = () => {
    hapticImpact('light');
    router.push('/billing');
  };

  const handleManageServers = () => {
    hapticImpact('light');
    router.push('/servers');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <Loading size="lg" />
      </div>
    );
  }

  const isActive = subscription?.status === 'active' && !subscription?.isExpired;
  const daysRemaining = subscription?.daysRemaining || 0;
  const isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;

  return (
    <div className="min-h-screen bg-background-primary pb-20">
      {/* Background */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary-main rounded-full filter blur-[128px] opacity-20 pointer-events-none" />

      {/* Main container */}
      <div className="max-w-[448px] mx-auto p-4 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="text-center pt-2 pb-4">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Подписка</h1>
          <p className="text-text-secondary">Управление вашей подпиской</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Статус подписки</CardTitle>
                <CardDescription className="mt-1">
                  {isActive ? 'Всё работает отлично!' : 'Подписка неактивна'}
                </CardDescription>
              </div>
              <div className={`w-4 h-4 rounded-full ${
                isActive ? 'bg-status-success' : 'bg-status-error'
              } animate-pulse`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-xl">
                <span className="text-text-secondary">Статус</span>
                <span className={`font-semibold ${getStatusColor(subscription?.status || 'none')}`}>
                  {getSubscriptionStatusText(subscription?.status || 'none')}
                </span>
              </div>

              {subscription?.startDate && (
                <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-xl">
                  <span className="text-text-secondary">Начало</span>
                  <span className="font-semibold text-text-primary">
                    {formatDate(subscription.startDate)}
                  </span>
                </div>
              )}

              {subscription?.endDate && (
                <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-xl">
                  <span className="text-text-secondary">Окончание</span>
                  <span className="font-semibold text-text-primary">
                    {formatDate(subscription.endDate)}
                  </span>
                </div>
              )}

              {daysRemaining > 0 && (
                <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-xl">
                  <span className="text-text-secondary">Осталось</span>
                  <span className={`font-semibold ${isExpiringSoon ? 'text-status-warning' : 'text-text-primary'}`}>
                    {formatDays(daysRemaining)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warning for expiring subscription */}
        {isExpiringSoon && (
          <Card className="border-status-warning/30 bg-status-warning/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-status-warning/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-status-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-status-warning mb-1">
                    Подписка скоро истечёт
                  </h4>
                  <p className="text-text-secondary text-sm">
                    Осталось всего {formatDays(daysRemaining)}. Продлите подписку, чтобы не потерять доступ к сервису.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription expired */}
        {subscription?.isExpired && (
          <Card className="border-status-error/30 bg-status-error/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-status-error/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-status-error mb-1">
                    Подписка истекла
                  </h4>
                  <p className="text-text-secondary text-sm">
                    Продлите подписку для продолжения использования сервиса.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Info */}
        <Card>
          <CardHeader>
            <CardTitle>Тарифный план</CardTitle>
            <CardDescription>Ваш текущий тариф</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-primary rounded-xl text-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold">{subscription?.plan || 'Стандарт'}</h3>
                  <span className="text-3xl font-bold">100₽</span>
                </div>
                <p className="text-white/80 text-sm">за месяц</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-text-primary">
                  <svg className="w-5 h-5 text-status-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Безлимитный трафик</span>
                </div>

                <div className="flex items-center gap-3 text-text-primary">
                  <svg className="w-5 h-5 text-status-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Высокая скорость</span>
                </div>

                <div className="flex items-center gap-3 text-text-primary">
                  <svg className="w-5 h-5 text-status-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">До 3 устройств одновременно</span>
                </div>

                <div className="flex items-center gap-3 text-text-primary">
                  <svg className="w-5 h-5 text-status-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Серверы по всему миру</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {(!isActive || isExpiringSoon) && (
            <Button
              onClick={handleRenew}
              className="w-full"
              size="lg"
            >
              {subscription?.isExpired ? 'Возобновить подписку' : 'Продлить подписку'}
            </Button>
          )}

          <Button
            onClick={handleManageServers}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            Управление серверами
          </Button>
        </div>

        {/* Balance Info */}
        {user && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm mb-1">Баланс</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {user.balance || 0} ₽
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/billing')}
                  variant="outline"
                >
                  Пополнить
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}

