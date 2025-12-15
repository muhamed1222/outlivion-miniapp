import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { tokenStorage } from './storage';
import { isTelegramEnvironment } from './utils/environment';
import { isTokenExpired } from './auth';

// API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 1;
const RETRY_DELAY = 1000; // 1 second base delay

// Error response interface
interface ApiErrorResponse {
  error: string;
  code?: string;
  message?: string;
  details?: string[];
}

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: string[];

  constructor(message: string, status: number, code?: string, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if refresh is in progress to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - add auth token from unified storage
api.interceptors.request.use(
  async (config) => {
    // Get access token from unified storage (localStorage or cookies)
    let token = tokenStorage.getAccessToken();
    
    // Check if token is expired or about to expire (within 5 minutes)
    if (token && isTokenExpired(token)) {
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          // Attempt to refresh the token
          const refreshToken = tokenStorage.getRefreshToken();
          
          if (!refreshToken) {
            // No refresh token, clear auth and redirect
            tokenStorage.clearAll();
            if (typeof window !== 'undefined') {
              const loginPath = isTelegramEnvironment() ? '/telegram' : '/web/login';
              window.location.href = loginPath;
            }
            return Promise.reject(new Error('No refresh token'));
          }
          
          // Call refresh endpoint
          const response = await authApi.refreshToken();
          const newToken = response.accessToken || response.token;
          
          // Store new tokens
          tokenStorage.setAccessToken(newToken);
          if (response.refreshToken) {
            tokenStorage.setRefreshToken(response.refreshToken);
          }
          
          // Update token for current request
          token = newToken;
          
          // Process queued requests
          processQueue(null, newToken);
        } catch (err) {
          // Refresh failed, clear auth
          processQueue(err, null);
          tokenStorage.clearAll();
          
          if (typeof window !== 'undefined') {
            const loginPath = isTelegramEnvironment() ? '/telegram' : '/web/login';
            window.location.href = loginPath;
          }
          
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          return config;
        }).catch((err) => {
          return Promise.reject(err);
        });
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Determine if error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }
  
  const status = error.response.status;
  
  // Retry on 5xx server errors and 429 Too Many Requests
  // Do NOT retry on 401 (Unauthorized) or 403 (Forbidden)
  return (status >= 500 || status === 429) && status !== 401 && status !== 403;
}

/**
 * Sleep for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Response interceptor - handle errors with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as any;
    
    // Initialize retry count
    config._retryCount = config._retryCount || 0;
    
    // Handle network errors
    if (!error.response) {
      // Retry network errors
      if (config._retryCount < MAX_RETRIES && isRetryableError(error)) {
        config._retryCount++;
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1);
        
        console.log(`Retrying request (${config._retryCount}/${MAX_RETRIES}) after ${delay}ms...`);
        
        await sleep(delay);
        
        return api(config);
      }
      
      throw new ApiError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    const { status, data } = error.response;
    const errorMessage = data?.error || data?.message || 'An error occurred';
    const errorCode = data?.code;
    const errorDetails = data?.details;

    // Retry on 5xx errors or 429 (rate limit)
    if (isRetryableError(error) && config._retryCount < MAX_RETRIES) {
      config._retryCount++;
      
      // For 429, use Retry-After header if available
      const retryAfter = error.response.headers['retry-after'];
      const delay = retryAfter 
        ? parseInt(retryAfter) * 1000 
        : RETRY_DELAY * Math.pow(2, config._retryCount - 1);
      
      console.log(`Retrying request (${config._retryCount}/${MAX_RETRIES}) after ${delay}ms... Status: ${status}`);
      
      await sleep(delay);
      
      return api(config);
    }

    // Handle 401 - Unauthorized (don't retry)
    if (status === 401) {
      // Clear tokens from unified storage
      tokenStorage.clearAll();
      
      // Redirect to login based on environment
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        
        // For Telegram, redirect to home (which has auto-login)
        // For Web, redirect to login page
        if (isTelegramEnvironment()) {
          // Don't redirect if already on /telegram home
          if (currentPath !== '/telegram') {
            window.location.href = '/telegram';
          }
        } else {
          // Don't redirect if already on login
          if (!currentPath.includes('/login')) {
            window.location.href = `/web/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
      }
    }

    throw new ApiError(errorMessage, status, errorCode, errorDetails);
  }
);

// Type-safe API methods
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.get<T>(url, config);
    return response.data;
  },

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.put<T>(url, data, config);
    return response.data;
  },

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.delete<T>(url, config);
    return response.data;
  },
};

// ====================
// API Type Definitions
// ====================

export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  balance?: number;
  createdAt?: string;
  isNewUser?: boolean;
}

export interface Subscription {
  id?: string;
  plan?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  daysRemaining?: number;
  isExpired?: boolean;
  message?: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface Server {
  id: string;
  name: string;
  location?: string;
  country?: string;
  load?: number;
  maxUsers?: number;
  currentUsers?: number;
  isActive: boolean;
}

export interface ServerConfig {
  id: string;
  serverId: string;
  serverName?: string;
  serverLocation?: string;
  serverCountry?: string;
  vlessConfig: string;
  qrCode?: string;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface CreatePaymentResponse {
  paymentId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
}

export interface PromoCodeResponse {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  valid: boolean;
}

// ====================
// API Functions
// ====================

export const authApi = {
  /**
   * Login with Telegram
   * Supports both Widget data and Mini App initData
   */
  async loginWithTelegram(data: {
    // Option 1: Mini App initData
    initData?: string;
    // Option 2: Widget data
    id?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date?: string;
    hash?: string;
    // Common
    referralId?: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/telegram', data);
    
    // Note: Token storage is handled by unified auth module (src/lib/auth.ts)
    // This function only returns the response, storage happens in auth.ts
    
    return response;
  },

  /**
   * Refresh access token
   * Note: Token storage is handled by unified auth module
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = tokenStorage.getRefreshToken();
    const telegramId = tokenStorage.getAccessToken() 
      ? JSON.parse(atob(tokenStorage.getAccessToken()!.split('.')[1])).telegramId
      : null;
    
    if (!refreshToken) {
      throw new ApiError('No refresh token available', 401, 'NO_REFRESH_TOKEN');
    }
    
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
      telegramId,
    });
    
    // Token storage is handled by auth.ts refreshAccessToken function
    
    return response;
  },

  /**
   * Logout
   * Note: Logout logic is handled by unified auth module (src/lib/auth.ts)
   */
  logout(): void {
    // Clear tokens using unified storage
    tokenStorage.clearAll();
    
    if (typeof window !== 'undefined') {
      const loginPath = isTelegramEnvironment() ? '/telegram' : '/web/login';
      window.location.href = loginPath;
    }
  },
};

