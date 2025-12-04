'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';
import { tokenStorage, userStorage } from '@/lib/storage';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function DebugPage() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const info = {
      isAuthenticated: isAuthenticated(),
      accessToken: tokenStorage.getAccessToken(),
      refreshToken: tokenStorage.getRefreshToken(),
      user: getCurrentUser(),
      telegramId: userStorage.getTelegramId(),
      allCookies: Cookies.get(),
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      hostname: window.location.hostname,
    };
    
    console.log('Debug Info:', info);
    setDebugInfo(info);
  }, []);

  const handleClearAuth = () => {
    tokenStorage.clearAll();
    userStorage.clearUser();
    window.location.reload();
  };

  const handleLogin = () => {
    router.push('/web/login');
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
      
      <div className="bg-neutral-900 rounded-lg p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">Auth Status</h2>
        <pre className="text-sm overflow-auto bg-black p-4 rounded">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="space-x-4">
        <button
          onClick={handleClearAuth}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
        >
          Clear Auth
        </button>
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-[#F55128] hover:bg-[#e04520] rounded"
        >
          Go to Login
        </button>
        <button
          onClick={() => router.push('/web/dashboard')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}


