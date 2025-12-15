'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function TelegramFaqPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background-primary p-4 flex flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-2xl font-bold text-white">Поддержка</h1>
      <p className="text-text-secondary">Если у вас возникли вопросы, напишите нашему боту.</p>
      <Button onClick={() => window.open('https://t.me/outlivion_support', '_blank')} className="w-full max-w-xs">
        Написать в поддержку
      </Button>
      <Button onClick={() => router.back()} variant="ghost">
        Назад
      </Button>
    </div>
  );
}

