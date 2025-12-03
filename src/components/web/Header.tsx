'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface User {
  firstName?: string;
  lastName?: string;
  username?: string;
}

export default function WebHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // TODO Phase 3: Fetch user data from API
    // For now, mock user data
    setUser({
      firstName: 'Пользователь',
    });
  }, []);

  const handleLogout = () => {
    // TODO Phase 3: Implement logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      router.push('/web/login');
    }
  };

  const navItems = [
    { href: '/web/dashboard', label: 'Главная' },
    { href: '/web/billing', label: 'Оплата' },
    { href: '/web/profile', label: 'Профиль' },
    { href: '/web/faq', label: 'FAQ' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-light bg-background-card/80 backdrop-blur-xl">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/web/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary-main flex items-center justify-center">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <span className="text-xl font-bold text-text-primary">Outlivion</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary-main',
                  isActive ? 'text-primary-main' : 'text-text-secondary'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-main/20 flex items-center justify-center">
              <span className="text-primary-main text-sm font-medium">
                {user?.firstName?.charAt(0) || 'П'}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-sm text-text-primary hover:text-primary-main transition-colors"
              >
                {user?.firstName || 'Пользователь'}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-background-card border border-border-light rounded-xl shadow-lg py-2">
                  <Link
                    href="/web/profile"
                    className="block px-4 py-2 text-sm text-text-primary hover:bg-background-tertiary"
                    onClick={() => setMenuOpen(false)}
                  >
                    Профиль
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-status-error hover:bg-background-tertiary"
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="md:hidden border-t border-border-light bg-background-card">
          <nav className="flex flex-col space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 text-sm font-medium rounded-xl transition-colors',
                    isActive
                      ? 'bg-primary-main/10 text-primary-main'
                      : 'text-text-secondary hover:bg-background-tertiary'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="px-4 py-3 text-sm font-medium text-status-error hover:bg-background-tertiary rounded-xl text-left"
            >
              Выйти
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

