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
      console.log('Webhook secret verification failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse update
    const update: TelegramUpdate = await request.json()
    console.log('Received update:', JSON.stringify(update, null, 2))

    // Handle different update types
    if (update.message) {
      console.log('Handling message:', update.message.text)
      // Не ждём завершения - обрабатываем асинхронно
      handleMessage(update).catch(err => {
        console.error('Error handling message:', err)
      })
    } else if (update.callback_query) {
      console.log('Handling callback query:', update.callback_query.data)
      // Не ждём завершения - обрабатываем асинхронно
      handleCallbackQuery(update).catch(err => {
        console.error('Error handling callback query:', err)
      })
    }

    // Всегда возвращаем успех сразу, чтобы Telegram не удалял webhook
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Bot webhook error:', error)
    // Даже при ошибке возвращаем 200, чтобы Telegram не удалял webhook
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
  
  console.log('handleStartCommand called:', { chatId, firstName, miniAppUrl })
  
  try {
    const response = await sendMessage(
      chatId,
      getWelcomeMessage(firstName),
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: createMiniAppKeyboard(miniAppUrl),
        },
      }
    )
    
    console.log('sendMessage response status:', response.status)
  } catch (error) {
    console.error('Error in handleStartCommand:', error)
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

