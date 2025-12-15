'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { tokenStorage, userStorage } from '@/lib/storage';
import TelegramBotLogin from '@/components/TelegramBotLogin';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already authenticated
    if (isAuthenticated()) {
      router.push('/web/dashboard');
      return;
    }
  }, [router]);

  // Handle successful login via bot
  const handleLoginSuccess = (data: {
    accessToken: string;
    refreshToken: string;
    user: any;
  }) => {
    console.log('[Login] Bot login successful', data.user);

    // Store tokens
    tokenStorage.setTokens(data.accessToken, data.refreshToken);

    // Store user data
    userStorage.setUser(data.user);
    if (data.user.telegramId) {
      userStorage.setTelegramId(data.user.telegramId);
    }

    // Redirect to dashboard
    router.push('/web/dashboard');
  };

  // Handle login error
  const handleLoginError = (errorMessage: string) => {
    console.error('[Login] Bot login error:', errorMessage);
    setError(errorMessage);
  };


  // Handle dev login
  const handleDevLogin = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/auth/dev/login`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Dev login failed');
      }
      
      const data = await response.json();
      handleLoginSuccess(data);
    } catch (err: any) {
      handleLoginError(err.message);
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

            {/* Telegram Bot Login */}
            <div className="mb-8">
              <TelegramBotLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
              />
            </div>
            
            {/* Dev Login Button (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-8">
                <button
                  onClick={handleDevLogin}
                  className="w-full flex items-center justify-center gap-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all duration-200"
                >
                  <span className="text-xl">🛠️</span>
                  <span>Быстрый вход (Dev)</span>
                </button>
              </div>
            )}

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

    </div>
  );
}
