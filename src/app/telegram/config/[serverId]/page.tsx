'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/components/ui/toast';
import { serverApi, ServerConfig } from '@/lib/api';
import { hapticImpact, hapticNotification, showBackButton, hideBackButton, showConfirm } from '@/lib/telegram';
import { copyToClipboard } from '@/lib/utils';

export default function ConfigPage() {
  const router = useRouter();
  const params = useParams();
  const serverId = params.serverId as string;
  const { showToast } = useToast();
  
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // Показать кнопку "Назад" в Telegram
    showBackButton(() => {
      router.push('/servers');
    });

    return () => {
      hideBackButton();
    };
  }, [router]);

  useEffect(() => {
    async function fetchConfig() {
      if (!serverId) return;

      try {
        const data = await serverApi.getServerConfig(serverId);
        setConfig(data);
      } catch (error: any) {
        console.error('Failed to fetch config:', error);
        showToast(error.message || 'Ошибка загрузки конфигурации', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [serverId, showToast]);

  const handleCopyConfig = async () => {
    if (!config?.vlessConfig) return;

    hapticImpact('light');
    const success = await copyToClipboard(config.vlessConfig);

    if (success) {
      hapticNotification('success');
      showToast('Конфигурация скопирована!', 'success');
    } else {
      hapticNotification('error');
      showToast('Ошибка копирования', 'error');
    }
  };

  const handleToggleQR = () => {
    hapticImpact('light');
    setShowQR(!showQR);
  };

  const handleDeleteConfig = async () => {
    if (!serverId) return;

    const confirmed = await showConfirm('Вы уверены, что хотите удалить конфигурацию этого сервера?');
    
    if (!confirmed) return;

    try {
      hapticImpact('medium');
      await serverApi.deleteServerConfig(serverId);
      hapticNotification('success');
      showToast('Конфигурация удалена', 'success');
      router.push('/servers');
    } catch (error: any) {
      console.error('Failed to delete config:', error);
      hapticNotification('error');
      showToast(error.message || 'Ошибка удаления', 'error');
    }
  };

  const handleOpenInApp = () => {
    if (!config?.vlessConfig) return;

    hapticImpact('light');
    
    // Попытка открыть в приложении
    const appLinks = [
      `v2rayng://install-config?url=${encodeURIComponent(config.vlessConfig)}`,
      `shadowrocket://install?url=${encodeURIComponent(config.vlessConfig)}`,
      config.vlessConfig,
    ];

    // Пробуем открыть первую ссылку
    window.location.href = appLinks[0];
    
    // Если не сработало, показываем инструкцию
    setTimeout(() => {
      showToast('Скопируйте конфигурацию и вставьте в VPN приложение', 'info');
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <Loading size="lg" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-background-primary pb-20">
        <div className="max-w-[448px] mx-auto p-4 flex items-center justify-center min-h-[60vh]">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-status-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Конфигурация не найдена
              </h3>
              <p className="text-text-secondary mb-4">
                Не удалось загрузить конфигурацию сервера
              </p>
              <Button onClick={() => router.push('/servers')}>
                Вернуться к серверам
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary pb-20">
      {/* Background */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-primary-main rounded-full filter blur-[128px] opacity-20 pointer-events-none" />

      {/* Main container */}
      <div className="max-w-[448px] mx-auto p-4 space-y-4 animate-fade-in">
        {/* Header */}
        <div className="text-center pt-2 pb-4">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Конфигурация</h1>
          <p className="text-text-secondary">
            {config.serverName || 'Сервер'}
          </p>
        </div>

        {/* Server Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о сервере</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {config.serverName && (
              <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-xl">
                <span className="text-text-secondary">Название</span>
                <span className="font-semibold text-text-primary">{config.serverName}</span>
              </div>
            )}

            {config.serverLocation && (
              <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-xl">
                <span className="text-text-secondary">Локация</span>
                <span className="font-semibold text-text-primary">{config.serverLocation}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-xl">
              <span className="text-text-secondary">Статус</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-status-success' : 'bg-status-error'} animate-pulse`} />
                <span className="font-semibold text-text-primary">
                  {config.isActive ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>QR Код</CardTitle>
              <Button
                onClick={handleToggleQR}
                variant="ghost"
                size="sm"
              >
                {showQR ? 'Скрыть' : 'Показать'}
              </Button>
            </div>
          </CardHeader>
          {showQR && (
            <CardContent>
              <div className="qr-code-container mx-auto">
                <QRCodeSVG
                  value={config.vlessConfig}
                  size={256}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-text-secondary text-xs text-center mt-4">
                Отсканируйте QR-код в вашем VPN приложении
              </p>
            </CardContent>
          )}
        </Card>

        {/* Config String Card */}
        <Card>
          <CardHeader>
            <CardTitle>Строка конфигурации</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background-tertiary rounded-xl p-4 mb-4">
              <code className="text-xs text-text-secondary break-all font-mono">
                {config.vlessConfig}
              </code>
            </div>

            <Button
              onClick={handleCopyConfig}
              variant="secondary"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Копировать конфигурацию
            </Button>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="border-primary-main/30 bg-primary-main/5">
          <CardHeader>
            <CardTitle>Инструкция по подключению</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-main flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                1
              </div>
              <p className="text-text-primary text-sm">
                Скачайте VPN приложение (V2rayNG для Android или Shadowrocket для iOS)
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-main flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                2
              </div>
              <p className="text-text-primary text-sm">
                Скопируйте конфигурацию или отсканируйте QR-код
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-main flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                3
              </div>
              <p className="text-text-primary text-sm">
                Вставьте конфигурацию в приложение и подключитесь
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleOpenInApp}
            className="w-full"
            size="lg"
          >
            Открыть в приложении
          </Button>

          <Button
            onClick={handleDeleteConfig}
            variant="destructive"
            className="w-full"
          >
            Удалить конфигурацию
          </Button>
        </div>
      </div>
    </div>
  );
}

