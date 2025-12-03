import { NextRequest, NextResponse } from 'next/server'
import {
  TelegramUpdate,
  sendMessage,
  answerCallbackQuery,
  verifyWebhookSecret,
  createMiniAppKeyboard,
  getWelcomeMessage,
  getFAQMessage,
} from '@/lib/bot'

/**
 * Telegram Bot Webhook Handler
 * POST /api/bot
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const secret = request.headers.get('x-telegram-bot-api-secret-token')
    if (!verifyWebhookSecret(secret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse update
    const update: TelegramUpdate = await request.json()

    // Handle different update types
    if (update.message) {
      console.log('[BOT] Received message:', {
        chatId: update.message.chat.id,
        text: update.message.text,
        from: update.message.from.first_name
      })
      // Обрабатываем синхронно чтобы увидеть ошибки
      try {
        await handleMessage(update)
        console.log('[BOT] Message handled successfully')
      } catch (error) {
        console.error('[BOT] Error handling message:', error)
        // Логируем но продолжаем
      }
    } else if (update.callback_query) {
      console.log('[BOT] Received callback:', update.callback_query.data)
      try {
        await handleCallbackQuery(update)
        console.log('[BOT] Callback handled successfully')
      } catch (error) {
        console.error('[BOT] Error handling callback:', error)
        // Логируем но продолжаем
      }
    }

    // ВСЕГДА возвращаем 200 OK, чтобы Telegram не удалил webhook
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Bot webhook error:', error)
    // Даже при ошибке возвращаем 200 OK, чтобы не удалился webhook
    return NextResponse.json({ ok: true })
  }
}

/**
 * Handle incoming messages
 */
async function handleMessage(update: TelegramUpdate) {
  const message = update.message!
  const chatId = message.chat.id
  const text = message.text

  if (!text) return

  // Handle commands
  if (text.startsWith('/start')) {
    await handleStartCommand(chatId, message.from.first_name)
  } else if (text.startsWith('/help')) {
    await handleHelpCommand(chatId)
  } else if (text.startsWith('/status')) {
    await handleStatusCommand(chatId, message.from.id)
  }
}

/**
 * Handle callback queries (button clicks)
 */
async function handleCallbackQuery(update: TelegramUpdate) {
  const query = update.callback_query!
  const chatId = query.message?.chat.id

  if (!chatId) return

  const data = query.data

  if (data === 'faq') {
    await sendMessage(chatId, getFAQMessage(), {
      parse_mode: 'Markdown',
    })
    await answerCallbackQuery(query.id, 'FAQ открыт')
  } else if (data === 'support') {
    await sendMessage(
      chatId,
      '💬 Для связи с поддержкой напишите: @outlivion_support'
    )
    await answerCallbackQuery(query.id)
  }
}

/**
 * Handle /start command
 */
async function handleStartCommand(chatId: number, firstName: string) {
  const miniAppUrl = process.env.NEXT_PUBLIC_MINIAPP_URL || 'http://localhost:3002'
  
  console.log('[BOT] handleStartCommand:', { chatId, firstName, miniAppUrl })
  
  try {
    // Сначала отправляем простое сообщение для теста
    console.log('[BOT] Attempting to send welcome message...')
    
    const welcomeText = `👋 Привет, ${firstName}!

Добро пожаловать в Outlivion VPN — ваш надежный и быстрый VPN сервис.

🔐 Что мы предлагаем:
• Высокая скорость подключения
• Серверы по всему миру
• Военное шифрование AES-256
• Полная анонимность, без логов

Нажмите кнопку ниже, чтобы начать! 👇`

    const keyboard = createMiniAppKeyboard(miniAppUrl)
    console.log('[BOT] Keyboard created:', JSON.stringify(keyboard, null, 2))
    
    const result = await sendMessage(
      chatId,
      welcomeText,
      {
        reply_markup: {
          inline_keyboard: keyboard,
        },
      }
    )
    
    console.log('[BOT] sendMessage completed, result status:', result.status)
    console.log('[BOT] Message sent successfully')
  } catch (error) {
    console.error('[BOT] Error in handleStartCommand:', error)
    console.error('[BOT] Error stack:', error instanceof Error ? error.stack : 'No stack')
    // Не пробрасываем ошибку, чтобы не сломать webhook
  }

  // TODO: Create user in database if doesn't exist
  // await createUserIfNotExists(chatId)
}

/**
 * Handle /help command
 */
async function handleHelpCommand(chatId: number) {
  const helpText = `
🤖 **Команды бота:**

/start - Начать работу с ботом
/help - Показать эту справку
/status - Проверить статус подписки

Для управления VPN откройте Mini App! 👇
  `.trim()

  const miniAppUrl = process.env.NEXT_PUBLIC_MINIAPP_URL || 'http://localhost:3002'

  await sendMessage(chatId, helpText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: createMiniAppKeyboard(miniAppUrl),
    },
  })
}

/**
 * Handle /status command
 */
async function handleStatusCommand(chatId: number, userId: number) {
  // TODO: Get subscription status from API
  const statusText = `
📊 **Статус вашей подписки:**

❓ Чтобы узнать статус подписки, откройте Mini App.
  `.trim()

  const miniAppUrl = process.env.NEXT_PUBLIC_MINIAPP_URL || 'http://localhost:3002'

  await sendMessage(chatId, statusText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[{
        text: '🚀 Открыть Mini App',
        web_app: { url: miniAppUrl },
      }]],
    },
  })
}

