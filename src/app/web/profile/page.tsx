'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';
import api from '@/lib/api';

import type { User } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

const menuItems = [
  {
    name: 'Оплата',
    href: '/billing',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    name: 'Мои транзакции',
    href: '/transactions',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    name: 'Реферальная программа',
    href: '/promo',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: 'Связаться с поддержкой',
    action: 'support',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    name: 'Пользовательское соглашение',
    href: '/terms',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const subscriptionLink = user ? `https://ultm.app/${user.telegramId}` : '';
  const referralLink = user ? `https://t.me/outlivionbot?start=${user.telegramId}` : '';

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/web/login');
      return;
    }

    async function fetchUser() {
      try {
        const userRes = await api.get('/user');
        setUser(userRes.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router]);

  const copyToClipboard = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(message, 'success');
    } catch {
      showToast('Ошибка копирования', 'error');
    }
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.action === 'support') {
      window.open('https://t.me/outlivionbot', '_blank');
    } else if (item.href) {
      router.push(item.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-main border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-primary flex justify-center">
      {/* Background glow */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary-main rounded-full filter blur-[128px] opacity-20 pointer-events-none"></div>
      
      {/* Main container - 448px */}
      <div className="w-full max-w-[448px] flex flex-col min-h-screen relative">
        

        <main className="flex-1 p-4 pb-24">
          {/* Информация о пользователе */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {user.firstName} {user.lastName}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-text-secondary">
                id: {user.telegramId}
              </p>
              <button
                onClick={() => copyToClipboard(user.telegramId, 'ID скопирован!')}
                className="p-1 hover:bg-background-tertiary rounded transition-colors"
              >
                <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Меню */}
          <div className="space-y-2 mb-4">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleMenuClick(item)}
                className="w-full flex items-center gap-4 bg-background-card rounded-2xl p-4 hover:bg-background-tertiary transition-colors"
              >
                <div className="text-primary-main">
                  {item.icon}
                </div>
                <span className="flex-1 text-left text-text-primary font-medium">
                  {item.name}
                </span>
                <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          {/* Ссылка на подписку */}
          <div className="bg-background-card rounded-2xl p-4 mb-4">
            <p className="text-sm text-text-secondary mb-2">
              Ссылка на подписку для ручного ввода:
            </p>
            <div className="flex items-center gap-2 bg-background-tertiary rounded-xl px-4 py-3">
              <p className="flex-1 text-sm text-text-primary font-mono truncate">
                {subscriptionLink}
              </p>
              <button
                onClick={() => copyToClipboard(subscriptionLink, 'Ссылка скопирована!')}
                className="p-1 hover:bg-background-card rounded transition-colors"
              >
                <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Инструкция */}
          <button
            onClick={() => router.push('/web/faq')}
            className="w-full flex items-center gap-3 bg-background-card rounded-2xl p-4 hover:bg-background-tertiary transition-colors"
          >
            <svg className="w-6 h-6 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="flex-1 text-left text-text-primary font-medium">
              Инструкция для всех платформ
            </span>
          </button>

          {/* Кнопка выхода */}
          <button
            onClick={logout}
            className="w-full mt-6 py-3 px-4 bg-status-error/10 text-status-error font-semibold rounded-xl hover:bg-status-error/20 transition-colors"
          >
            Выйти из аккаунта
          </button>
        </main>
      </div>
    </div>
  );
}

