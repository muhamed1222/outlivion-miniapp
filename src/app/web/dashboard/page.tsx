'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userApi, type User, type Subscription } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { useToast } from '@/components/ui/toast';

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  const referralLink = user ? `https://t.me/outlivionbot?start=${user.telegramId}` : '';

  useEffect(() => {
    // Check auth first
    if (!isAuthenticated()) {
      router.push('/web/login');
      return;
    }

    async function fetchData() {
      try {
        const [userData, subscriptionData] = await Promise.all([
          userApi.getUser(),
          userApi.getSubscription(),
        ]);

        setUser(userData);
        setSubscription(subscriptionData);
        setBalance(userData.balance || 0);
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        showToast(error.message || 'Ошибка загрузки данных', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, showToast]);

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      showToast('Ссылка скопирована!', 'success');
    } catch {
      showToast('Ошибка копирования', 'error');
    }
  };

  const handlePromisedPayment = () => {
    showToast('Обещанный платёж временно недоступен', 'warning');
  };

  const handleHelp = () => {
    router.push('/web/faq');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-main border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isLowBalance = balance <= 0;
  const tariffPrice = 100;

  return (
    <div className="min-h-screen bg-background-primary flex justify-center">
      {/* Background glow */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary-main rounded-full filter blur-[128px] opacity-20 pointer-events-none"></div>
      
      {/* Main container - max width for readability */}
      <div className="w-full max-w-4xl flex flex-col min-h-screen relative px-4">

        <main className="flex-1 p-4 pb-24">
          {/* Баланс */}
          <div className="bg-background-card rounded-2xl p-6 mb-4">
            <p className="text-sm text-text-secondary mb-1">Баланс</p>
            <p className={`text-5xl font-bold mb-6 ${isLowBalance ? 'text-status-error' : 'text-text-primary'}`}>
              {balance} ₽
            </p>

            <button
              onClick={() => router.push('/web/billing')}
              className="w-full py-3.5 px-4 bg-primary-main text-white font-semibold rounded-xl hover:bg-primary-dark transition-all mb-3"
            >
              Пополнить баланс
            </button>

            <button
              onClick={handlePromisedPayment}
              className="w-full py-3.5 px-4 bg-background-tertiary text-text-primary font-semibold rounded-xl hover:bg-border-light transition-all mb-4"
            >
              Обещанный платёж
            </button>

            <button
              onClick={() => router.push('/web/billing')}
              className="w-full text-center text-primary-main hover:text-primary-light transition-colors text-sm font-medium"
            >
              История платежей
            </button>
          </div>

          {/* Предупреждение о низком балансе */}
          {isLowBalance && (
            <p className="text-status-error text-center text-sm mb-4 px-2">
              Недостаточно средств на балансе, аккаунт приостановлен. Для продолжения работы пополните баланс
            </p>
          )}

          {/* Тариф */}
          <p className="text-text-secondary text-center text-sm mb-4">
            Тариф {tariffPrice} ₽/мес за одно устройство
          </p>

          {/* Реферальная программа */}
          <div className="bg-background-card rounded-2xl p-5 mb-4">
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Пригласи друга и получи 50₽ на баланс
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              Отправьте ссылку другу. Когда ваш друг зайдёт в наш сервис и зарегистрируется, вы получите 50₽ на баланс!
            </p>
            <p className="text-text-tertiary text-sm mb-2">
              Скопируйте и отправьте ссылку другу:
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background-tertiary rounded-xl px-3 py-2.5 min-w-0">
                <p className="text-text-secondary text-xs truncate font-mono">
                  {referralLink}
                </p>
              </div>
              <button
                onClick={copyReferralLink}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-primary-main rounded-xl hover:bg-primary-dark transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Помощь */}
          <button 
            onClick={handleHelp}
            className="w-full flex items-center justify-between bg-background-card rounded-2xl p-4 hover:bg-background-tertiary transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-text-tertiary flex items-center justify-center">
                <span className="text-text-tertiary text-sm">?</span>
              </div>
              <span className="text-text-primary font-medium">Помощь</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-main/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </main>
      </div>
    </div>
  );
}
