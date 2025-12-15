import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/bot';
import axios from 'axios';

/**
 * Test endpoint для проверки работы бота
 * GET /api/bot/test?telegramId=123456
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const telegramId = searchParams.get('telegramId');
  
  if (!telegramId) {
    return NextResponse.json({ 
      error: 'telegramId required',
      usage: '/api/bot/test?telegramId=YOUR_TELEGRAM_ID'
    }, { status: 400 });
  }

  try {
    // Проверяем pending session
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const sessionCheck = await axios.get(
      `${API_URL}/auth/bot/pending-session?telegramId=${telegramId}`,
      { timeout: 5000 }
    );

    const hasPending = sessionCheck.data.hasPendingSession;
    const token = sessionCheck.data.token;

    if (hasPending) {
      // Пытаемся отправить сообщение пользователю
      // Но для этого нужен chatId, который мы не знаем без update от Telegram
      return NextResponse.json({
        success: true,
        hasPendingSession: true,
        token: token?.substring(0, 16) + '...',
        message: 'Pending session found. User needs to send any message to bot.',
        instruction: 'Напишите боту любое сообщение (например, "привет"), и бот автоматически покажет кнопку подтверждения.'
      });
    } else {
      return NextResponse.json({
        success: true,
        hasPendingSession: false,
        message: 'No pending session found'
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.response?.data
    }, { status: 500 });
  }
}

