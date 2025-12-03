'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';


interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  createdAt: string;
}

const plans = [
  {
    id: '30days',
    name: '30 дней',
    price: 100,
    period: '30 дней',
    pricePerMonth: 100,
    popular: false,
    discount: null,
  },
  {
    id: '90days',
    name: '90 дней',
    price: 270,
    period: '90 дней',
    pricePerMonth: 90,
    popular: false,
    discount: '-10%',
  },
  {
    id: '180days',
    name: '180 дней',
    price: 480,
    period: '180 дней',
    pricePerMonth: 80,
    popular: true,
    discount: '-20%',
  },
  {
    id: '365days',
    name: '365 дней',
    price: 850,
    period: '365 дней',
    pricePerMonth: 70,
    popular: false,
    discount: '-30%',
  },
];

export default function BillingPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [devicesCount, setDevicesCount] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('180days');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/web/login');
      return;
    }

    async function fetchData() {
      try {
        const paymentsRes = await api.get('/user/payments');
        setPayments(paymentsRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    try {
      await api.post('/promo/apply', { code: promoCode });
      setPromoApplied(true);
      setPromoError(null);
    } catch (error: any) {
      setPromoError(error.response?.data?.error || 'Неверный промокод');
      setPromoApplied(false);
    }
  };

  const handleCreatePayment = async () => {
    setProcessing(true);
    try {
      const response = await api.post('/billing/create', {
        plan: selectedPlan,
        devices: devicesCount,
        promoCode: promoApplied ? promoCode : undefined,
      });

      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка создания платежа');
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-status-success/20 text-status-success';
      case 'pending':
        return 'bg-status-warning/20 text-status-warning';
      case 'failed':
        return 'bg-status-error/20 text-status-error';
      default:
        return 'bg-text-tertiary/20 text-text-tertiary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Оплачен';
      case 'pending':
        return 'Ожидает';
      case 'failed':
        return 'Ошибка';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-main border-t-transparent"></div>
      </div>
    );
  }

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const totalPrice = selectedPlanData ? selectedPlanData.price * devicesCount : 0;

  return (
    <div className="min-h-screen bg-background-primary flex justify-center">
      {/* Background glow */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary-main rounded-full filter blur-[128px] opacity-20 pointer-events-none"></div>
      
      {/* Main container - 448px */}
      <div className="w-full max-w-[448px] flex flex-col min-h-screen relative">
        

        <main className="flex-1 p-4 pb-24">
          <h2 className="text-xl font-bold text-text-primary mb-6">Покупка подписки</h2>

          {/* Блок выбора */}
          <div className="bg-background-card rounded-2xl p-5 mb-4">
            <p className="text-sm text-text-secondary mb-4">
              Выберите интересующий тариф и количество устройств
            </p>

            {/* Выбор количества устройств */}
            <div className="mb-6">
              <p className="text-sm text-text-primary mb-3">
                Количество устройств: {devicesCount}
              </p>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setDevicesCount(num)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      devicesCount === num
                        ? 'bg-primary-main text-white scale-110'
                        : 'bg-background-tertiary text-text-tertiary hover:bg-background-tertiary/80'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Тарифы сетка 2x2 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative bg-background-tertiary rounded-2xl p-4 transition-all text-left ${
                    selectedPlan === plan.id
                      ? 'ring-2 ring-primary-main'
                      : 'hover:bg-background-tertiary/80'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-status-error text-white rounded-full text-[10px] font-bold uppercase">
                      Популярный
                    </span>
                  )}
                  {!plan.popular && plan.discount && (
                    <span className="absolute -top-2 right-3 px-2 py-0.5 bg-primary-main text-white rounded-full text-[10px] font-bold">
                      {plan.discount}
                    </span>
                  )}

                  <p className="text-sm text-text-primary font-semibold mb-1">{plan.name}</p>
                  <p className="text-2xl font-bold text-text-primary mb-1">
                    {plan.price * devicesCount} ₽
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {plan.pricePerMonth * devicesCount} ₽ в месяц
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Промокод */}
          <div className="bg-background-card rounded-2xl p-4 mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Промокод"
                className="flex-1 px-3 py-2 bg-background-tertiary text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-main rounded-xl text-sm"
                disabled={promoApplied}
              />
              <button
                onClick={handleApplyPromo}
                disabled={promoApplied || !promoCode.trim()}
                className="px-4 py-2 bg-primary-main text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {promoApplied ? '✓' : 'OK'}
              </button>
            </div>

            {promoError && (
              <p className="mt-2 text-xs text-status-error">{promoError}</p>
            )}
            {promoApplied && (
              <p className="mt-2 text-xs text-status-success">✓ Промокод применен</p>
            )}
          </div>

          {/* Кнопка оплаты */}
          <button
            onClick={handleCreatePayment}
            disabled={processing}
            className="w-full py-4 px-6 bg-primary-main text-white font-bold rounded-2xl hover:bg-primary-dark transition-colors disabled:opacity-50 mb-4 text-lg"
          >
            {processing ? 'Обработка...' : `Оплатить ${totalPrice} ₽`}
          </button>

          {/* История платежей */}
          <div className="bg-background-card rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">История платежей</h3>

            {payments.length > 0 ? (
              <div className="space-y-2">
                {payments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {payment.plan}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(payment.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary">
                        {payment.amount} ₽
                      </p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-text-tertiary">Нет платежей</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
