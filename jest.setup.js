// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock Telegram WebApp for testing
global.window = global.window || {}

global.window.Telegram = {
  WebApp: {
    initData: 'mock_init_data_for_testing',
    initDataUnsafe: {
      user: {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'ru',
      },
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'mock_hash_for_testing',
    },
    version: '6.0',
    platform: 'unknown',
    colorScheme: 'dark',
    themeParams: {
      bg_color: '#000000',
      text_color: '#ffffff',
      hint_color: '#aaaaaa',
      link_color: '#FF6B35',
      button_color: '#FF6B35',
      button_text_color: '#ffffff',
    },
    isExpanded: false,
    viewportHeight: 667,
    viewportStableHeight: 667,
    headerColor: '#000000',
    backgroundColor: '#000000',
    isClosingConfirmationEnabled: false,
    
    // Methods
    ready: jest.fn(),
    expand: jest.fn(),
    close: jest.fn(),
    enableClosingConfirmation: jest.fn(),
    disableClosingConfirmation: jest.fn(),
    
    // MainButton
    MainButton: {
      text: '',
      color: '#FF6B35',
      textColor: '#ffffff',
      isVisible: false,
      isActive: true,
      isProgressVisible: false,
      setText: jest.fn(),
      onClick: jest.fn(),
      offClick: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
      enable: jest.fn(),
      disable: jest.fn(),
      showProgress: jest.fn(),
      hideProgress: jest.fn(),
      setParams: jest.fn(),
    },
    
    // BackButton
    BackButton: {
      isVisible: false,
      onClick: jest.fn(),
      offClick: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
    },
    
    // HapticFeedback
    HapticFeedback: {
      impactOccurred: jest.fn(),
      notificationOccurred: jest.fn(),
      selectionChanged: jest.fn(),
    },
    
    // Other methods
    openLink: jest.fn(),
    openTelegramLink: jest.fn(),
    showPopup: jest.fn(),
    showAlert: jest.fn(),
    showConfirm: jest.fn(),
    sendData: jest.fn(),
    switchInlineQuery: jest.fn(),
  },
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/telegram',
  }),
  usePathname: () => '/telegram',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'
process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME = 'outlivionbot'
process.env.NODE_ENV = 'test'

