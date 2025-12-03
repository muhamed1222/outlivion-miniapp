import Cookies from 'js-cookie';
import api from './api';

export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Авторизация через Telegram
 */
export async function loginWithTelegram(data: TelegramAuthData): Promise<AuthResponse> {
  const response = await api.post('/auth/telegram', data);
  const { token, user } = response.data;
  
  // Сохраняем токен в cookies
  Cookies.set('token', token, { expires: 7 }); // 7 дней
  
  return { token, user };
}

/**
 * Выход из системы
 */
export function logout() {
  Cookies.remove('token');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/**
 * Проверяет, авторизован ли пользователь
 */
export function isAuthenticated(): boolean {
  return !!Cookies.get('token');
}

/**
 * Получает токен из cookies
 */
export function getToken(): string | undefined {
  return Cookies.get('token');
}


