'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/components/ui/toast';
import { promoApi, PromoCodeResponse } from '@/lib/api';
import { hapticImpact, hapticNotification, showBackButton, hideBackButton } from '@/lib/telegram';
import { cn } from '@/lib/utils';

export default function PromoPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [promoCode, setPromoCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [validationResult, setValidationResult] = useState<PromoCodeResponse | null>(null);

  useEffect(() => {
    // Показать кнопку "Назад" в Telegram
    showBackButton(() => {
      router.push('/');
    });

    return () => {
      hideBackButton();
    };
  }, [router]);

  const handleValidate = async () => {
    if (!promoCode.trim()) {
      showToast('Введите промокод', 'warning');
      return;
    }

    setValidating(true);
    hapticImpact('light');

    try {
      const result = await promoApi.applyPromoCode(promoCode.trim());
      setValidationResult(result);

      if (result.valid) {
        hapticNotification('success');
        showToast('Промокод действителен!', 'success');
      } else {
        hapticNotification('error');
        showToast('Промокод недействителен', 'error');
      }
    } catch (error: any) {
      console.error('Failed to validate promo code:', error);
      hapticNotification('error');
      showToast(error.message || 'Ошибка проверки промокода', 'error');
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };

  const handleApply = async () => {
    if (!promoCode.trim()) {
      showToast('Введите промокод', 'warning');
      return;
    }

    setApplying(true);
    hapticImpact('medium');

    try {
      const result = await promoApi.applyPromoCode(promoCode.trim());

      if (result.valid) {
        hapticNotification('success');
        showToast('Промокод применён!', 'success');
        
        // Перенаправляем на главную страницу через 1.5 секунды
        setTimeout(() => {
          router.push('/telegram');
        }, 1500);
      } else {
        hapticNotification('error');
        showToast('Не удалось применить промокод', 'error');
      }
    } catch (error: any) {
      console.error('Failed to apply promo code:', error);
      hapticNotification('error');
      showToast(error.message || 'Ошибка применения промокода', 'error');
    } finally {
      setApplying(false);
    }
  };

  const handleInputChange = (value: string) => {
    setPromoCode(value.toUpperCase());
    setValidationResult(null);
  };

  const getDiscountText = (result: PromoCodeResponse): string => {
    if (result.discountType === 'percentage') {
      return `${result.discountValue}% скидка`;
    }
    return `${result.discountValue}₽ скидка`;
  };

  return (
    <div className="min-h-screen bg-background-primary pb-20">
      {/* Background */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary-main rounded-full filter blur-[128px] opacity-20 pointer-events-none" />

      {/* Main container */}
      <div className="max-w-[448px] mx-auto p-4 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="text-center pt-2 pb-4">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Промокод</h1>
          <p className="text-text-secondary">Введите промокод для получения скидки</p>
        </div>

        {/* Promo Code Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>Промокод</CardTitle>
            <CardDescription>
              Введите код и нажмите "Проверить"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input */}
            <div className="relative">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="PROMO2024"
                maxLength={20}
                className={cn(
                  'w-full px-4 py-4 bg-background-tertiary rounded-xl text-text-primary text-lg font-mono uppercase',
                  'border-2 transition-colors focus:outline-none',
                  validationResult?.valid
                    ? 'border-status-success'
                    : validationResult && !validationResult.valid
                    ? 'border-status-error'
                    : 'border-transparent focus:border-primary-main'
                )}
                disabled={validating || applying}
              />
              
              {validationResult && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {validationResult.valid ? (
                    <svg className="w-6 h-6 text-status-success" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-status-error" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}
            </div>

            {/* Validation Result */}
            {validationResult && (
              <Card className={cn(
                'border-2',
                validationResult.valid
                  ? 'border-status-success/30 bg-status-success/5'
                  : 'border-status-error/30 bg-status-error/5'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      validationResult.valid ? 'bg-status-success/20' : 'bg-status-error/20'
                    )}>
                      {validationResult.valid ? (
                        <svg className="w-5 h-5 text-status-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={cn(
                        'font-semibold mb-1',
                        validationResult.valid ? 'text-status-success' : 'text-status-error'
                      )}>
                        {validationResult.valid ? 'Промокод действителен!' : 'Промокод недействителен'}
                      </h4>
                      {validationResult.valid && (
                        <p className="text-text-primary font-semibold">
                          {getDiscountText(validationResult)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleValidate}
                disabled={!promoCode.trim() || validating || applying}
                variant="secondary"
                className="flex-1"
                size="lg"
              >
                {validating ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    Проверка...
                  </>
                ) : (
                  'Проверить'
                )}
              </Button>

              <Button
                onClick={handleApply}
                disabled={!promoCode.trim() || !validationResult?.valid || applying}
                className="flex-1"
                size="lg"
              >
                {applying ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    Применение...
                  </>
                ) : (
                  'Применить'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Как получить промокод?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-main/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary mb-1">
                  Реферальная программа
                </h4>
                <p className="text-text-secondary text-sm">
                  Приглашайте друзей и получайте бонусы на баланс
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-main/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary mb-1">
                  Акции и рассылки
                </h4>
                <p className="text-text-secondary text-sm">
                  Следите за новостями в нашем Telegram канале
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-main/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary mb-1">
                  Подарки от партнёров
                </h4>
                <p className="text-text-secondary text-sm">
                  Получайте промокоды от наших партнёров
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="border-primary-main/30 bg-primary-main/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-main/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary mb-1">Важно!</h4>
                <p className="text-text-secondary text-sm">
                  Промокоды чувствительны к регистру. Вводите код точно так, как он был предоставлен.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

