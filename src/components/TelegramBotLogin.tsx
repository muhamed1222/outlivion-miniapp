/**
 * Telegram Bot Deep-Link Login Component
 * Implements login via /start login_<TOKEN> flow
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'outlivionbot';
const POLL_INTERVAL = 2000; // Poll every 2 seconds
const MAX_POLL_ATTEMPTS = 150; // 150 * 2s = 5 minutes
const MAX_RETRIES = 3; // Maximum retry attempts for rate limiting
const RETRY_DELAY_BASE = 2000; // Base delay in ms (2 seconds)

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
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(0);
  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling and retry timers on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Step 1: Create login token and redirect to bot
   */
  const handleLoginClick = async () => {
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
      
      // Reset retry state on success
      setRetryCount(0);
      setRetryDelay(0);

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
      
      // Handle 429 (Rate Limit) with retry logic
      if (status === 429 && retryCount < MAX_RETRIES) {
        const currentRetry = retryCount + 1;
        
        // Get Retry-After header if available
        const retryAfter = error.response?.headers['retry-after'];
        const delay = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : RETRY_DELAY_BASE * Math.pow(2, retryCount); // Exponential backoff: 2s, 4s, 8s
        
        console.log(`[Bot Login] Rate limited. Retrying in ${delay}ms (attempt ${currentRetry}/${MAX_RETRIES})...`);
        
        setRetryCount(currentRetry);
        setRetryDelay(Math.ceil(delay / 1000)); // Convert to seconds for display
        
        // Show countdown
        const countdownInterval = setInterval(() => {
          setRetryDelay((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Retry after delay
        retryTimeoutRef.current = setTimeout(() => {
          clearInterval(countdownInterval);
          setRetryDelay(0);
          handleLoginClick();
        }, delay);
        
        return;
      }
      
      // Retry once on 500 errors (server issues)
      if (status === 500 && retryCount === 0) {
        console.log('[Bot Login] Retrying after 500 error...');
        setRetryCount(1);
        setTimeout(() => {
          setRetryCount(0);
          handleLoginClick();
        }, 2000);
        return;
      }
      
      // Reset retry state
      setRetryCount(0);
      setRetryDelay(0);
      setLoading(false);
      
      // Provide user-friendly error messages
      let userMessage = 'Не удалось создать сессию входа';
      
      if (status === 500) {
        userMessage = 'Ошибка сервера. Попробуйте позже или обратитесь в поддержку.';
      } else if (status === 429) {
        userMessage = 'Слишком много попыток. Подождите 1-2 минуты и попробуйте снова.';
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
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setPolling(false);
    setLoading(false);
    setToken(null);
    setRetryCount(0);
    setRetryDelay(0);
    pollCountRef.current = 0;
  };

  return (
    <div className="space-y-4">
      {!polling && retryDelay === 0 ? (
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
      ) : retryDelay > 0 ? (
        // Retry countdown
        <div className="w-full p-6 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            
            <div className="text-center">
              <p className="text-yellow-300 font-medium mb-2">
                Слишком много попыток
              </p>
              <p className="text-yellow-400 text-sm mb-1">
                Повторная попытка через
              </p>
              <p className="text-yellow-500 text-2xl font-bold mb-4">
                {retryDelay} сек
              </p>
              <p className="text-yellow-500/70 text-xs mb-4">
                Попытка {retryCount}/{MAX_RETRIES}
              </p>
              
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-yellow-400 hover:text-yellow-300 border border-yellow-500/30 hover:border-yellow-500/50 rounded-lg transition-colors"
              >
                Отменить
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Polling state - waiting for confirmation
        <div className="w-full p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#F55128] border-t-transparent rounded-full animate-spin"></div>
            
            <div className="text-center">
              <p className="text-white font-medium mb-3">
                Ожидаем подтверждение в Telegram
              </p>
              
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 mb-4 text-left">
                <p className="text-neutral-300 text-sm font-medium mb-3">
                  📱 Инструкция:
                </p>
                <ol className="text-neutral-400 text-xs space-y-2.5 list-decimal list-inside">
                  <li>
                    <span className="font-semibold text-white">Откройте бота в Telegram</span>
                    <br />
                    <span className="text-neutral-500">(должен открыться автоматически в новой вкладке)</span>
                  </li>
                  <li>
                    <span className="font-semibold text-[#F55128]">⚠️ Важно:</span>
                    <br />
                    Если кнопка <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-[#F55128]">START</span> не показывается, 
                    <br />
                    <span className="font-semibold text-white">напишите боту любое сообщение:</span>
                    <br />
                    <span className="font-mono bg-neutral-800 px-2 py-1 rounded block mt-1 text-center">привет</span>
                  </li>
                  <li>
                    <span className="font-semibold text-white">Бот автоматически покажет кнопку подтверждения</span>
                    <br />
                    <span className="text-neutral-500">(может занять 1-2 секунды)</span>
                  </li>
                  <li>
                    Нажмите <span className="font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">✅ Подтвердить вход</span>
                  </li>
                </ol>
                
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-neutral-500 text-xs">
                    💡 <span className="font-semibold">Совет:</span> Если ничего не происходит, просто напишите боту любое слово
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-neutral-500 text-xs mb-4">
                <div className="w-2 h-2 bg-[#F55128] rounded-full animate-pulse"></div>
                <span>Проверка {pollCountRef.current}/{MAX_POLL_ATTEMPTS}</span>
              </div>

              <div className="flex gap-2">
                <a
                  href={token ? `https://t.me/${BOT_USERNAME}?start=login_${token}` : `https://t.me/${BOT_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm text-[#F55128] hover:text-[#e04520] border border-[#F55128]/30 hover:border-[#F55128]/50 rounded-lg transition-colors"
                >
                  🔄 Открыть бота снова
                </a>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-600 rounded-lg transition-colors"
                >
                  Отменить
                </button>
              </div>
            </div>
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

