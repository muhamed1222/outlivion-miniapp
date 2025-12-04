/**
 * Telegram Bot Deep-Link Login Component
 * Implements login via /start login_<TOKEN> flow
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const POLL_INTERVAL = 2000; // Poll every 2 seconds
const MAX_POLL_ATTEMPTS = 150; // 150 * 2s = 5 minutes

interface TelegramBotLoginProps {
  onSuccess: (data: {
    accessToken: string;
    refreshToken: string;
    user: any;
  }) => void;
  onError: (error: string) => void;
}

export default function TelegramBotLogin({ onSuccess, onError }: TelegramBotLoginProps) {
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  /**
   * Step 1: Create login token and redirect to bot
   */
  const handleLoginClick = async (retryCount = 0) => {
    setLoading(true);
    setPolling(false);
    pollCountRef.current = 0;

    try {
      // Request login token from backend
      const response = await axios.post(`${API_URL}/auth/bot/create-login-token`, {
        deviceInfo: navigator.userAgent,
      });
      
      const { token: loginToken, botUrl } = response.data;

      console.log('[Bot Login] Token created:', loginToken);
      console.log('[Bot Login] Bot URL:', botUrl);

      setToken(loginToken);

      // Open bot in new window/tab
      window.open(botUrl, '_blank');

      // Start polling for login status
      startPolling(loginToken);
    } catch (error: any) {
      console.error('[Bot Login] Failed to create token:', error);
      
      const status = error.response?.status;
      const errorData = error.response?.data;
      const errorMessage = errorData?.error || error.message;
      
      // Log detailed error for debugging
      console.error('[Bot Login] Error details:', {
        status,
        error: errorMessage,
        details: errorData?.details,
        apiUrl: API_URL,
      });
      
      // Retry once on 500 errors (server issues)
      if (status === 500 && retryCount === 0) {
        console.log('[Bot Login] Retrying after 500 error...');
        setTimeout(() => handleLoginClick(1), 2000);
        return;
      }
      
      setLoading(false);
      
      // Provide user-friendly error messages
      let userMessage = 'Не удалось создать сессию входа';
      
      if (status === 500) {
        userMessage = 'Ошибка сервера. Попробуйте позже или обратитесь в поддержку.';
      } else if (status === 429) {
        userMessage = 'Слишком много попыток. Подождите немного и попробуйте снова.';
      } else if (status === 404) {
        userMessage = 'API недоступен. Проверьте настройки или обратитесь в поддержку.';
      } else if (!error.response) {
        userMessage = 'Нет связи с сервером. Проверьте интернет-соединение.';
      } else {
        userMessage = errorMessage || userMessage;
      }
      
      onError(userMessage);
    }
  };

  /**
   * Step 2: Poll backend to check if user confirmed login in bot
   */
  const startPolling = (loginToken: string) => {
    setPolling(true);
    pollCountRef.current = 0;

    console.log('[Bot Login] Started polling for token:', loginToken);

    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      try {
        const response = await axios.get(
          `${API_URL}/auth/bot/check-login?token=${loginToken}`
        );

        const { status, accessToken, refreshToken, user, message } = response.data;

        console.log('[Bot Login] Poll result:', { status, attempt: pollCountRef.current });

        if (status === 'approved') {
          // Login successful!
          console.log('[Bot Login] Login approved!', { user });

          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }

          setPolling(false);
          setLoading(false);

          onSuccess({
            accessToken,
            refreshToken,
            user,
          });
        } else if (status === 'expired' || status === 'not_found') {
          // Session expired or not found
          console.warn('[Bot Login] Session expired or not found');

          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }

          setPolling(false);
          setLoading(false);

          onError(message || 'Login session expired. Please try again.');
        } else if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
          // Timeout - stop polling
          console.warn('[Bot Login] Polling timeout');

          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }

          setPolling(false);
          setLoading(false);

          onError('Login timeout. Please try again.');
        }
        // else: still pending, continue polling
      } catch (error: any) {
        console.error('[Bot Login] Poll error:', error);

        // Don't stop on network errors, keep polling
        if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }

          setPolling(false);
          setLoading(false);

          onError('Failed to check login status. Please try again.');
        }
      }
    }, POLL_INTERVAL);
  };

  /**
   * Cancel login attempt
   */
  const handleCancel = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    setPolling(false);
    setLoading(false);
    setToken(null);
    pollCountRef.current = 0;
  };

  return (
    <div className="space-y-4">
      {!polling ? (
        // Login button
        <button
          onClick={handleLoginClick}
          disabled={loading}
          className="w-full py-4 px-6 bg-[#F55128] hover:bg-[#e04520] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
          </svg>
          {loading ? 'Открываем бота...' : 'Войти через Telegram'}
        </button>
      ) : (
        // Polling state - waiting for confirmation
        <div className="w-full p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#F55128] border-t-transparent rounded-full animate-spin"></div>
            
            <div className="text-center">
              <p className="text-white font-medium mb-2">
                Ожидаем подтверждение в Telegram
              </p>
              <p className="text-neutral-400 text-sm mb-1">
                Откройте бота и нажмите <span className="font-semibold text-[#F55128]">Start</span>
              </p>
              <p className="text-neutral-500 text-xs mb-4">
                для подтверждения входа
              </p>
              <div className="flex items-center justify-center gap-2 text-neutral-500 text-xs">
                <div className="w-2 h-2 bg-[#F55128] rounded-full animate-pulse"></div>
                <span>Проверка {pollCountRef.current}/{MAX_POLL_ATTEMPTS}</span>
              </div>
            </div>

            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-600 rounded-lg transition-colors"
            >
              Отменить
            </button>
          </div>
        </div>
      )}

      {/* Development info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="space-y-2">
          {token && (
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-xs font-mono break-all">
                Token: {token}
              </p>
            </div>
          )}
          <div className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg">
            <p className="text-neutral-400 text-xs">
              <span className="font-semibold">API:</span> {API_URL}
            </p>
            <p className="text-neutral-400 text-xs mt-1">
              <span className="font-semibold">Endpoint:</span> /auth/bot/create-login-token
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

