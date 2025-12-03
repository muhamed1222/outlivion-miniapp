'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/components/ui/toast';
import { userApi, User, Subscription } from '@/lib/api';
import { getTelegramUser, hapticImpact } from '@/lib/telegram';
import { formatPrice, getInitials, copyToClipboard } from '@/lib/utils';

export default function TelegramHomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [userData, subscriptionData] = await Promise.all([
          userApi.getUser(),
          userApi.getSubscription(),
        ]);

        setUser(userData);
        setSubscription(subscriptionData);
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        showToast(error.message || 'Ошибка загрузки данных', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [showToast]);

  const handleCopyReferralLink = async () => {
    if (!user) return;
    
    hapticImpact('light');
    const referralLink = `https://t.me/outlivionbot?start=${user.telegramId}`;
    const success = await copyToClipboard(referralLink);
    
    if (success) {
      showToast('Ссылка скопирована!', 'success');
    } else {
      showToast('Ошибка копирования', 'error');
    }
  };

  const handleTopUp = () => {
    hapticImpact('light');
    router.push('/telegram/billing');
  };

  const handleViewSubscription = () => {
    hapticImpact('light');
    router.push('/telegram/subscription');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <Loading size="lg" />
      </div>
    );
  }

  const telegramUser = getTelegramUser();
  const displayName = user?.firstName || telegramUser?.first_name || 'Пользователь';
  const balance = user?.balance || 0;
  const isLowBalance = balance <= 0;

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Background glow */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary-main rounded-full filter blur-[128px] opacity-20 pointer-events-none animate-blob" />

      {/* Main container */}
      <div className="max-w-[448px] mx-auto p-4 space-y-4 animate-fade-in">
        {/* Header with user info */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-main/20 flex items-center justify-center">
              {user?.photoUrl || telegramUser?.photo_url ? (
                <img
                  src={user?.photoUrl || telegramUser?.photo_url}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-primary-main text-xl font-bold">
                  {getInitials(user?.firstName, user?.lastName)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-text-primary">
                Привет, {displayName}! 👋
              </h1>
              <p className="text-text-secondary text-sm">
                Добро пожаловать в Outlivion
              </p>
            </div>
          </div>
        </Card>

        {/* Balance Card */}
        <Card className="p-6">
          <p className="text-sm text-text-secondary mb-1">Баланс</p>
          <p className={`text-5xl font-bold mb-6 ${isLowBalance ? 'text-status-error' : 'text-text-primary'}`}>
            {formatPrice(balance)}
          </p>

          {isLowBalance && (
            <div className="mb-4 p-3 bg-status-error/10 border border-status-error/20 rounded-xl">
              <p className="text-status-error text-sm">
                ⚠️ Недостаточно средств. Пополните баланс для продолжения работы.
              </p>
            </div>
          )}

          <Button
            onClick={handleTopUp}
            className="w-full mb-3"
            size="lg"
          >
            Пополнить баланс
          </Button>

          <Button
            onClick={() => router.push('/telegram/billing')}
            variant="ghost"
            className="w-full"
          >
            История платежей
          </Button>
        </Card>

        {/* Subscription Status */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-text-primary">Подписка</h3>
              <p className="text-text-secondary text-sm">
                {subscription?.status === 'active' ? 'Активна' : 'Неактивна'}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              subscription?.status === 'active'
                ? 'bg-status-success/20 text-status-success'
                : 'bg-status-error/20 text-status-error'
            }`}>
              {subscription?.daysRemaining ? `${subscription.daysRemaining} дней` : 'Нет'}
            </div>
          </div>

          <Button
            onClick={handleViewSubscription}
            variant="secondary"
            className="w-full"
          >
            Подробнее
          </Button>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => router.push('/telegram/servers')}
            variant="secondary"
            className="h-24 flex-col gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <span className="text-sm font-medium">Серверы</span>
          </Button>

          <Button
            onClick={() => router.push('/telegram/promo')}
            variant="secondary"
            className="h-24 flex-col gap-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm font-medium">Промокод</span>
          </Button>
        </div>

        {/* Referral Program */}
        <Card className="p-5">
          <h3 className="text-xl font-bold text-text-primary mb-2">
            Пригласи друга — получи 50₽ 🎁
          </h3>
          <p className="text-text-secondary text-sm mb-4">
            Отправьте ссылку другу. Когда друг зарегистрируется, вы получите 50₽ на баланс!
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-background-tertiary rounded-xl px-3 py-2.5 min-w-0">
              <p className="text-text-secondary text-xs truncate font-mono">
                https://t.me/outlivionbot?start={user?.telegramId}
              </p>
            </div>
            <Button
              onClick={handleCopyReferralLink}
              size="icon"
              className="flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-main/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-text-primary mb-1">
                Тариф 100₽/мес
              </h4>
              <p className="text-text-secondary text-sm">
                Безлимитный трафик, высокая скорость, до 3 устройств одновременно
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

