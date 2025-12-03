import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Защищенные роуты для Telegram Mini App
const telegramProtectedRoutes = [
  '/telegram/billing',
  '/telegram/servers',
  '/telegram/config',
  '/telegram/subscription',
  '/telegram/promo',
];

// Защищенные роуты для Web Portal
const webProtectedRoutes = [
  '/web/dashboard',
  '/web/billing',
  '/web/profile',
  '/web/config',
  '/web/transactions',
  '/web/promo',
];

// Публичные роуты Web (доступны без авторизации)
const webPublicRoutes = [
  '/web/login',
  '/web/terms',
  '/web/faq',
];

/**
 * Check if user is authenticated
 * Checks both cookies (web) and could check headers for telegram
 */
function checkAuthentication(request: NextRequest): boolean {
  // Проверяем accessToken в cookies (для web и telegram)
  const accessToken = request.cookies.get('accessToken')?.value;
  if (accessToken) return true;

  // Fallback: старый token (для совместимости)
  const oldToken = request.cookies.get('token')?.value;
  if (oldToken) return true;

  // Note: localStorage tokens не доступны в middleware
  // Для telegram проверка будет в компонентах
  return false;
}

/**
 * Middleware для защиты роутов и редиректов
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Пропускаем API routes, статику, _next
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Проверяем авторизацию
  const isAuthenticated = checkAuthentication(request);

  // Проверка защищенных Telegram роутов
  const isTelegramProtected = telegramProtectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isTelegramProtected && !isAuthenticated) {
    // Редирект на telegram login (автоматическая авторизация)
    return NextResponse.redirect(new URL('/telegram/login', request.url));
  }

  // Проверка защищенных Web роутов
  const isWebProtected = webProtectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isWebProtected && !isAuthenticated) {
    // Редирект на login с сохранением intended destination
    const loginUrl = new URL('/web/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Редирект с /web/login на dashboard если уже авторизован
  if (pathname === '/web/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/web/dashboard', request.url));
  }

  // Добавляем security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

