'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';


interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'referral' | 'subscription';
  amount: number;
  status: string;
  plan?: string;
  createdAt: string;
  description?: string;
}

type FilterType = 'all' | 'completed' | 'pending' | 'failed';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/web/login');
      return;
    }

    async function fetchTransactions() {
      try {
        const response = await api.get('/user/payments');
        // Преобразуем payments в transactions
        const txs = response.data.map((payment: any) => ({
          id: payment.id,
          type: 'payment',
          amount: payment.amount,
          status: payment.status,
          plan: payment.plan,
          createdAt: payment.createdAt,
          description: `Оплата подписки ${payment.plan}`,
        }));
        setTransactions(txs);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-status-success/20 text-status-success';
      case 'pending':
        return 'bg-status-warning/20 text-status-warning';
      case 'failed':
        return 'bg-status-error/20 text-status-error';
      default:
        return 'bg-text-tertiary/20 text-text-tertiary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Успешно';
      case 'pending':
        return 'Ожидание';
      case 'failed':
        return 'Ошибка';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return '💳';
      case 'refund':
        return '↩️';
      case 'referral':
        return '🎁';
      case 'subscription':
        return '📱';
      default:
        return '📊';
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.status === filter;
  });

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

          <h2 className="text-xl font-bold text-text-primary mb-6">Мои транзакции</h2>

          {/* Фильтры */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {[
              { value: 'all', label: 'Все' },
              { value: 'completed', label: 'Успешные' },
              { value: 'pending', label: 'Ожидающие' },
              { value: 'failed', label: 'Ошибки' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as FilterType)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === f.value
                    ? 'bg-primary-main text-white'
                    : 'bg-background-card text-text-secondary hover:bg-background-tertiary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Список транзакций */}
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-background-card rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">{getTypeIcon(tx.type)}</div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {tx.description || 'Транзакция'}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {new Date(tx.createdAt).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${getStatusColor(tx.status)}`}>
                      {getStatusText(tx.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
                    <p className="text-xs text-text-secondary">
                      {tx.plan ? `План: ${tx.plan}` : 'Транзакция'}
                    </p>
                    <p className="text-lg font-bold text-text-primary">
                      {tx.amount > 0 ? '+' : ''}{tx.amount} ₽
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-text-secondary text-sm">
                  {filter === 'all' ? 'Нет транзакций' : `Нет транзакций со статусом "${filter}"`}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

