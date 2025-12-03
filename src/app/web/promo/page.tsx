'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';


export default function PromoPage() {
  const router = useRouter();
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [promoInfo, setPromoInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/web/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleCheckPromo = async () => {
    if (!promoCode.trim()) {
      setError('Введите промокод');
      return;
    }

    setChecking(true);
    setError(null);
    setPromoInfo(null);

    try {
      const response = await api.post('/promo/apply', { code: promoCode });
      setPromoInfo(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный промокод');
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-main border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary flex justify-center">
      {/* Background glow */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary-main rounded-full filter blur-[128px] opacity-20 pointer-events-none"></div>
      
      {/* Main container - 448px */}
      <div className="w-full max-w-[448px] flex flex-col min-h-screen relative">
        

        <main className="flex-1 p-4 pb-20">
          <h2 className="text-xl font-bold text-text-primary mb-6">Промокод</h2>

          <div className="bg-background-card rounded-2xl p-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Введите промокод
                </label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="PROMO2024"
                  className="w-full px-4 py-3 bg-background-tertiary border border-border-light rounded-xl text-base font-semibold tracking-wider text-center text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary-main"
                />
              </div>

              <button
                onClick={handleCheckPromo}
                disabled={checking || !promoCode.trim()}
                className="w-full bg-primary-main text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {checking ? 'Проверка...' : 'Проверить'}
              </button>

              {error && (
                <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-xl">
                  <p className="text-status-error text-sm text-center">{error}</p>
                </div>
              )}

              {promoInfo && (
                <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl">
                  <p className="text-status-success font-semibold text-center mb-3">
                    ✓ Промокод действителен
                  </p>
                  <div className="space-y-1 text-sm text-center">
                    <p className="text-text-secondary">
                      Скидка:{' '}
                      <span className="font-semibold text-text-primary">
                        {promoInfo.discountType === 'percentage'
                          ? `${promoInfo.discountValue}%`
                          : `$${promoInfo.discountValue / 100}`}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/web/billing')}
                    className="mt-4 w-full bg-status-success text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    К оплате →
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-background-card rounded-2xl">
            <p className="text-xs text-text-tertiary text-center">
              Введите промокод и нажмите "Проверить". Действительный промокод 
              можно применить на странице оплаты.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
