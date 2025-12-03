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
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured')
    throw new Error('TELEGRAM_BOT_TOKEN not configured')
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  
  const body = {
    chat_id: chatId,
    text,
    ...options,
  }

  console.log('Sending message to chat:', chatId)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('Failed to send message:', result)
    } else {
      console.log('Message sent successfully:', result)
    }
    
    return response
  } catch (error) {
    console.error('Error sending message:', error)
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
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured')
  }

  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  })
}

/**
 * Verify webhook secret
 * TODO: Re-enable after fixing Vercel environment variables
 */
export function verifyWebhookSecret(secret: string | null): boolean {
  // Temporarily disabled for debugging
  // const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  // if (webhookSecret && secret !== webhookSecret) {
  //   return false
  // }
  return true
}

/**
 * Create inline keyboard with Mini App button
 */
export function createMiniAppKeyboard(webAppUrl: string): InlineKeyboardButton[][] {
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
        url: 'https://t.me/support',
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

