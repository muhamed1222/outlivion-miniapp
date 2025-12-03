/**
 * Telegram Bot Deep-Link Authentication Handler
 * Handles /start login_<TOKEN> flow
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ConfirmLoginParams {
  token: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

/**
 * Confirm login via Telegram bot
 * Called when user clicks /start login_<TOKEN>
 */
export async function confirmBotLogin(params: ConfirmLoginParams): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${API_URL}/auth/bot/confirm-login`, params, {
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Bot Deep-Link Auth] Confirm login failed:', error);
    
    if (error.response?.data) {
      return {
        ok: false,
        error: error.response.data.error || 'Failed to confirm login',
      };
    }

    return {
      ok: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Parse /start command to extract login token
 * Returns token if valid login command, null otherwise
 */
export function parseLoginCommand(text: string): string | null {
  // Check if command is /start login_<TOKEN>
  const match = text.match(/^\/start login_([a-f0-9]+)$/i);
  
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Get success message for user after login confirmation
 */
export function getLoginConfirmedMessage(firstName?: string): string {
  const name = firstName || 'пользователь';
  
  return `✅ **Авторизация подтверждена!**

Привет, ${name}! Вы успешно вошли в свой аккаунт.

🌐 Вернитесь на сайт, чтобы продолжить.

Если окно не закрылось автоматически, просто вернитесь на вкладку с сайтом.`;
}

/**
 * Get error message for failed login
 */
export function getLoginErrorMessage(error?: string): string {
  if (error?.includes('expired')) {
    return `❌ **Ссылка для входа истекла**

Срок действия ссылки для авторизации истёк (5 минут).

Пожалуйста, вернитесь на сайт и запросите новую ссылку для входа.`;
  }

  if (error?.includes('not found')) {
    return `❌ **Ссылка недействительна**

Ссылка для входа не найдена или уже была использована.

Пожалуйста, вернитесь на сайт и запросите новую ссылку.`;
  }

  return `❌ **Ошибка авторизации**

Не удалось подтвердить вход: ${error || 'неизвестная ошибка'}

Попробуйте запросить новую ссылку на сайте.`;
}

