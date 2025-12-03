/**
 * Unified Storage Adapter
 * Автоматически использует localStorage (Telegram) или cookies (Web)
 * в зависимости от environment
 */

import Cookies from 'js-cookie';
import { isTelegramEnvironment } from './utils/environment';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string, options?: StorageOptions): void;
  removeItem(key: string): void;
  clear(): void;
}

export interface StorageOptions {
  expires?: number; // days
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * LocalStorage Adapter (для Telegram Mini App)
 */
class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string, options?: StorageOptions): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to set localStorage item:', error);
    }
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove localStorage item:', error);
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      // Удаляем только auth-related items
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token'); // Legacy
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('telegramId');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}

/**
 * Cookie Adapter (для Web Portal)
 */
class CookieAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return Cookies.get(key) || null;
  }

  setItem(key: string, value: string, options?: StorageOptions): void {
    if (typeof window === 'undefined') return;
    
    const cookieOptions: Cookies.CookieAttributes = {
      expires: options?.expires || 7, // default 7 days
      secure: options?.secure !== false && process.env.NODE_ENV === 'production',
      sameSite: options?.sameSite || 'strict',
    };

    Cookies.set(key, value, cookieOptions);
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    Cookies.remove(key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    // Удаляем только auth-related cookies
    Cookies.remove('accessToken');
    Cookies.remove('token'); // Legacy
    Cookies.remove('refreshToken');
    Cookies.remove('user');
    Cookies.remove('telegramId');
  }
}

/**
 * Get appropriate storage adapter based on environment
 */
function getStorageAdapter(): StorageAdapter {
  if (typeof window === 'undefined') {
    // SSR fallback - return dummy adapter
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  }

  // Use localStorage for Telegram, cookies for Web
  return isTelegramEnvironment() 
    ? new LocalStorageAdapter() 
    : new CookieAdapter();
}

// Export singleton instance
export const storage = getStorageAdapter();

/**
 * Convenience functions для работы с auth tokens
 */
export const tokenStorage = {
  /**
   * Get access token
   * Проверяем оба варианта: 'accessToken' и 'token' для обратной совместимости
   */
  getAccessToken(): string | null {
    return storage.getItem('accessToken') || storage.getItem('token');
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return storage.getItem('refreshToken');
  },

  /**
   * Set access token
   */
  setAccessToken(token: string): void {
    storage.setItem('accessToken', token, { 
      expires: 1, // 1 day for access token
      secure: true,
    });
  },

  /**
   * Set refresh token
   */
  setRefreshToken(token: string): void {
    storage.setItem('refreshToken', token, { 
      expires: 7, // 7 days for refresh token
      secure: true,
    });
  },

  /**
   * Set both tokens at once
   */
  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  },

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    storage.removeItem('accessToken');
    storage.removeItem('token'); // Legacy
    storage.removeItem('refreshToken');
  },

  /**
   * Clear all auth data
   */
  clearAll(): void {
    storage.clear();
    // Also clear legacy token
    storage.removeItem('token');
  },
};

/**
 * User data storage
 */
export const userStorage = {
  /**
   * Get current user data
   */
  getUser(): any | null {
    const userData = storage.getItem('user');
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  },

  /**
   * Set user data
   */
  setUser(user: any): void {
    storage.setItem('user', JSON.stringify(user));
  },

  /**
   * Clear user data
   */
  clearUser(): void {
    storage.removeItem('user');
  },

  /**
   * Get telegram ID
   */
  getTelegramId(): string | null {
    return storage.getItem('telegramId');
  },

  /**
   * Set telegram ID
   */
  setTelegramId(telegramId: string): void {
    storage.setItem('telegramId', telegramId);
  },
};

