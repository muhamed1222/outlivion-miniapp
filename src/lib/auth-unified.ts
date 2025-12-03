/**
 * Unified Authentication Module
 * Работает для Telegram Mini App и Web Portal
 */

import { tokenStorage, userStorage } from './storage';
import { isTelegramEnvironment } from './utils/environment';
import { authApi, User } from './api';

// =========================
// Type Definitions
// =========================

export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

export interface AuthResponse {
  token: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user: User;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

// =========================
// Core Auth Functions
// =========================

/**
 * Login with Telegram (Mini App)
 * Uses initData from Telegram WebApp
 */
export async function loginWithTelegramInitData(initData: string): Promise<LoginResult> {
  try {
    // Validate initData format
    if (!initData || initData.trim().length === 0) {
      return { success: false, error: 'Invalid initData' };
    }

    // Send initData to backend for validation
    const response = await authApi.loginWithTelegram({
      initData,
    } as any);

    // Store tokens
    const accessToken = response.accessToken || response.token;
    const refreshToken = response.refreshToken;

    if (!accessToken) {
      return { success: false, error: 'No access token received' };
    }

    tokenStorage.setAccessToken(accessToken);
    
    if (refreshToken) {
      tokenStorage.setRefreshToken(refreshToken);
    }

    // Store user data
    if (response.user) {
      userStorage.setUser(response.user);
      if (response.user.telegramId) {
        userStorage.setTelegramId(response.user.telegramId);
      }
    }

    return { success: true, user: response.user };
  } catch (error: any) {
    console.error('Login with Telegram initData failed:', error);
    return { 
      success: false, 
      error: error.message || 'Ошибка авторизации через Telegram' 
    };
  }
}

/**
 * Login with Telegram Widget (Web Portal)
 * Uses data from Telegram Login Widget
 */
export async function loginWithTelegramWidget(data: TelegramAuthData): Promise<LoginResult> {
  try {
    // Validate required fields
    if (!data.id || !data.auth_date || !data.hash) {
      return { success: false, error: 'Invalid Telegram auth data' };
    }

    // Send to backend for validation
    const response = await authApi.loginWithTelegram(data);

    // Store tokens
    const accessToken = response.accessToken || response.token;
    const refreshToken = response.refreshToken;

    if (!accessToken) {
      return { success: false, error: 'No access token received' };
    }

    tokenStorage.setTokens(accessToken, refreshToken || '');

    // Store user data
    if (response.user) {
      userStorage.setUser(response.user);
      if (response.user.telegramId) {
        userStorage.setTelegramId(response.user.telegramId);
      }
    }

    return { success: true, user: response.user };
  } catch (error: any) {
    console.error('Login with Telegram Widget failed:', error);
    return { 
      success: false, 
      error: error.message || 'Ошибка авторизации через Telegram' 
    };
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const accessToken = tokenStorage.getAccessToken();
  return !!accessToken;
}

/**
 * Get current user from storage
 */
export function getCurrentUser(): User | null {
  return userStorage.getUser();
}

/**
 * Get telegram ID from storage
 */
export function getTelegramId(): string | null {
  return userStorage.getTelegramId();
}

/**
 * Logout - clear all auth data
 */
export function logout(): void {
  // Clear tokens
  tokenStorage.clearAll();
  
  // Clear user data
  userStorage.clearUser();

  // Redirect to login based on environment
  if (typeof window !== 'undefined') {
    const loginPath = isTelegramEnvironment() ? '/telegram' : '/web/login';
    window.location.href = loginPath;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = tokenStorage.getRefreshToken();
    const telegramId = userStorage.getTelegramId();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Call backend to refresh token
    const response = await authApi.refreshToken();

    // Store new tokens
    const newAccessToken = response.accessToken || response.token;
    const newRefreshToken = response.refreshToken;

    if (!newAccessToken) {
      throw new Error('No access token received');
    }

    tokenStorage.setAccessToken(newAccessToken);
    
    if (newRefreshToken) {
      tokenStorage.setRefreshToken(newRefreshToken);
    }

    return newAccessToken;
  } catch (error: any) {
    console.error('Failed to refresh access token:', error);
    
    // If refresh failed, logout
    logout();
    
    return null;
  }
}

/**
 * Initialize auth from storage (call on app start)
 */
export function initializeAuth(): void {
  // Check if we have valid tokens
  const accessToken = tokenStorage.getAccessToken();
  
  if (!accessToken) {
    // No token, not authenticated
    return;
  }

  // Token exists, try to fetch user data if not in storage
  const user = userStorage.getUser();
  
  if (!user) {
    // Token exists but no user data - fetch from API
    // This will be handled by the page components
    console.log('Auth initialized with token but no user data');
  }
}

/**
 * Validate Telegram initData (client-side basic check)
 * Real validation happens on backend
 */
export function validateTelegramInitData(initData: string): boolean {
  if (!initData || typeof initData !== 'string') {
    return false;
  }

  // Basic format check
  try {
    const params = new URLSearchParams(initData);
    
    // Must have hash
    if (!params.get('hash')) {
      return false;
    }

    // Must have auth_date
    if (!params.get('auth_date')) {
      return false;
    }

    // Must have user data
    const userParam = params.get('user');
    if (!userParam) {
      return false;
    }

    // Try to parse user data
    JSON.parse(userParam);

    return true;
  } catch {
    return false;
  }
}

/**
 * Auto-login for Telegram Mini App
 * Вызывается при первом открытии Mini App
 */
export async function autoLoginTelegramMiniApp(): Promise<LoginResult> {
  try {
    // Get initData from Telegram WebApp
    if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
      return { success: false, error: 'Not in Telegram environment' };
    }

    const initData = window.Telegram.WebApp.initData;

    if (!initData) {
      return { success: false, error: 'No initData available' };
    }

    // Validate format
    if (!validateTelegramInitData(initData)) {
      return { success: false, error: 'Invalid initData format' };
    }

    // Login with initData
    return await loginWithTelegramInitData(initData);
  } catch (error: any) {
    console.error('Auto-login failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if token is expired (basic check)
 * Real validation happens on backend
 */
export function isTokenExpired(token: string): boolean {
  if (!token) return true;

  try {
    // Decode JWT (basic - only reads payload, doesn't verify)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;

    if (!exp) return false; // No expiration in token

    // Check if expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    return exp < (now + 300);
  } catch {
    return true; // If can't decode, consider expired
  }
}

// Export all functions
export const auth = {
  loginWithTelegramInitData,
  loginWithTelegramWidget,
  autoLoginTelegramMiniApp,
  isAuthenticated,
  getCurrentUser,
  getTelegramId,
  logout,
  refreshAccessToken,
  validateTelegramInitData,
  isTokenExpired,
  initializeAuth,
};

export default auth;

