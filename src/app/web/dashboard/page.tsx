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
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);

  const referralLink = user ? `https://t.me/outlivionbot?start=${user.telegramId}` : '';

  useEffect(() => {
    // Check auth first
    console.log('Checking authentication...');
    const authenticated = isAuthenticated();
    console.log('Is authenticated:', authenticated);
    
    if (!authenticated) {
      console.log('Not authenticated, redirecting to login...');
      router.replace('/web/login');
      return;
    }

    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.error('Request timeout after 10 seconds');
        setError('Превышено время ожидания ответа от сервера');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    async function fetchData() {
      try {
        console.log('Fetching user data from:', process.env.NEXT_PUBLIC_API_URL);
        const [userData, subscriptionData] = await Promise.all([
          userApi.getUser(),
          userApi.getSubscription(),
        ]);

        clearTimeout(timeoutId);

        if (!isMounted) return;

        console.log('Data fetched successfully:', { userData, subscriptionData });
        setUser(userData);
        setSubscription(subscriptionData);
        setBalance(userData.balance || 0);
        setError(null);
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        clearTimeout(timeoutId);
        
        if (!isMounted) return;
        
        const errorMessage = error.message || 'Ошибка загрузки данных';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary p-4">
        <div className="max-w-md w-full bg-background-card rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-status-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">Ошибка загрузки</h3>
          <p className="text-text-secondary mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-primary-main text-white font-semibold rounded-xl hover:bg-primary-dark transition-all"
            >
              Повторить попытку
            </button>
            <button
              onClick={() => router.push('/web/login')}
              className="w-full py-3 px-4 bg-background-tertiary text-text-primary font-semibold rounded-xl hover:bg-border-light transition-all"
            >
              Вернуться к логину
            </button>
          </div>
        </div>
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
