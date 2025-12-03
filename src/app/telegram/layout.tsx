import { TelegramProvider } from '@/components/telegram-provider';
import { NavigationBar } from '@/components/navigation-bar';

/**
 * Layout для Telegram Mini App
 * Включает TelegramProvider для работы с Telegram WebApp API
 * и NavigationBar для навигации внизу экрана
 */
export default function TelegramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TelegramProvider>
      <div className="min-h-screen bg-background-primary">
        {/* Основной контент с padding снизу для NavigationBar */}
        <main className="pb-20">
          {children}
        </main>
        
        {/* Фиксированная навигация внизу */}
        <NavigationBar />
      </div>
    </TelegramProvider>
  );
}

