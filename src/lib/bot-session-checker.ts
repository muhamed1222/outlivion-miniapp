/**
 * Bot Session Checker
 * Проверяет наличие активных login sessions для пользователя
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Check if user has pending login session
 * Returns the token if found, null otherwise
 */
export async function checkPendingLoginSession(telegramId: string): Promise<string | null> {
  try {
    // Note: Нужен специальный endpoint на backend для проверки
    // Пока возвращаем null
    // TODO: Добавить GET /auth/bot/check-pending-session?telegramId=XXX
    return null;
  } catch (error) {
    console.error('[Bot Session Checker] Error:', error);
    return null;
  }
}

/**
 * Get inline keyboard for login confirmation
 */
export function getLoginConfirmationKeyboard(token: string) {
  return {
    inline_keyboard: [
      [
        {
          text: '✅ Подтвердить вход',
          callback_data: `confirm_login_${token}`,
        },
      ],
      [
        {
          text: '❌ Отменить',
          callback_data: 'cancel_login',
        },
      ],
    ],
  };
}

/**
 * Get message for login confirmation
 */
export function getLoginConfirmationMessage(): string {
  return `🔐 **Подтверждение входа в Outlivion Web Portal**

Нажмите кнопку ниже для подтверждения входа на сайте.

⏱️ Ссылка действительна 5 минут.`;
}

