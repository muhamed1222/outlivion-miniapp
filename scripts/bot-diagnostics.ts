#!/usr/bin/env node
/**
 * Script для диагностики Telegram бота
 * 
 * Использование:
 *   npm run bot:diagnostics
 *   или
 *   tsx scripts/bot-diagnostics.ts
 */

import axios from 'axios';
import { config } from 'dotenv';
import { resolve } from 'path';

// Загружаем переменные окружения из различных файлов
const envFiles = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env.production'),
  resolve(process.cwd(), '.env'),
];

for (const envFile of envFiles) {
  try {
    config({ path: envFile, override: false });
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
  result?: WebhookInfo | any;
  description?: string;
  error_code?: number;
}

/**
 * Проверка информации о боте
 */
async function checkBotInfo(token: string): Promise<boolean> {
  try {
    console.log('\n🤖 Проверка информации о боте...');
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    const data: TelegramResponse = response.data;

    if (data.ok && data.result) {
      console.log('✅ Бот активен:');
      console.log(`   ID: ${data.result.id}`);
      console.log(`   Username: @${data.result.username}`);
      console.log(`   Имя: ${data.result.first_name}`);
      console.log(`   Поддержка Mini App: ${data.result.has_main_web_app ? '✅' : '❌'}`);
      return true;
    } else {
      console.error('❌ Ошибка получения информации о боте:', data.description);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Ошибка при запросе getMe:', error.message);
    return false;
  }
}

/**
 * Проверка webhook
 */
async function checkWebhook(token: string): Promise<boolean> {
  try {
    console.log('\n🔍 Проверка Telegram webhook...');
    const response = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data: TelegramResponse = response.data;

    if (data.ok && data.result) {
      const webhook: WebhookInfo = data.result as WebhookInfo;
      console.log('📊 Информация о webhook:');
      console.log(`   URL: ${webhook.url || '(не установлен)'}`);
      console.log(`   Pending updates: ${webhook.pending_update_count}`);
      console.log(`   Max connections: ${webhook.max_connections || 'default'}`);
      console.log(`   Allowed updates: ${webhook.allowed_updates?.join(', ') || 'all'}`);

      if (webhook.last_error_message) {
        console.error(`   ❌ Последняя ошибка: ${webhook.last_error_message}`);
        if (webhook.last_error_date) {
          const errorDate = new Date(webhook.last_error_date * 1000);
          console.error(`   Дата ошибки: ${errorDate.toISOString()}`);
        }
        return false;
      } else {
        console.log('   ✅ Webhook работает корректно');
        return true;
      }
    } else {
      console.error('❌ Ошибка получения информации о webhook:', data.description);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Ошибка при запросе getWebhookInfo:', error.message);
    return false;
  }
}

/**
 * Проверка команд бота
 */
async function checkCommands(token: string): Promise<boolean> {
  try {
    console.log('\n📋 Проверка команд бота...');
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMyCommands`);
    const data: TelegramResponse = response.data;

    if (data.ok && data.result) {
      const commands = data.result as Array<{ command: string; description: string }>;
      if (commands.length > 0) {
        console.log('✅ Настроенные команды:');
        commands.forEach((cmd) => {
          console.log(`   /${cmd.command} - ${cmd.description}`);
        });
      } else {
        console.log('⚠️  Команды не настроены');
      }
      return true;
    } else {
      console.error('❌ Ошибка получения команд:', data.description);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Ошибка при запросе getMyCommands:', error.message);
    return false;
  }
}

/**
 * Проверка menu button
 */
async function checkMenuButton(token: string): Promise<boolean> {
  try {
    console.log('\n🔘 Проверка кнопки меню...');
    const response = await axios.get(`https://api.telegram.org/bot${token}/getChatMenuButton`);
    const data: TelegramResponse = response.data;

    if (data.ok && data.result) {
      const menuButton = data.result as any;
      if (menuButton.type === 'web_app') {
        console.log('✅ Кнопка меню настроена:');
        console.log(`   Текст: ${menuButton.text}`);
        console.log(`   URL: ${menuButton.web_app?.url || 'не указан'}`);
        return true;
      } else {
        console.log('⚠️  Кнопка меню не настроена или имеет другой тип');
        return false;
      }
    } else {
      console.error('❌ Ошибка получения кнопки меню:', data.description);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Ошибка при запросе getChatMenuButton:', error.message);
    return false;
  }
}

/**
 * Проверка endpoint бота
 */
async function checkBotEndpoint(): Promise<boolean> {
  try {
    console.log('\n🌐 Проверка endpoint бота...');
    // Всегда проверяем production endpoint
    const endpointUrl = 'https://app.outlivion.space/api/bot';

    const response = await axios.get(endpointUrl, { timeout: 5000 });
    const data = response.data;

    if (data.service === 'Telegram Bot Webhook') {
      console.log('✅ Endpoint доступен:');
      console.log(`   URL: ${endpointUrl}`);
      console.log(`   Статус: ${data.status}`);
      console.log(`   Webhook настроен: ${data.webhook.configured ? '✅' : '❌'}`);
      console.log(`   Pending updates: ${data.webhook.pendingUpdates}`);
      if (data.webhook.lastError) {
        console.error(`   ❌ Последняя ошибка: ${data.webhook.lastError}`);
      }
      return true;
    } else {
      console.error('❌ Неожиданный ответ от endpoint');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Ошибка при проверке endpoint:', error.message);
    if (error.response) {
      console.error('   HTTP Status:', error.response.status);
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    return false;
  }
}

/**
 * Проверка переменных окружения
 */
function checkEnvironmentVariables(): boolean {
  console.log('\n🔧 Проверка переменных окружения...');
  let allOk = true;

  const requiredVars = [
    { name: 'TELEGRAM_BOT_TOKEN', description: 'Токен бота' },
    { name: 'NEXT_PUBLIC_MINIAPP_URL', description: 'URL Mini App', optional: true },
  ];

  requiredVars.forEach(({ name, description, optional }) => {
    const value = process.env[name];
    if (value) {
      if (name === 'TELEGRAM_BOT_TOKEN') {
        // Проверяем формат токена
        if (/^\d+:[A-Za-z0-9_-]+$/.test(value)) {
          console.log(`   ✅ ${name}: настроен (формат правильный)`);
        } else {
          console.error(`   ❌ ${name}: неверный формат токена`);
          allOk = false;
        }
      } else {
        console.log(`   ✅ ${name}: ${value}`);
      }
    } else {
      if (optional) {
        console.log(`   ⚠️  ${name}: не настроен (опционально)`);
      } else {
        console.error(`   ❌ ${name}: не настроен`);
        allOk = false;
      }
    }
  });

  return allOk;
}

/**
 * Основная функция
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║         🔍 ДИАГНОСТИКА TELEGRAM БОТА                           ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Проверка переменных окружения
  const envOk = checkEnvironmentVariables();
  if (!envOk) {
    console.error('\n❌ Не все обязательные переменные окружения настроены!');
    process.exit(1);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN не настроен!');
    process.exit(1);
  }

  // Выполняем проверки
  const results = {
    botInfo: await checkBotInfo(token),
    webhook: await checkWebhook(token),
    commands: await checkCommands(token),
    menuButton: await checkMenuButton(token),
    endpoint: await checkBotEndpoint(),
  };

  // Итоговый отчёт
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║         📊 ИТОГОВЫЙ ОТЧЁТ                                      ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const checks = [
    { name: 'Информация о боте', result: results.botInfo },
    { name: 'Webhook', result: results.webhook },
    { name: 'Команды', result: results.commands },
    { name: 'Кнопка меню', result: results.menuButton },
    { name: 'Endpoint', result: results.endpoint },
  ];

  checks.forEach(({ name, result }) => {
    console.log(`${result ? '✅' : '❌'} ${name}: ${result ? 'OK' : 'ОШИБКА'}`);
  });

  const allPassed = Object.values(results).every((r) => r === true);
  const passedCount = Object.values(results).filter((r) => r === true).length;
  const totalCount = Object.keys(results).length;

  console.log(`\n📊 Результат: ${passedCount}/${totalCount} проверок пройдено`);

  if (allPassed) {
    console.log('\n✅ Все проверки пройдены успешно!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Некоторые проверки не пройдены. Проверьте ошибки выше.');
    process.exit(1);
  }
}

// Запуск
main().catch((error) => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

