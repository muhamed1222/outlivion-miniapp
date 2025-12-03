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
 * GET /api/bot - Status page
 * POST /api/bot - Webhook endpoint
 */

/**
 * GET /api/bot - Status page для проверки работоспособности
 */
export async function GET(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  // Определяем webhook URL
  let webhookUrl = 'https://app.outlivion.space/api/bot'
  if (process.env.NEXT_PUBLIC_MINIAPP_URL) {
    const miniAppUrl = process.env.NEXT_PUBLIC_MINIAPP_URL.trim()
    if (miniAppUrl.startsWith('https://')) {
      webhookUrl = `${miniAppUrl}/api/bot`
    }
  }
  
  // Пытаемся получить информацию о webhook
  let webhookInfo = null
  if (botToken) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
      const data = await response.json()
      if (data.ok) {
        webhookInfo = data.result
      }
    } catch (error) {
      // Игнорируем ошибки
    }
  }
  
  const status = {
    service: 'Telegram Bot Webhook',
    status: 'operational',
    webhook: {
      url: webhookUrl,
      configured: !!webhookInfo?.url,
      pendingUpdates: webhookInfo?.pending_update_count || 0,
      lastError: webhookInfo?.last_error_message || null,
      allowedUpdates: webhookInfo?.allowed_updates || [],
    },
    bot: {
      tokenConfigured: !!botToken,
      tokenFormat: botToken ? (botToken.match(/^\d+:/) ? 'valid' : 'invalid') : 'not set',
    },
    timestamp: new Date().toISOString(),
  }
  
  return NextResponse.json(status, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * POST /api/bot - Webhook endpoint для получения обновлений от Telegram
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
        const errorDetails = {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          chatId: update.message?.chat.id,
          userId: update.message?.from.id,
          text: update.message?.text,
          timestamp: new Date().toISOString(),
        }
        console.error('[BOT] Error handling message:', JSON.stringify(errorDetails, null, 2))
        // Логируем но продолжаем
      }
    } else if (update.callback_query) {
      console.log('[BOT] Received callback:', update.callback_query.data)
      try {
        await handleCallbackQuery(update)
        console.log('[BOT] Callback handled successfully')
      } catch (error) {
        const errorDetails = {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          queryId: update.callback_query?.id,
          data: update.callback_query?.data,
          chatId: update.callback_query?.message?.chat.id,
          userId: update.callback_query?.from.id,
          timestamp: new Date().toISOString(),
        }
        console.error('[BOT] Error handling callback:', JSON.stringify(errorDetails, null, 2))
        // Логируем но продолжаем
      }
    }

    // ВСЕГДА возвращаем 200 OK, чтобы Telegram не удалил webhook
    return NextResponse.json({ ok: true })
  } catch (error) {
    // Детальное логирование ошибок для диагностики
    const errorDetails = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString(),
      // Дополнительный контекст если доступен
      requestHeaders: {
        contentType: request.headers.get('content-type'),
        userAgent: request.headers.get('user-agent'),
        hasSecretToken: !!request.headers.get('x-telegram-bot-api-secret-token'),
      },
    }
    
    console.error('[BOT] Webhook error:', JSON.stringify(errorDetails, null, 2))
    
    // Даже при ошибке возвращаем 200 OK, чтобы не удалился webhook
    // Telegram удаляет webhook если получает не 200 OK
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
  const callbackData = query.data

  // Вспомогательная функция для ответа на callback_query
  const answerCallback = async (text?: string) => {
    try {
      await answerCallbackQuery(query.id, text)
      console.log('[BOT] Callback query answered:', { queryId: query.id, text })
    } catch (error) {
      console.error('[BOT] Failed to answer callback query:', error)
    }
  }

  // Если нет chatId, отвечаем и выходим
  if (!chatId) {
    console.warn('[BOT] Callback query without chatId:', {
      queryId: query.id,
      data: callbackData,
      from: query.from.id,
    })
    await answerCallback('Ошибка: не удалось определить чат')
    return
  }

  // Если нет callback_data, отвечаем и выходим
  if (!callbackData) {
    console.warn('[BOT] Callback query without data:', {
      queryId: query.id,
      chatId,
    })
    await answerCallback('Ошибка: данные не получены')
    return
  }

  // Обработка известных callback_data
  try {
    if (callbackData === 'faq') {
      // Сначала отвечаем на callback (чтобы кнопка не "залипала")
      await answerCallback('FAQ открыт')
      // Потом отправляем сообщение
      await sendMessage(chatId, getFAQMessage(), {
        parse_mode: 'Markdown',
      })
    } else if (callbackData === 'support') {
      // Сначала отвечаем на callback
      await answerCallback()
      // Потом отправляем сообщение
      await sendMessage(
        chatId,
        '💬 Для связи с поддержкой напишите: @outlivion_support'
      )
    } else {
      // Обработка неизвестных callback_data
      console.warn('[BOT] Unknown callback_data:', {
        data: callbackData,
        chatId,
        queryId: query.id,
      })
      await answerCallback('Неизвестная команда')
    }
  } catch (error) {
    const errorDetails = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      chatId,
      callbackData,
      queryId: query.id,
      timestamp: new Date().toISOString(),
    }
    console.error('[BOT] Error handling callback query:', JSON.stringify(errorDetails, null, 2))
    await answerCallback('Произошла ошибка при обработке запроса')
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

