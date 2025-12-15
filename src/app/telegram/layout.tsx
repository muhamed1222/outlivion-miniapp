import { TelegramProvider } from '@/components/telegram-provider';
import { ErrorBoundary } from '@/components/error-boundary';

/**
 * Layout для Telegram Mini App
 * Включает TelegramProvider для работы с Telegram WebApp API
 */
export default function TelegramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <TelegramProvider>
        <div className="min-h-screen bg-background-primary">
          <main>
            {children}
          </main>
        </div>
      </TelegramProvider>
    </ErrorBoundary>
  );
}

