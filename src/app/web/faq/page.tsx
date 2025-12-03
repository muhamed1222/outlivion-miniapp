'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';


const faqs = [
  {
    question: 'Как подключиться к VPN?',
    answer: 'Перейдите в раздел "Серверы", выберите нужный сервер и нажмите "Подключить". Скопируйте конфигурацию или отсканируйте QR-код в вашем VPN-приложении.',
  },
  {
    question: 'Какие VPN-клиенты поддерживаются?',
    answer: 'Мы поддерживаем v2rayNG (Android), Shadowrocket (iOS), v2rayN (Windows), Clash и другие клиенты с поддержкой протокола VLESS.',
  },
  {
    question: 'Как пополнить баланс?',
    answer: 'Нажмите кнопку "Пополнить баланс" на главном экране, выберите сумму и способ оплаты. После успешной оплаты средства зачислятся на ваш счет.',
  },
  {
    question: 'Сколько стоит подписка?',
    answer: 'Тариф составляет 100 ₽/месяц за одно устройство. Вы можете использовать VPN на любом количестве устройств одновременно.',
  },
  {
    question: 'Как работает реферальная программа?',
    answer: 'Отправьте реферальную ссылку другу. Когда он зарегистрируется и оплатит подписку, вы получите 50₽ на баланс.',
  },
  {
    question: 'Что делать если VPN не подключается?',
    answer: 'Попробуйте: 1) Проверить баланс 2) Переподключиться к серверу 3) Попробовать другой сервер 4) Проверить настройки VPN-клиента.',
  },
  {
    question: 'Как отменить подписку?',
    answer: 'Подписка автоматически приостанавливается при нулевом балансе. Вы можете в любой момент пополнить баланс и продолжить использование.',
  },
  {
    question: 'Безопасно ли использовать VPN?',
    answer: 'Да, мы используем современные протоколы шифрования VLESS. Ваш трафик защищен, и мы не храним логи активности пользователей.',
  },
];

export default function FaqPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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

          <h2 className="text-2xl font-bold text-text-primary mb-6">Часто задаваемые вопросы</h2>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-background-card rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-background-tertiary transition-colors"
                >
                  <span className="text-sm font-semibold text-text-primary pr-4">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-primary-main transition-transform flex-shrink-0 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-background-card rounded-2xl">
            <p className="text-sm text-text-secondary text-center mb-3">
              Не нашли ответ на свой вопрос?
            </p>
            <button
              onClick={() => window.open('https://t.me/outlivionbot', '_blank')}
              className="w-full py-3 px-4 bg-primary-main text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
            >
              Написать в поддержку
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

