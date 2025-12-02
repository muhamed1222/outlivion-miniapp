'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { NavigationBar } from '@/components/navigation-bar';
import { useToast } from '@/components/ui/toast';
import { billingApi, userApi, User, Payment } from '@/lib/api';
import { hapticImpact, hapticNotification, showBackButton, hideBackButton, openLink } from '@/lib/telegram';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';

interface TariffPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  popular?: boolean;
}

const defaultTariffs: TariffPlan[] = [
  {
    id: 'monthly',
    name: 'Месячный',
    price: 100,
    duration: 30,
    description: '30 дней доступа',
    popular: true,
  },
  {
    id: 'quarterly',
    name: 'Квартальный',
    price: 270,
    duration: 90,
    description: '90 дней доступа, скидка 10%',
  },
  {
    id: 'yearly',
    name: 'Годовой',
    price: 960,
    duration: 365,
    description: '365 дней доступа, скидка 20%',
  },
];

export default function BillingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tariffs, setTariffs] = useState<TariffPlan[]>(defaultTariffs);
  const [selectedTariff, setSelectedTariff] = useState<string>('monthly');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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
        const [userData, paymentsData] = await Promise.all([
          userApi.getUser(),
          userApi.getPayments().catch(() => []),
        ]);

        setUser(userData);
        setPayments(paymentsData);

        // Попытка загрузить тарифы с сервера
        try {
          const tariffsData = await billingApi.getTariffs();
          if (tariffsData && tariffsData.length > 0) {
            setTariffs(tariffsData as TariffPlan[]);
          }
        } catch (error) {
          console.log('Using default tariffs');
        }
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        showToast(error.message || 'Ошибка загрузки данных', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [showToast]);

  const handleSelectTariff = (tariffId: string) => {
    hapticImpact('light');
    setSelectedTariff(tariffId);
  };

  const handlePayment = async () => {
    if (!selectedTariff) {
      showToast('Выберите тариф', 'warning');
      return;
    }

    setProcessing(true);
    hapticImpact('medium');

    try {
      const response = await billingApi.createPayment({
        plan: selectedTariff,
      });

      hapticNotification('success');
      showToast('Перенаправление на страницу оплаты...', 'success');

      // Открываем URL оплаты
      if (response.paymentUrl) {
        setTimeout(() => {
          openLink(response.paymentUrl);
        }, 500);
      }
    } catch (error: any) {
      console.error('Failed to create payment:', error);
      hapticNotification('error');
      showToast(error.message || 'Ошибка создания платежа', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      completed: 'text-status-success',
      pending: 'text-status-warning',
      failed: 'text-status-error',
      cancelled: 'text-text-tertiary',
    };
    return colors[status.toLowerCase()] || 'text-text-secondary';
  };

  const getPaymentStatusText = (status: string): string => {
    const texts: Record<string, string> = {
      completed: 'Завершён',
      pending: 'В обработке',
      failed: 'Ошибка',
      cancelled: 'Отменён',
    };
    return texts[status.toLowerCase()] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <Loading size="lg" />
      </div>
    );
  }

  const selectedPlan = tariffs.find(t => t.id === selectedTariff);

  return (
    <div className="min-h-screen bg-background-primary pb-20">
      {/* Background */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary-main rounded-full filter blur-[128px] opacity-20 pointer-events-none" />

      {/* Main container */}
      <div className="max-w-[448px] mx-auto p-4 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="text-center pt-2 pb-4">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Оплата</h1>
          <p className="text-text-secondary">Выберите тарифный план</p>
        </div>

        {/* Balance Card */}
        {user && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm mb-1">Текущий баланс</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {formatPrice(user.balance || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary-main/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tariffs */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">Тарифные планы</h2>
          
          {tariffs.map((tariff) => (
            <Card
              key={tariff.id}
              className={cn(
                'cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden',
                selectedTariff === tariff.id && 'border-primary-main bg-primary-main/10'
              )}
              onClick={() => handleSelectTariff(tariff.id)}
            >
              {tariff.popular && (
                <div className="absolute top-0 right-0 bg-primary-main text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                  Популярный
                </div>
              )}
              
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-primary mb-1">
                      {tariff.name}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {tariff.description || `${tariff.duration} дней`}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-3xl font-bold text-text-primary">
                      {tariff.price}₽
                    </p>
                    <p className="text-text-secondary text-xs">
                      {Math.round(tariff.price / (tariff.duration / 30))}₽/мес
                    </p>
                  </div>
                </div>

                {selectedTariff === tariff.id && (
                  <div className="flex items-center gap-2 text-primary-main font-medium text-sm">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Выбрано
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Button */}
        <Card className="border-primary-main/30 bg-primary-main/5">
          <CardContent className="p-5">
            <div className="mb-4">
              <p className="text-text-secondary text-sm mb-2">К оплате:</p>
              <p className="text-4xl font-bold text-text-primary">
                {selectedPlan ? formatPrice(selectedPlan.price) : '0 ₽'}
              </p>
            </div>

            <Button
              onClick={handlePayment}
              disabled={!selectedTariff || processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Обработка...
                </>
              ) : (
                'Перейти к оплате'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>История платежей</CardTitle>
              <Button
                onClick={() => {
                  hapticImpact('light');
                  setShowHistory(!showHistory);
                }}
                variant="ghost"
                size="sm"
              >
                {showHistory ? 'Скрыть' : 'Показать'}
              </Button>
            </div>
          </CardHeader>
          
          {showHistory && (
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-text-secondary">Нет платежей</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="p-4 bg-background-tertiary rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-text-primary">
                          {formatPrice(payment.amount, payment.currency === 'RUB' ? '₽' : payment.currency)}
                        </span>
                        <span className={cn('text-sm font-medium', getPaymentStatusColor(payment.status))}>
                          {getPaymentStatusText(payment.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">{payment.plan}</span>
                        <span className="text-text-tertiary">{formatDateTime(payment.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Info */}
        <Card className="border-border-light">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-main/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary mb-1">
                  Безопасная оплата
                </h4>
                <p className="text-text-secondary text-sm">
                  Все платежи защищены и обрабатываются через безопасное соединение
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <NavigationBar />
    </div>
  );
}

