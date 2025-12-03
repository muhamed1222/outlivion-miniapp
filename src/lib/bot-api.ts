/**
 * Bot API utilities для интеграции с backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.outlivion.space';

/**
 * Создать или обновить пользователя в БД через backend API
 */
export async function createOrUpdateUser(telegramData: {
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    console.log('[BOT-API] Creating/updating user:', {
      telegramId: telegramData.telegramId,
      firstName: telegramData.firstName,
    });

    // Формируем запрос к backend API
    // Backend ожидает либо initData (для Mini App), либо данные Widget
    // Для бота используем упрощенный формат через прямой POST /user/create-from-bot
    
    const response = await fetch(`${API_URL}/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Отправляем данные как от Telegram Widget
        id: telegramData.telegramId.toString(),
        first_name: telegramData.firstName,
        last_name: telegramData.lastName || '',
        username: telegramData.username || '',
        photo_url: telegramData.photoUrl || '',
        // Создаем фиктивные auth_date и hash для backend
        // Backend должен проверять только для Mini App initData
        auth_date: Math.floor(Date.now() / 1000).toString(),
        hash: 'bot-created-user', // Специальный маркер для бота
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[BOT-API] Failed to create/update user:', error);
      return {
        success: false,
        error: error.error || 'Failed to create user',
      };
    }

    const result = await response.json();
    console.log('[BOT-API] User created/updated:', {
      userId: result.user?.id,
      isNewUser: result.user?.isNewUser,
    });

    return {
      success: true,
      userId: result.user?.id,
    };
  } catch (error: any) {
    console.error('[BOT-API] Error creating/updating user:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Получить статус подписки пользователя
 */
export async function getUserSubscription(telegramId: number): Promise<{
  success: boolean;
  subscription?: {
    plan: string;
    status: string;
    endDate: string;
  };
  error?: string;
}> {
  try {
    console.log('[BOT-API] Getting subscription for telegramId:', telegramId);

    // Для получения подписки нужен токен авторизации
    // Но у бота нет токена
    // Поэтому создаем endpoint на backend специально для бота
    // Или используем телеграм ID напрямую
    
    const response = await fetch(`${API_URL}/user/subscription?telegramId=${telegramId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[BOT-API] Failed to get subscription:', error);
      return {
        success: false,
        error: error.error || 'Failed to get subscription',
      };
    }

    const subscription = await response.json();
    console.log('[BOT-API] Subscription retrieved:', subscription);

    return {
      success: true,
      subscription,
    };
  } catch (error: any) {
    console.error('[BOT-API] Error getting subscription:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

