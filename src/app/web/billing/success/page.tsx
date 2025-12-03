'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';

function BillingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/web/login');
      return;
    }

    if (!paymentId) {
      setStatus('error');
      return;
    }

    // Проверяем статус платежа
    const checkPayment = async () => {
      try {
        const response = await api.get(`/user/payments`);
        const payments = response.data;
        const payment = payments.find((p: any) => p.id === paymentId);

        if (payment && payment.status === 'completed') {
          setStatus('success');
          // Перенаправляем на дашборд через 3 секунды
          setTimeout(() => {
            router.push('/web/dashboard');
          }, 3000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    checkPayment();
  }, [router, paymentId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary">
      <div className="w-full max-w-md p-8">
        <div className="bg-background-primary rounded-xl shadow-lg p-8 text-center">
          {status === 'checking' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Проверка платежа...
              </h2>
              <p className="text-text-secondary">
                Пожалуйста, подождите
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Платеж успешно обработан!
              </h2>
              <p className="text-text-secondary mb-6">
                Ваша подписка активирована. Вы будете перенаправлены на дашборд...
              </p>
              <button
                onClick={() => router.push('/web/dashboard')}
                className="bg-primary-main text-white py-2 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Перейти в дашборд
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-4">✗</div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Ошибка обработки платежа
              </h2>
              <p className="text-text-secondary mb-6">
                Пожалуйста, свяжитесь с поддержкой или попробуйте снова.
              </p>
              <button
                onClick={() => router.push('/web/billing')}
                className="bg-primary-main text-white py-2 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Вернуться к оплате
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background-secondary">
        <div className="w-full max-w-md p-8">
          <div className="bg-background-primary rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Загрузка...
            </h2>
          </div>
        </div>
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  );
}

