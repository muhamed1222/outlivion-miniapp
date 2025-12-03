'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';


const sections = [
  {
    title: '1. Общие положения',
    content: [
      'Настоящее Пользовательское соглашение регулирует отношения между пользователем (далее — Пользователь) и сервисом Outlivion VPN (далее — Сервис).',
      'Используя Сервис, Пользователь соглашается с условиями настоящего Соглашения.',
      'Если Пользователь не согласен с условиями, он должен прекратить использование Сервиса.',
    ],
  },
  {
    title: '2. Использование сервиса',
    content: [
      'Сервис предоставляет доступ к VPN-серверам для обеспечения конфиденциальности и безопасности интернет-соединения.',
      'Пользователь обязуется использовать Сервис исключительно в законных целях.',
      'Запрещается использование Сервиса для незаконной деятельности, распространения вредоносного ПО или нарушения прав третьих лиц.',
    ],
  },
  {
    title: '3. Оплата и возврат средств',
    content: [
      'Оплата подписки производится согласно выбранному тарифному плану.',
      'Базовый тариф составляет 100 ₽/месяц за одно устройство.',
      'Возврат средств возможен в течение 7 дней с момента оплаты при технических проблемах со стороны Сервиса.',
      'Средства, зачисленные по реферальной программе, возврату не подлежат.',
    ],
  },
  {
    title: '4. Ответственность сторон',
    content: [
      'Сервис обязуется обеспечивать доступность VPN-серверов 99% времени.',
      'Сервис не несет ответственности за действия Пользователя при использовании VPN.',
      'Пользователь несет полную ответственность за сохранность своих учетных данных.',
      'Сервис не несет ответственности за блокировку доступа со стороны третьих лиц.',
    ],
  },
  {
    title: '5. Конфиденциальность',
    content: [
      'Сервис не хранит логи активности пользователей.',
      'Персональные данные используются только для предоставления доступа к Сервису.',
      'Данные платежей обрабатываются через защищенные платежные системы.',
      'Сервис не передает данные пользователей третьим лицам без согласия Пользователя.',
    ],
  },
  {
    title: '6. Реферальная программа',
    content: [
      'При регистрации нового пользователя по реферальной ссылке, реферер получает 50 ₽ на баланс.',
      'Бонусы начисляются после первой оплаты реферала.',
      'Сервис оставляет за собой право изменять условия реферальной программы.',
    ],
  },
  {
    title: '7. Изменение условий',
    content: [
      'Сервис имеет право изменять условия настоящего Соглашения в одностороннем порядке.',
      'Пользователь будет уведомлен об изменениях через email или уведомления в приложении.',
      'Продолжение использования Сервиса после изменений означает согласие с новыми условиями.',
    ],
  },
  {
    title: '8. Прекращение использования',
    content: [
      'Пользователь может прекратить использование Сервиса в любое время.',
      'При нулевом балансе аккаунт автоматически приостанавливается до пополнения.',
      'Сервис имеет право заблокировать аккаунт при нарушении условий Соглашения.',
    ],
  },
];

export default function TermsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/web/login');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-main border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary flex justify-center">
      {/* Background glow */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary-main rounded-full filter blur-[128px] opacity-20 pointer-events-none"></div>
      
      {/* Main container - 448px */}
      <div className="w-full max-w-[448px] flex flex-col min-h-screen relative">
        

        <main className="flex-1 p-4 pb-24">
          <button
            onClick={() => router.back()}
            className="mb-4 text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад
          </button>

          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Пользовательское соглашение
          </h2>

          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={index} className="bg-background-card rounded-2xl p-5">
                <h3 className="text-base font-bold text-text-primary mb-3">
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-sm text-text-secondary leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-background-card rounded-2xl">
            <p className="text-xs text-text-tertiary text-center">
              Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

