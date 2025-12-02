'use client';

/**
 * Telegram WebApp API интеграция
 * Документация: https://core.telegram.org/bots/webapps
 */

// Типы для Telegram WebApp
interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebAppInitData {
  query_id?: string;
  user?: TelegramWebAppUser;
  receiver?: TelegramWebAppUser;
  chat?: any;
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  can_send_after?: number;
  auth_date: number;
  hash: string;
}

interface TelegramWebAppThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppInitData;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramWebAppThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  
  // Methods
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  
  // MainButton
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }) => void;
  };
  
  // BackButton
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  
  // HapticFeedback
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  
  // Other methods
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }, callback?: (button_id: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  sendData: (data: string) => void;
  switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

/**
 * Получить экземпляр Telegram WebApp
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return window.Telegram?.WebApp || null;
}

/**
 * Проверить, запущено ли приложение в Telegram
 */
export function isTelegramWebApp(): boolean {
  return !!getTelegramWebApp();
}

/**
 * Инициализировать Telegram WebApp
 */
export function initTelegramWebApp(): TelegramWebApp | null {
  const webApp = getTelegramWebApp();
  
  if (!webApp) {
    console.warn('Telegram WebApp не найден. Приложение запущено вне Telegram.');
    return null;
  }
  
  try {
    // Сообщить Telegram что приложение готово
    webApp.ready();
    
    // Развернуть приложение на весь экран
    webApp.expand();
    
    // Применить цвета темы Telegram
    applyTelegramTheme(webApp);
    
    console.log('Telegram WebApp инициализирован:', {
      version: webApp.version,
      platform: webApp.platform,
      colorScheme: webApp.colorScheme,
      user: webApp.initDataUnsafe.user,
    });
    
    return webApp;
  } catch (error) {
    console.error('Ошибка инициализации Telegram WebApp:', error);
    return null;
  }
}

/**
 * Получить данные пользователя Telegram
 */
export function getTelegramUser(): TelegramWebAppUser | null {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe.user || null;
}

/**
 * Получить initData для авторизации на бэкенде
 */
export function getTelegramInitData(): string {
  const webApp = getTelegramWebApp();
  return webApp?.initData || '';
}

/**
 * Получить start параметр из deep link
 */
export function getTelegramStartParam(): string | undefined {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe.start_param;
}

/**
 * Применить цвета темы Telegram к приложению
 */
export function applyTelegramTheme(webApp: TelegramWebApp): void {
  const theme = webApp.themeParams;
  const root = document.documentElement;
  
  if (theme.bg_color) {
    root.style.setProperty('--tg-bg-color', theme.bg_color);
  }
  
  if (theme.text_color) {
    root.style.setProperty('--tg-text-color', theme.text_color);
  }
  
  if (theme.button_color) {
    root.style.setProperty('--tg-button-color', theme.button_color);
  }
  
  if (theme.button_text_color) {
    root.style.setProperty('--tg-button-text-color', theme.button_text_color);
  }
  
  if (theme.secondary_bg_color) {
    root.style.setProperty('--tg-secondary-bg-color', theme.secondary_bg_color);
  }
}

/**
 * Показать главную кнопку Telegram
 */
export function showMainButton(
  text: string,
  onClick: () => void,
  options?: {
    color?: string;
    textColor?: string;
    isActive?: boolean;
  }
): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  
  const { MainButton } = webApp;
  
  MainButton.setText(text);
  MainButton.onClick(onClick);
  
  if (options?.color) MainButton.color = options.color;
  if (options?.textColor) MainButton.textColor = options.textColor;
  
  MainButton.show();
  
  if (options?.isActive !== undefined) {
    options.isActive ? MainButton.enable() : MainButton.disable();
  } else {
    MainButton.enable();
  }
}

/**
 * Скрыть главную кнопку Telegram
 */
export function hideMainButton(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  
  webApp.MainButton.hide();
}

/**
 * Показать кнопку "Назад" Telegram
 */
export function showBackButton(onClick: () => void): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  
  webApp.BackButton.onClick(onClick);
  webApp.BackButton.show();
}

