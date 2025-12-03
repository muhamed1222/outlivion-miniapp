'use client';

import { useEffect, useRef } from 'react';

interface TelegramLoginButtonProps {
  botUsername: string;
  onAuth: (user: any) => void;
  buttonSize?: 'small' | 'medium' | 'large';
  cornerRadius?: number;
  requestWriteAccess?: boolean;
  lang?: string;
}

export default function TelegramLoginButton({
  botUsername,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 12,
  requestWriteAccess = true,
  lang = 'ru',
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Setup global callback
    (window as any).onTelegramAuth = onAuth;

    // Load Telegram widget script if not already loaded
    if (!scriptLoadedRef.current && containerRef.current) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botUsername);
      script.setAttribute('data-size', buttonSize);
      script.setAttribute('data-radius', cornerRadius.toString());
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', requestWriteAccess ? 'write' : 'read');
      script.setAttribute('data-lang', lang);
      script.async = true;

      containerRef.current.appendChild(script);
      scriptLoadedRef.current = true;
    }

    return () => {
      // Cleanup
      if ((window as any).onTelegramAuth) {
        delete (window as any).onTelegramAuth;
      }
    };
  }, [botUsername, onAuth, buttonSize, cornerRadius, requestWriteAccess, lang]);

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center items-center"
      style={{ minHeight: '48px' }}
    />
  );
}

