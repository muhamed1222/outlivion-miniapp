'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function TelegramProfilePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background-primary p-4 flex flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-2xl font-bold text-white">Профиль</h1>
      <p className="text-text-secondary">Страница в разработке...</p>
      <Button onClick={() => router.back()} variant="secondary">
        Назад
      </Button>
    </div>
  );
}

