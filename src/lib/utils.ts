import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price to Russian format (e.g., "100 ₽")
 */
export function formatPrice(amount: number): string {
  return `${amount} ₽`;
}

/**
 * Format date to readable format (e.g., "01.12.2025")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
}

/**
 * Format date time to readable format (e.g., "01.12.2025 12:30")
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU');
}

/**
 * Format days (e.g., "5 дней", "1 день")
 */
export function formatDays(days: number): string {
  if (days === 1) return '1 день';
  if (days >= 2 && days <= 4) return `${days} дня`;
  return `${days} дней`;
}

/**
 * Get initials from name (e.g., "Иван Иванов" → "ИИ")
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || 'U';
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get status color based on subscription status
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'text-status-success bg-status-success/10';
    case 'expired':
    case 'cancelled':
      return 'text-status-error bg-status-error/10';
    case 'pending':
      return 'text-status-warning bg-status-warning/10';
    default:
      return 'text-text-secondary bg-background-tertiary';
  }
}

/**
 * Get subscription status text
 */
export function getSubscriptionStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'Активна';
    case 'expired':
      return 'Истекла';
    case 'cancelled':
      return 'Отменена';
    case 'pending':
      return 'Ожидание';
    default:
      return 'Неизвестно';
  }
}
