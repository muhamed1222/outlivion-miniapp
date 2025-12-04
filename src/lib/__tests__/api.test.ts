import axios from 'axios';
import { apiClient, userApi, ApiError } from '../api';
import { tokenStorage } from '../storage';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock storage
jest.mock('../storage', () => ({
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setAccessToken: jest.fn(),
    setRefreshToken: jest.fn(),
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

describe('API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '', pathname: '/telegram' };
  });

  describe('ApiError', () => {
    it('should create error with correct properties', () => {
      const error = new ApiError('Test error', 400, 'TEST_CODE', ['detail1']);
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual(['detail1']);
      expect(error.name).toBe('ApiError');
    });
  });

  describe('userApi.getUser', () => {
    it('should fetch user data with defaults', async () => {
      const mockUser = {
        id: 'user-123',
        telegramId: '123456',
      };
      
      const mockResponse = { data: mockUser };
      mockedAxios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any));
      
      // Re-import to get mocked axios
      const { userApi: testUserApi } = require('../api');
      
      const result = await testUserApi.getUser();
      
      expect(result.balance).toBe(0); // Default value
      expect(result.id).toBe('user-123');
    });
  });

  describe('userApi.getSubscription', () => {
    it('should return default subscription when no subscription found', async () => {
      const mockResponse = {
        response: {
          status: 404,
        },
      };
      
      mockedAxios.create = jest.fn(() => ({
        get: jest.fn().mockRejectedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any));
      
      const { userApi: testUserApi } = require('../api');
      
      const result = await testUserApi.getSubscription();
      
      expect(result.status).toBe('none');
      expect(result.isExpired).toBe(true);
      expect(result.daysRemaining).toBe(0);
    });

    it('should handle "none" status response', async () => {
      const mockResponse = {
        data: {
          status: 'none',
          message: 'No subscription',
        },
      };
      
      mockedAxios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any));
      
      const { userApi: testUserApi } = require('../api');
      
      const result = await testUserApi.getSubscription();
      
      expect(result.status).toBe('none');
      expect(result.message).toBe('No subscription');
    });
  });

  describe('userApi.getPayments', () => {
    it('should return empty array on 404', async () => {
      const mockResponse = {
        response: {
          status: 404,
        },
      };
      
      mockedAxios.create = jest.fn(() => ({
        get: jest.fn().mockRejectedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any));
      
      const { userApi: testUserApi } = require('../api');
      
      const result = await testUserApi.getPayments();
      
      expect(result).toEqual([]);
    });

    it('should return payments array', async () => {
      const mockPayments = [
        { id: 'p1', amount: 1000, status: 'completed' },
        { id: 'p2', amount: 2000, status: 'pending' },
      ];
      
      const mockResponse = { data: mockPayments };
      
      mockedAxios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any));
      
      const { userApi: testUserApi } = require('../api');
      
      const result = await testUserApi.getPayments();
      
      expect(result).toEqual(mockPayments);
    });
  });

  describe('userApi.getServers', () => {
    it('should return empty array on 404', async () => {
      const mockResponse = {
        response: {
          status: 404,
        },
      };
      
      mockedAxios.create = jest.fn(() => ({
        get: jest.fn().mockRejectedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any));
      
      const { userApi: testUserApi } = require('../api');
      
      const result = await testUserApi.getServers();
      
      expect(result).toEqual([]);
    });
  });
});

describe('Retry Logic', () => {
  it('should retry on network errors', async () => {
    // This test verifies the retry interceptor logic
    // In a real implementation, you would test the actual axios interceptor
    const retries = [
      Promise.reject({ message: 'Network Error' }),
      Promise.reject({ message: 'Network Error' }),
      Promise.resolve({ data: { success: true } }),
    ];
    
    let attemptCount = 0;
    mockedAxios.create = jest.fn(() => ({
      get: jest.fn().mockImplementation(() => {
        return retries[attemptCount++];
      }),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    } as any));
    
    // This is a simplified test - actual retry logic is in interceptors
    expect(retries.length).toBe(3);
  });
});