export const userApi = {
  /**
   * Get current user
   */
  async getUser(): Promise<User> {
    const user = await apiClient.get<User>('/user');
    
    // Ensure default values for optional fields
    return {
      ...user,
      balance: user.balance ?? 0,
      username: user.username ?? undefined,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      photoUrl: user.photoUrl ?? undefined,
    };
  },

  /**
   * Get user subscription
   */
  async getSubscription(): Promise<Subscription> {
    try {
      const subscription = await apiClient.get<Subscription>('/user/subscription');
      
      // Handle "no subscription" response
      if (!subscription || subscription.status === 'none') {
        return {
          status: 'none',
          message: 'No active subscription',
          isExpired: true,
          daysRemaining: 0,
        };
      }
      
      return {
        ...subscription,
        daysRemaining: subscription.daysRemaining ?? 0,
        isExpired: subscription.isExpired ?? true,
      };
    } catch (error: any) {
      // If 404 or no subscription found, return default
      if (error.status === 404) {
        return {
          status: 'none',
          message: 'No active subscription',
          isExpired: true,
          daysRemaining: 0,
        };
      }
      throw error;
    }
  },

  /**
   * Get payment history
   */
  async getPayments(): Promise<Payment[]> {
    try {
      const payments = await apiClient.get<Payment[]>('/user/payments');
      return payments || [];
    } catch (error: any) {
      // If 404 or no payments, return empty array
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Get user's server configs
   */
  async getServers(): Promise<ServerConfig[]> {
    try {
      const servers = await apiClient.get<ServerConfig[]>('/user/servers');
      return servers || [];
    } catch (error: any) {
      // If 404 or no servers, return empty array
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  },
};

export const serverApi = {
  /**
   * Get all available servers
   */
  async getServers(): Promise<Server[]> {
    return apiClient.get<Server[]>('/servers');
  },

  /**
   * Get or create config for a server
   */
  async getServerConfig(serverId: string): Promise<ServerConfig> {
    return apiClient.get<ServerConfig>(`/servers/${serverId}/config`);
  },

  /**
   * Delete config for a server
   */
  async deleteServerConfig(serverId: string): Promise<void> {
    return apiClient.delete(`/servers/${serverId}/config`);
  },
};

export interface Tariff {
  id: string;
  name: string;
  duration: number; // days
  price: number;
  pricePerMonth: number;
  discount: number; // percentage
  features: string[];
  popular: boolean;
}

export interface TariffResponse {
  tariffs: Tariff[];
  currency: string;
  defaultDevices: number;
  maxDevices: number;
}

export const billingApi = {
  /**
   * Get available tariffs
   */
  async getTariffs(): Promise<TariffResponse> {
    return apiClient.get<TariffResponse>('/billing/tariffs');
  },
  
  /**
   * Create payment
   */
  async createPayment(params: {
    plan: string;
    devices?: number;
    promoCode?: string;
  }): Promise<CreatePaymentResponse> {
    return apiClient.post<CreatePaymentResponse>('/billing/create', params);
  },
};

export const promoApi = {
  /**
   * Apply promo code
   */
  async applyPromoCode(code: string): Promise<PromoCodeResponse> {
    return apiClient.post<PromoCodeResponse>('/promo/apply', { code });
  },
};

// Export default for backwards compatibility
export default api;
