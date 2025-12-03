'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithTelegramWidget, isAuthenticated, TelegramAuthData } from '@/lib/auth';
import TelegramLoginButton from '@/components/TelegramLoginButton';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bot configuration
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'outlivionbot';

  useEffect(() => {
    // Check if already authenticated
    if (isAuthenticated()) {
      router.push('/web/dashboard');
      return;
    }
  }, [router]);

  // Handle Telegram authentication
  const handleTelegramAuth = async (user: TelegramAuthData) => {
    console.log('[Login] Telegram auth callback triggered', user);
    setLoading(true);
    setError(null);

    try {
      const result = await loginWithTelegramWidget(user);
      
      if (result.success) {
        console.log('[Login] Login successful, redirecting to dashboard');
        router.push('/web/dashboard');
      } else {
        console.error('[Login] Login failed:', result.error);
        setError(result.error || 'Ошибка авторизации');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[Login] Login error:', err);
      setError(err.message || 'Ошибка авторизации');
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-black flex justify-center">
        {/* Gradient background - orange blur top left */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 0% 0%, rgba(245, 81, 40, 0.25) 0%, transparent 40%)',
          }}
        />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-[448px] flex items-center px-4 py-8">
          
          {/* Login form */}
          <div className="w-full">
            {/* Logo */}
            <div className="mb-12">
              <h1 className="text-2xl font-bold text-white tracking-tight">Outlivion</h1>
            </div>

            {/* Welcome text */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">С возвращением</h2>
              <p className="text-neutral-400 text-base">
                Войдите через Telegram для доступа к личному кабинету VPN
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Telegram Login Widget */}
            <div className="mb-8">
              <TelegramLoginButton
                botUsername={botUsername}
                onAuth={handleTelegramAuth}
                buttonSize="large"
                cornerRadius={12}
                requestWriteAccess={true}
                lang="ru"
              />
              
              {/* Helper text for development */}
              {process.env.NODE_ENV === 'development' && (
                <p className="mt-3 text-xs text-neutral-500 text-center">
                  Dev: Бот @{botUsername}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-black text-neutral-500">или</span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-[#F55128]/20 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-[#F55128]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-neutral-300 text-xs text-center">Безопасно</span>
              </div>
              
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-[#F55128]/20 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-[#F55128]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-neutral-300 text-xs text-center">Быстро</span>
              </div>
              
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-[#F55128]/20 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-[#F55128]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                </div>
                <span className="text-neutral-300 text-xs text-center">Глобально</span>
              </div>
            </div>

            {/* Info text */}
            <p className="text-neutral-500 text-sm text-center">
              Нет аккаунта? При первом входе он создастся автоматически
            </p>
          </div>
        </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 flex items-center justify-center gap-4 text-neutral-600 text-sm max-w-[448px] mx-auto">
        <span>Русский</span>
        <span className="text-neutral-700">•</span>
        <span>Политика конфиденциальности</span>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#F55128] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-medium">Выполняется вход...</p>
          </div>
        </div>
      )}
    </div>
  );
}
