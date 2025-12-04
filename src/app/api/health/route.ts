import { NextResponse } from 'next/server';

const START_TIME = Date.now();
const VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0';

/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Returns application health status, version, and uptime
 */
export async function GET() {
  const uptime = Math.floor((Date.now() - START_TIME) / 1000); // seconds
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: VERSION,
    uptime,
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: checkApiConnection(),
      telegram: checkTelegramConfig(),
    },
  };
  
  // Return 200 if healthy, 503 if any service is down
  const isHealthy = Object.values(health.services).every(s => s.status === 'ok');
  const statusCode = isHealthy ? 200 : 503;
  
  return NextResponse.json(health, { status: statusCode });
}

/**
 * Check API connection configuration
 */
function checkApiConnection() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    return {
      status: 'error',
      message: 'API_URL not configured',
    };
  }
  
  return {
    status: 'ok',
    url: apiUrl,
  };
}

/**
 * Check Telegram configuration
 */
function checkTelegramConfig() {
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botName) {
    return {
      status: 'warning',
      message: 'Bot name not configured',
    };
  }
  
  return {
    status: 'ok',
    botName,
    hasToken: !!botToken,
  };
}

