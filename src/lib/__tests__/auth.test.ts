import {
  loginWithTelegramInitData,
  isAuthenticated,
  logout,
  isTokenExpired,
  validateTelegramInitData,
} from '../auth';
import { tokenStorage, userStorage } from '../storage';
import * as apiModule from '../api';

// Mock storage
jest.mock('../storage', () => ({
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setAccessToken: jest.fn(),
    setRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearAll: jest.fn(),
  },
  userStorage: {
    getUser: jest.fn(),
    setUser: jest.fn(),
    getTelegramId: jest.fn(),
    setTelegramId: jest.fn(),
    clearUser: jest.fn(),
  },
}));

// Mock API
jest.mock('../api', () => ({
  authApi: {
    loginWithTelegram: jest.fn(),
    refreshToken: jest.fn(),
  },
}));

describe('Auth Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  describe('validateTelegramInitData', () => {
    it('should return false for empty initData', () => {
      expect(validateTelegramInitData('')).toBe(false);
      expect(validateTelegramInitData(null as any)).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(validateTelegramInitData('invalid')).toBe(false);
    });

    it('should return true for valid initData', () => {
      const validInitData = 'user=%7B%22id%22%3A123%7D&auth_date=1234567890&hash=abcdef123456';
      expect(validateTelegramInitData(validInitData)).toBe(true);
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for empty token', () => {
      expect(isTokenExpired('')).toBe(true);
    });

    it('should return true for malformed token', () => {
      expect(isTokenExpired('invalid.token')).toBe(true);
    });

    it('should return false for valid non-expired token', () => {
      // Create a token that expires in 1 hour
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      // Create a token that expired 1 hour ago
      const payload = {
        exp: Math.floor(Date.now() / 1000) - 3600,
      };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      expect(isTokenExpired(token)).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      (tokenStorage.getAccessToken as jest.Mock).mockReturnValue('valid_token');
      
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false when no access token', () => {
      (tokenStorage.getAccessToken as jest.Mock).mockReturnValue(null);
      
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('loginWithTelegramInitData', () => {
    it('should return error for empty initData', async () => {
      const result = await loginWithTelegramInitData('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid initData');
    });

    it('should login successfully with valid initData', async () => {
      const mockUser = {
        id: 'user-123',
        telegramId: '123456',
        firstName: 'Test',
      };
      
      const mockResponse = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        user: mockUser,
      };
      
      (apiModule.authApi.loginWithTelegram as jest.Mock).mockResolvedValue(mockResponse);
      
      const result = await loginWithTelegramInitData('valid_init_data');
      
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('access_token');
      expect(tokenStorage.setRefreshToken).toHaveBeenCalledWith('refresh_token');
      expect(userStorage.setUser).toHaveBeenCalledWith(mockUser);
    });

    it('should handle API errors', async () => {
      (apiModule.authApi.loginWithTelegram as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      const result = await loginWithTelegramInitData('valid_init_data');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('logout', () => {
    it('should clear all auth data and redirect to /telegram', () => {
      // Mock Telegram environment
      (window as any).Telegram = { WebApp: {} };
      
      logout();
      
      expect(tokenStorage.clearAll).toHaveBeenCalled();
      expect(userStorage.clearUser).toHaveBeenCalled();
      expect(window.location.href).toBe('/telegram');
    });

    it('should redirect to /web/login for web environment', () => {
      // Remove Telegram mock
      delete (window as any).Telegram;
      
      logout();
      
      expect(tokenStorage.clearAll).toHaveBeenCalled();
      expect(userStorage.clearUser).toHaveBeenCalled();
      expect(window.location.href).toBe('/web/login');
    });
  });
});

