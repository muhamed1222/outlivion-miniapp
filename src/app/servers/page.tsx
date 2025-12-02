'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { NavigationBar } from '@/components/navigation-bar';
import { useToast } from '@/components/ui/toast';
import { serverApi, Server } from '@/lib/api';
import { hapticImpact, hapticSelection, showBackButton, hideBackButton } from '@/lib/telegram';
import { cn } from '@/lib/utils';

export default function ServersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  useEffect(() => {
    // Показать кнопку "Назад" в Telegram
    showBackButton(() => {
      router.push('/');
    });

    return () => {
      hideBackButton();
    };
  }, [router]);

  useEffect(() => {
    async function fetchServers() {
      try {
        const data = await serverApi.getServers();
        setServers(data.filter(s => s.isActive));
      } catch (error: any) {
        console.error('Failed to fetch servers:', error);
        showToast(error.message || 'Ошибка загрузки серверов', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchServers();
  }, [showToast]);

  const handleSelectServer = (serverId: string) => {
    hapticSelection();
    setSelectedServer(serverId);
  };

  const handleConnect = () => {
    if (!selectedServer) {
      showToast('Выберите сервер', 'warning');
      return;
    }

    hapticImpact('light');
    router.push(`/config/${selectedServer}`);
  };

  const getServerFlag = (country?: string): string => {
    const flags: Record<string, string> = {
      'RU': '🇷🇺',
      'US': '🇺🇸',
      'DE': '🇩🇪',
      'NL': '🇳🇱',
      'UK': '🇬🇧',
      'FR': '🇫🇷',
      'SG': '🇸🇬',
      'JP': '🇯🇵',
    };
    return flags[country?.toUpperCase() || ''] || '🌍';
  };

  const getLoadColor = (load?: number): string => {
    if (!load) return 'text-text-secondary';
    if (load < 30) return 'text-status-success';
    if (load < 70) return 'text-status-warning';
    return 'text-status-error';
  };

  const getLoadBgColor = (load?: number): string => {
    if (!load) return 'bg-background-tertiary';
    if (load < 30) return 'bg-status-success/10';
    if (load < 70) return 'bg-status-warning/10';
    return 'bg-status-error/10';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <Loading size="lg" />
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
          <h1 className="text-3xl font-bold text-text-primary mb-2">Серверы</h1>
          <p className="text-text-secondary">Выберите сервер для подключения</p>
        </div>

        {/* Info Card */}
        <Card className="border-primary-main/30 bg-primary-main/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-main/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-text-primary text-sm">
                  Выберите сервер с наименьшей загрузкой для лучшей скорости подключения
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Servers List */}
        <div className="space-y-3">
          {servers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <p className="text-text-secondary">Серверы не найдены</p>
              </CardContent>
            </Card>
          ) : (
            servers.map((server) => (
              <Card
                key={server.id}
                className={cn(
                  'cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]',
                  selectedServer === server.id && 'border-primary-main bg-primary-main/10'
                )}
                onClick={() => handleSelectServer(server.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Flag & Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-background-tertiary flex items-center justify-center text-2xl">
                        {getServerFlag(server.country)}
                      </div>
                    </div>

                    {/* Server Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary mb-1 flex items-center gap-2">
                        {server.name}
                        {selectedServer === server.id && (
                          <svg className="w-5 h-5 text-primary-main flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </h3>
                      <p className="text-text-secondary text-sm">
                        {server.location || server.country}
                      </p>
                    </div>

                    {/* Load Indicator */}
                    <div className="flex-shrink-0">
                      <div className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium',
                        getLoadBgColor(server.load),
                        getLoadColor(server.load)
                      )}>
                        {server.load ? `${server.load}%` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Load Bar */}
                  {server.load !== undefined && (
                    <div className="mt-3">
                      <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all rounded-full',
                            server.load < 30 ? 'bg-status-success' :
                            server.load < 70 ? 'bg-status-warning' :
                            'bg-status-error'
                          )}
                          style={{ width: `${server.load}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Connect Button */}
        {servers.length > 0 && (
          <div className="sticky bottom-20 pt-4">
            <Button
              onClick={handleConnect}
              disabled={!selectedServer}
              className="w-full shadow-xl"
              size="lg"
            >
              {selectedServer ? 'Подключиться' : 'Выберите сервер'}
            </Button>
          </div>
        )}
      </div>

      <NavigationBar />
    </div>
  );
}

