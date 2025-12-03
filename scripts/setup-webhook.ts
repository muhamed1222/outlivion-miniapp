#!/usr/bin/env node
/**
 * Script для автоматической установки Telegram Bot Webhook
 * 
 * Использование:
 *   npm run setup:webhook
 *   или
 *   tsx scripts/setup-webhook.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Загружаем переменные окружения из различных файлов (в порядке приоритета)
// 1. Системные переменные окружения (уже загружены)
// 2. .env.local (для локальной разработки)
// 3. .env.production (для production)
// 4. .env (общий файл)

const envFiles = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env.production'),
  resolve(process.cwd(), '.env'),
];

// Загружаем переменные из файлов (последний файл имеет приоритет)
for (const envFile of envFiles) {
  try {
    config({ path: envFile, override: false }); // override: false - не перезаписывать уже загруженные
  } catch (error) {
    // Игнорируем ошибки если файл не существует
  }
}

interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
  ip_address?: string;
}

interface TelegramResponse {
  ok: boolean;
  result?: WebhookInfo | boolean;
  description?: string;
  error_code?: number;
}

/**
 * Получить информацию о текущем webhook
 */
async function getWebhookInfo(botToken: string): Promise<WebhookInfo | null> {
  const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
  
  try {
    const response = await fetch(url);
    const data: TelegramResponse = await response.json();
    
    if (!data.ok || !data.result) {
      console.error('❌ Ошибка получения информации о webhook:', data.description);
      return null;
    }
    
    return data.result as WebhookInfo;
  } catch (error) {
    console.error('❌ Ошибка при запросе getWebhookInfo:', error);
    return null;
  }
}

/**
 * Установить webhook
 */
async function setWebhook(
  botToken: string,
  webhookUrl: string,
  secretToken?: string
): Promise<boolean> {
  const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
  
  const body: any = {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
  };
  
  // Добавляем secret_token только если он валидный
  // Telegram принимает только: буквы, цифры, дефисы (-) и подчёркивания (_)
  if (secretToken && /^[A-Za-z0-9_-]+$/.test(secretToken)) {
    body.secret_token = secretToken;
  } else if (secretToken) {
    console.warn('⚠️  Secret token пропущен из-за недопустимых символов');
    console.warn('   Используйте только буквы, цифры, дефисы и подчёркивания');
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data: TelegramResponse = await response.json();
    
    if (!data.ok) {
      console.error('❌ Ошибка установки webhook:', data.description);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка при установке webhook:', error);
    return false;
  }
}

/**
 * Основная функция
 */
async function main() {
  console.log('🔧 Установка Telegram Bot Webhook\n');
  
  // Проверка переменных окружения
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('❌ ОШИБКА: TELEGRAM_BOT_TOKEN не настроен!');
    console.error('');
    console.error('   Возможные решения:');
    console.error('   1. Создайте файл .env в корне проекта:');
    console.error('      TELEGRAM_BOT_TOKEN=ваш_токен');
    console.error('');
    console.error('   2. Или установите переменную окружения:');
    console.error('      export TELEGRAM_BOT_TOKEN=ваш_токен');
    console.error('      npm run setup:webhook');
    console.error('');
    console.error('   3. Или передайте через командную строку:');
    console.error('      TELEGRAM_BOT_TOKEN=ваш_токен npm run setup:webhook');
    console.error('');
    console.error('   Токен можно получить у @BotFather в Telegram');
    process.exit(1);
  }
  
  // Проверка формата токена
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) {
    console.error('❌ ОШИБКА: Неверный формат TELEGRAM_BOT_TOKEN!');
    console.error('   Формат должен быть: 123456:ABC-DEF...');
    process.exit(1);
  }
  
  // Определяем webhook URL
  let webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    // Используем NEXT_PUBLIC_MINIAPP_URL если он установлен и это production URL
    const miniAppUrl = process.env.NEXT_PUBLIC_MINIAPP_URL;
    if (miniAppUrl && miniAppUrl.startsWith('https://')) {
      webhookUrl = `${miniAppUrl}/api/bot`;
    } else {
      // По умолчанию используем production URL
      webhookUrl = 'https://app.outlivion.space/api/bot';
    }
  }
  
  // Получаем secret token и проверяем формат
  let secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secretToken) {
    // Telegram требует, чтобы secret token содержал только буквы, цифры, дефисы и подчёркивания
    // Проверяем и предупреждаем если формат неверный
    if (!/^[A-Za-z0-9_-]+$/.test(secretToken)) {
      console.warn('⚠️  ВНИМАНИЕ: Secret token содержит недопустимые символы!');
      console.warn('   Telegram принимает только: буквы, цифры, дефисы (-) и подчёркивания (_)');
      console.warn('   Secret token будет пропущен при установке webhook');
      console.warn('   Для безопасности рекомендуется использовать валидный secret token');
    }
  }
  
  console.log('📋 Конфигурация:');
  console.log(`   Bot Token: ${botToken.substring(0, 10)}...`);
  console.log(`   Webhook URL: ${webhookUrl}`);
  console.log(`   Secret Token: ${secretToken ? '✅ Настроен' : '⚠️  Не настроен'}`);
  console.log('');
  
  // Проверка текущего webhook
  console.log('🔍 Проверка текущего webhook...');
  const currentWebhook = await getWebhookInfo(botToken);
  
  if (currentWebhook) {
    console.log('📊 Текущий статус webhook:');
    console.log(`   URL: ${currentWebhook.url || '(не установлен)'}`);
    console.log(`   Pending updates: ${currentWebhook.pending_update_count}`);
    
    if (currentWebhook.last_error_message) {
      console.log(`   ⚠️  Последняя ошибка: ${currentWebhook.last_error_message}`);
    }
    console.log('');
    
    // Если webhook уже установлен на правильный URL, проверяем нужно ли обновлять
    if (currentWebhook.url === webhookUrl) {
      console.log('✅ Webhook уже установлен на правильный URL');
      
      // Если secret token изменился, нужно обновить
      if (secretToken) {
        console.log('🔄 Обновляем webhook с новым secret token...');
      } else {
        console.log('ℹ️  Webhook не требует обновления');
        return;
      }
    }
  }
  
  // Установка webhook
  console.log('🚀 Установка webhook...');
  const success = await setWebhook(botToken, webhookUrl, secretToken);
  
  if (!success) {
    console.error('❌ Не удалось установить webhook');
    process.exit(1);
  }
  
  console.log('✅ Webhook успешно установлен!');
  
  // Проверка после установки
  console.log('\n🔍 Проверка установленного webhook...');
  const newWebhook = await getWebhookInfo(botToken);
  
  if (newWebhook) {
    console.log('📊 Статус webhook после установки:');
    console.log(`   URL: ${newWebhook.url}`);
    console.log(`   Pending updates: ${newWebhook.pending_update_count}`);
    console.log(`   Max connections: ${newWebhook.max_connections || 'default'}`);
    console.log(`   Allowed updates: ${newWebhook.allowed_updates?.join(', ') || 'all'}`);
    
    if (newWebhook.ip_address) {
      console.log(`   IP Address: ${newWebhook.ip_address}`);
    }
    
    if (newWebhook.url === webhookUrl) {
      console.log('\n✅ Webhook успешно настроен и готов к работе!');
    } else {
      console.log('\n⚠️  Webhook установлен, но URL не совпадает с ожидаемым');
    }
  }
}

// Запуск
main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

