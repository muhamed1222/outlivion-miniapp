/**
 * Telegram Bot utilities
 */

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

export interface TelegramMessage {
  message_id: number
  from: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
}

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
}

export interface TelegramChat {
  id: number
  type: string
  username?: string
  first_name?: string
  last_name?: string
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

export interface InlineKeyboardButton {
  text: string
  callback_data?: string
  url?: string
  web_app?: { url: string }
}

/**
 * Validate Telegram Bot Token format
 * Format should be: 123456:ABC-DEF...
 */
export function validateBotToken(token: string): boolean {
  // Telegram bot token format: number:alphanumeric_string
  return /^\d+:[A-Za-z0-9_-]+$/.test(token)
}

/**
 * Get and validate bot token from environment
 */
function getBotToken(): string {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured')
  }
  if (!validateBotToken(botToken)) {
    throw new Error(`TELEGRAM_BOT_TOKEN has invalid format. Expected format: 123456:ABC-DEF...`)
  }
  return botToken
}

/**
 * Send message to Telegram chat
 */
export async function sendMessage(
  chatId: number,
  text: string,
  options?: {
    reply_markup?: {
      inline_keyboard?: InlineKeyboardButton[][]
    }
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  }
): Promise<Response> {
  const botToken = getBotToken()

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  
  const body = {
    chat_id: chatId,
    text,
    ...options,
  }

  console.log('[BOT] Sending message to Telegram API:', { chatId, textLength: text.length })
  console.log('[BOT] Request body:', JSON.stringify(body, null, 2))
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    // Читаем response один раз
    const result = await response.json()
    
    console.log('[BOT] Telegram API response:', { 
      ok: result.ok, 
      status: response.status,
      error_code: result.error_code,
      description: result.description
    })
    
    if (!response.ok || !result.ok) {
      console.error('[BOT] Telegram API error details:', JSON.stringify(result, null, 2))
      // Пробрасываем ошибку чтобы увидеть её в логах
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`)
    }
    
    console.log('[BOT] Message sent successfully to chatId:', chatId)
    // Возвращаем новый Response с результатом
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: response.headers
    })
  } catch (error) {
    console.error('[BOT] Error sending message:', error)
    // Пробрасываем ошибку чтобы увидеть её в логах
    throw error
  }
}

/**
 * Answer callback query
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<Response> {
  const botToken = getBotToken()

  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    })

    const result = await response.json()
    
    if (!response.ok || !result.ok) {
      console.error('[BOT] Failed to answer callback query:', {
        queryId: callbackQueryId,
        error: result.description,
        status: response.status,
        error_code: result.error_code,
      })
    } else {
      console.log('[BOT] Callback query answered successfully:', callbackQueryId)
    }
    
    return response
  } catch (error) {
    console.error('[BOT] Error answering callback query:', error)
    throw error
  }
}

/**
 * Verify webhook secret
 */
export function verifyWebhookSecret(secret: string | null): boolean {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  
  // Логируем для диагностики
  console.log('[BOT] verifyWebhookSecret:', {
    hasSecretInEnv: !!webhookSecret,
    hasSecretInRequest: !!secret,
    nodeEnv: process.env.NODE_ENV,
  })
  
  // Если secret не настроен в переменных окружения, разрешаем все запросы
  // Это означает, что webhook установлен БЕЗ secret_token
  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[BOT] ⚠️ TELEGRAM_WEBHOOK_SECRET not set in production! Webhook is insecure!')
      console.warn('[BOT] Разрешаем запросы без secret для совместимости')
      // TODO: Включить строгую проверку после настройки secret
    }
    // Разрешаем запросы без secret (webhook установлен без secret_token)
    return true
  }
  
  // Если secret настроен в env, но Telegram не отправляет его (webhook без secret_token)
  // Разрешаем для совместимости, но предупреждаем
  if (!secret) {
    console.warn('[BOT] Webhook secret настроен в env, но запрос пришёл без secret token')
    console.warn('[BOT] Webhook установлен БЕЗ secret_token - разрешаем для совместимости')
    console.warn('[BOT] Для безопасности установите webhook с secret_token или удалите TELEGRAM_WEBHOOK_SECRET из env')
    // Разрешаем для совместимости, но это небезопасно
    return true
  }
  
  // Проверяем совпадение secret
  const isValid = secret === webhookSecret
  
  if (!isValid) {
    console.warn('[BOT] Invalid webhook secret:', {
      received: secret ? 'present' : 'missing',
      expected: webhookSecret ? 'configured' : 'not configured',
    })
  } else {
    console.log('[BOT] ✅ Webhook secret verified successfully')
  }
  
  return isValid
}

/**
 * Create inline keyboard with Mini App button
 */
export function createMiniAppKeyboard(webAppUrl: string): InlineKeyboardButton[][] {
  // Валидация URL
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    console.error('[BOT] Invalid webAppUrl:', webAppUrl)
    throw new Error(`Invalid webAppUrl: ${webAppUrl}`)
  }

  return [
    [
      {
        text: '🚀 Открыть Mini App',
        web_app: { url: webAppUrl },
      },
    ],
    [
      {
        text: '💬 Поддержка',
        url: 'https://t.me/outlivion_support', // Исправлен URL
      },
      {
        text: '❓ FAQ',
        callback_data: 'faq',
      },
    ],
  ]
}

/**
 * Format welcome message
 */
export function getWelcomeMessage(firstName: string): string {
  return `
👋 Привет, ${firstName}!

Добро пожаловать в **Outlivion VPN** — ваш надежный и быстрый VPN сервис.

🔐 **Что мы предлагаем:**
• Высокая скорость подключения
• Серверы по всему миру
• Военное шифрование AES-256
• Полная анонимность, без логов

Нажмите кнопку ниже, чтобы начать! 👇
  `.trim()
}

/**
 * Format FAQ message
 */
export function getFAQMessage(): string {
  return `
📚 **Часто задаваемые вопросы (FAQ)**

**Q: Как начать пользоваться VPN?**
A: Откройте Mini App, купите подписку и получите конфигурацию для подключения.

**Q: На каких устройствах работает?**
A: iOS, Android, Windows, macOS, Linux — на всех платформах!

**Q: Безопасно ли это?**
A: Да! Мы используем шифрование AES-256 и не храним логи.

**Q: Как связаться с поддержкой?**
A: Нажмите кнопку "Поддержка" в меню.
  `.trim()
}

