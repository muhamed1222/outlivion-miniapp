'use client';

import { useEffect, useState } from 'react';
import {
  type AppEnvironment,
  detectEnvironment,
  getBasePath,
  getHomeUrl,
  getLoginUrl,
} from '@/lib/utils/environment';

export interface EnvironmentState {
  environment: AppEnvironment;
  isTelegram: boolean;
  isWeb: boolean;
  basePath: string;
  homeUrl: string;
  loginUrl: string;
  isLoading: boolean;
}

/**
 * Hook для определения среды выполнения приложения
 * Использует клиентский рендеринг для корректного определения
 */
export function useEnvironment(): EnvironmentState {
  const [state, setState] = useState<EnvironmentState>({
    environment: 'web',
    isTelegram: false,
    isWeb: true,
    basePath: '/web',
    homeUrl: '/web',
    loginUrl: '/web/login',
    isLoading: true,
  });

  useEffect(() => {
    const environment = detectEnvironment();
    const isTelegram = environment === 'telegram';
    
    setState({
      environment,
      isTelegram,
      isWeb: !isTelegram,
      basePath: getBasePath(),
      homeUrl: getHomeUrl(),
      loginUrl: getLoginUrl(),
      isLoading: false,
    });
  }, []);

  return state;
}

