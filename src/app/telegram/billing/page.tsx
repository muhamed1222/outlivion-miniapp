'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/components/ui/toast';
import { billingApi, userApi, User } from '@/lib/api';
import { tokenStorage } from '@/lib/storage';
import { hapticImpact, hapticNotification, showBackButton, hideBackButton, openLink } from '@/lib/telegram';
import { formatPrice, cn } from '@/lib/utils';

interface TariffPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  monthlyPrice?: number;
}

const defaultTariffs: TariffPlan[] = [
  {
    id: '1month',
    name: '1 месяц',
    price: 99,
    duration: 30,
  },
  {
    id: '3months',
    name: '3 месяца',
    price: 390,
    duration: 90,
    monthlyPrice: 130,
  },
  {
    id: '6months',
    name: '6 месяцев',
    price: 720,
    duration: 180,
    monthlyPrice: 120,
  },
  {
    id: '1year',
    name: '1 год',
    price: 1320,
    duration: 365,
    monthlyPrice: 110,
  },
];

export default function BillingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [tariffs] = useState<TariffPlan[]>(defaultTariffs);
  const [selectedTariff, setSelectedTariff] = useState<string>('6months');
  const [deviceCount, setDeviceCount] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Показать кнопку "Назад" в Telegram
    showBackButton(() => {
      router.push('/telegram');
    });

    return () => {
      hideBackButton();
    };
  }, [router]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchData() {
      // Check if we have an auth token before making requests
      const token = tokenStorage.getAccessToken();
      if (!token) {
        console.log('No auth token found, skipping data fetch');
        setLoading(false);
        return;
      }

      try {
        const userData = await userApi.getUser();
        setUser(userData);
      } catch (error: any) {
        // Тихая обработка ошибок авторизации (нормально для разработки без Telegram)
        if (error?.response?.status === 401 || error?.message?.includes('No token')) {
          console.log('User not authenticated, continuing without user data');
        } else {
          console.error('Failed to fetch data:', error);
          showToast(error.message || 'Ошибка загрузки данных', 'error');
        }
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

  const handleDeviceCountChange = (count: number) => {
    hapticImpact('light');
    setDeviceCount(count);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <Loading size="lg" />
      </div>
    );
  }

  const selectedPlan = tariffs.find(t => t.id === selectedTariff);
  const totalPrice = selectedPlan ? selectedPlan.price * deviceCount : 0;

  return (
    <div className="relative min-h-screen bg-[#0D0D0D] text-white font-sans flex items-center justify-center">
      
      {/* Main Content */}
      <main className="relative z-10 px-5 pt-4 pb-8 w-full max-w-[360px]">
        <div className="flex flex-col gap-[30px] w-full">
          {/* Title Section */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-white">Покупка подписки</h2>
            <p className="text-sm text-white/60">
              Выберите интересующий тариф и количество устройств
            </p>
          </div>

          {/* Device Count Selector */}
          <div className="flex flex-col gap-3">
            <p className="text-base font-medium text-white">
              Количество устройств: {deviceCount}
            </p>
            <div className="relative h-[30px] w-full">
              {/* Slider Track */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-1 bg-gradient-to-r from-[#F55128] to-[#C93D1A] rounded-full" />
              </div>
              {/* Slider Dots */}
              <div className="absolute inset-0 flex items-center justify-between px-1">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleDeviceCountChange(count)}
                    className={cn(
                      'relative z-10 transition-all',
                      deviceCount === count
                        ? 'w-6 h-6 rounded-full border-2 border-[#F55128] bg-[#F55128] shadow-lg shadow-[#F55128]/50'
                        : 'w-3 h-3 rounded-full bg-[#F55128] opacity-60'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tariff Plans Grid */}
          <div className="flex flex-col gap-2">
            {/* First Row */}
            <div className="flex gap-2">
              {/* 1 Month */}
              <button
                onClick={() => handleSelectTariff('1month')}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-[30px] h-40 p-5 rounded-[20px] transition-all active:scale-[0.98]',
                  'backdrop-blur-[7.5px] bg-gradient-to-t from-[#8f290f] to-[#4b180b]',
                  selectedTariff === '1month'
                    ? 'border-2 border-[#F55128]'
                    : 'border border-[rgba(245,81,40,0.4)]'
                )}
              >
                <p className="text-base font-medium text-white text-center">1 месяц</p>
                <p className="text-[26px] font-semibold text-white">99 ₽</p>
              </button>

              {/* 3 Months */}
              <button
                onClick={() => handleSelectTariff('3months')}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-[30px] h-40 p-5 rounded-[20px] transition-all active:scale-[0.98]',
                  'backdrop-blur-[7.5px] bg-gradient-to-t from-[#8f290f] to-[#4b180b]',
                  selectedTariff === '3months'
                    ? 'border-2 border-[#F55128]'
                    : 'border border-[rgba(245,81,40,0.4)]'
                )}
              >
                <p className="text-base font-medium text-white text-center">3 месяца</p>
                <div className="flex flex-col gap-1 items-center">
                  <p className="text-[26px] font-semibold text-white">390 ₽</p>
                  <p className="text-sm font-normal text-white/60">130 ₽ в месяц</p>
                </div>
              </button>
            </div>

            {/* Second Row */}
            <div className="flex gap-2">
              {/* 6 Months */}
              <button
                onClick={() => handleSelectTariff('6months')}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-[30px] h-40 p-5 rounded-[20px] transition-all active:scale-[0.98]',
                  'backdrop-blur-[7.5px] bg-gradient-to-t from-[#de4620] to-[#4b180b]',
                  selectedTariff === '6months'
                    ? 'border-2 border-[#F55128]'
                    : 'border border-[rgba(245,81,40,0.4)]'
                )}
              >
                <p className="text-base font-medium text-white text-center">6 месяцев</p>
                <div className="flex flex-col gap-1 items-center">
                  <p className="text-[26px] font-semibold text-white">720 ₽</p>
                  <p className="text-sm font-normal text-white/60">120 ₽ в месяц</p>
                </div>
              </button>

              {/* 1 Year */}
              <button
                onClick={() => handleSelectTariff('1year')}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-[30px] h-40 p-5 rounded-[20px] transition-all active:scale-[0.98]',
                  'backdrop-blur-[7.5px] bg-gradient-to-t from-[#8f290f] to-[#4b180b]',
                  selectedTariff === '1year'
                    ? 'border-2 border-[#F55128]'
                    : 'border border-[rgba(245,81,40,0.4)]'
                )}
              >
                <p className="text-base font-medium text-white text-center">1 год</p>
                <div className="flex flex-col gap-1 items-center">
                  <p className="text-[26px] font-semibold text-white">1 320 ₽</p>
                  <p className="text-sm font-normal text-white/60">110 ₽ в месяц</p>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={!selectedTariff || processing}
            className={cn(
              'w-full flex items-center justify-between px-4 h-[51px] rounded-[36px] transition-all active:scale-[0.98]',
              'backdrop-blur-[7.5px] bg-[#F55128]',
              (!selectedTariff || processing) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {processing ? (
              <>
                <Loading size="sm" className="text-white" />
                <span className="text-base font-medium text-white">Обработка...</span>
              </>
            ) : (
              <span className="text-base font-medium text-white w-full text-center">
                Оплатить {formatPrice(totalPrice)}
              </span>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
