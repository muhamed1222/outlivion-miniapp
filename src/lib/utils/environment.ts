/**
 * Environment Detection Utilities
 * Определяет среду выполнения приложения (Telegram WebApp или Browser)
 */

export type AppEnvironment = 'telegram' | 'web';

/**
 * Определяет текущую среду выполнения
 */
export function detectEnvironment(): AppEnvironment {
  // Server-side rendering - по умолчанию web
  if (typeof window === 'undefined') {
    return 'web';
  }

  // Проверяем наличие Telegram WebApp API
  if (window.Telegram?.WebApp) {
    const webApp = window.Telegram.WebApp;
    
    // Дополнительная проверка - есть ли initData
    if (webApp.initData && webApp.initData.length > 0) {
      return 'telegram';
    }
  }

  // Проверяем URL path как fallback
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.startsWith('/telegram') || path.startsWith('/app')) {
      return 'telegram';
    }
  }

  return 'web';
}

/**
 * Проверяет, запущено ли приложение в Telegram WebApp
 */
export function isTelegramEnvironment(): boolean {
  return detectEnvironment() === 'telegram';
}

/**
 * Проверяет, запущено ли приложение в обычном браузере
 */
export function isWebEnvironment(): boolean {
  return detectEnvironment() === 'web';
}

/**
 * Получить базовый путь в зависимости от среды
 */
export function getBasePath(): string {
  return isTelegramEnvironment() ? '/telegram' : '/web';
}

/**
 * Получить redirect URL в зависимости от среды
 */
export function getHomeUrl(): string {
  return isTelegramEnvironment() ? '/telegram' : '/web';
}

/**
 * Получить login URL в зависимости от среды
 */
export function getLoginUrl(): string {
  return isTelegramEnvironment() ? '/telegram' : '/web/login';
}

/**
 * Hook для использования в компонентах
 */
export function useEnvironment() {
  if (typeof window === 'undefined') {
    return {
      environment: 'web' as AppEnvironment,
      isTelegram: false,
      isWeb: true,
      basePath: '/web',
    };
  }

  const environment = detectEnvironment();
  
  return {
    environment,
    isTelegram: environment === 'telegram',
    isWeb: environment === 'web',
    basePath: getBasePath(),
    homeUrl: getHomeUrl(),
    loginUrl: getLoginUrl(),
  };
}

/**
 * Получить правильный URL для навигации
 */
export function getRouteUrl(route: string): string {
  const basePath = getBasePath();
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return `${basePath}${cleanRoute}`;
}

/**
 * Проверка, является ли текущий путь Telegram роутом
 */
export function isTelegramRoute(pathname: string): boolean {
  return pathname.startsWith('/telegram') || pathname.startsWith('/app');
}

/**
 * Проверка, является ли текущий путь Web роутом
 */
export function isWebRoute(pathname: string): boolean {
  return pathname.startsWith('/web');
}