/**
 * Скрыть кнопку "Назад" Telegram
 */
export function hideBackButton(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  
  webApp.BackButton.hide();
}

/**
 * Тактильная обратная связь - удар
 */
export function hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium'): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  
  try {
    webApp.HapticFeedback.impactOccurred(style);
  } catch (error) {
    console.warn('Haptic feedback не поддерживается:', error);
  }
}

/**
 * Тактильная обратная связь - уведомление
 */
export function hapticNotification(type: 'error' | 'success' | 'warning'): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  
  try {
    webApp.HapticFeedback.notificationOccurred(type);
  } catch (error) {
    console.warn('Haptic feedback не поддерживается:', error);
  }
}

/**
 * Тактильная обратная связь - выбор изменён
 */
export function hapticSelection(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  
  try {
    webApp.HapticFeedback.selectionChanged();
  } catch (error) {
    console.warn('Haptic feedback не поддерживается:', error);
  }
}

/**
 * Открыть внешнюю ссылку
 */
export function openLink(url: string, tryInstantView: boolean = false): void {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    window.open(url, '_blank');
    return;
  }
  
  webApp.openLink(url, { try_instant_view: tryInstantView });
}

/**
 * Открыть Telegram ссылку
 */
export function openTelegramLink(url: string): void {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    window.open(url, '_blank');
    return;
  }
  
  webApp.openTelegramLink(url);
}

/**
 * Показать всплывающее окно
 */
export function showPopup(
  message: string,
  title?: string,
  buttons?: Array<{ id: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text: string }>
): Promise<string> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    if (!webApp) {
      alert(message);
      resolve('ok');
      return;
    }
    
    webApp.showPopup(
      {
        title,
        message,
        buttons: buttons || [{ type: 'ok' }],
      },
      (buttonId) => {
        resolve(buttonId);
      }
    );
  });
}

/**
 * Показать alert
 */
export function showAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    if (!webApp) {
      alert(message);
      resolve();
      return;
    }
    
    webApp.showAlert(message, () => {
      resolve();
    });
  });
}

/**
 * Показать confirm
 */
export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const webApp = getTelegramWebApp();
    if (!webApp) {
      resolve(confirm(message));
      return;
    }
    
    webApp.showConfirm(message, (confirmed) => {
      resolve(confirmed);
    });
  });
}

/**
 * Закрыть WebApp
 */
export function closeTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  
  webApp.close();
}

/**
 * Включить подтверждение закрытия
 */
export function enableClosingConfirmation(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  
  webApp.enableClosingConfirmation();
}

/**
 * Отключить подтверждение закрытия
 */
export function disableClosingConfirmation(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  
  webApp.disableClosingConfirmation();
}

/**
 * Mock данные для разработки вне Telegram
 */
export function getMockTelegramData(): {
  initData: string;
  user: TelegramWebAppUser;
} {
  return {
    initData: 'mock_init_data_for_development',
    user: {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'ru',
    },
  };
}

/**
 * Получить данные для авторизации (реальные или mock)
 */
export function getAuthData(): {
  initData: string;
  user: TelegramWebAppUser | null;
} {
  if (isTelegramWebApp()) {
    return {
      initData: getTelegramInitData(),
      user: getTelegramUser(),
    };
  }
  
  // В режиме разработки вне Telegram возвращаем mock данные
  if (process.env.NODE_ENV === 'development') {
    const mock = getMockTelegramData();
    return {
      initData: mock.initData,
      user: mock.user,
    };
  }
  
  return {
    initData: '',
    user: null,
  };
}

export default {
  getTelegramWebApp,
  isTelegramWebApp,
  initTelegramWebApp,
  getTelegramUser,
  getTelegramInitData,
  getTelegramStartParam,
  applyTelegramTheme,
  showMainButton,
  hideMainButton,
  showBackButton,
  hideBackButton,
  hapticImpact,
  hapticNotification,
  hapticSelection,
  openLink,
  openTelegramLink,
  showPopup,
  showAlert,
  showConfirm,
  closeTelegramWebApp,
  enableClosingConfirmation,
  disableClosingConfirmation,
  getAuthData,
  getMockTelegramData,
};

