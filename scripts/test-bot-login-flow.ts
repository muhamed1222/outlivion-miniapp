#!/usr/bin/env tsx
/**
 * Тест Bot Login Flow
 * Проверяет весь процесс авторизации через бота
 */

import axios from 'axios';
import { config } from 'dotenv';

// Load .env.local first (for local development)
config({ path: '.env.local' });
// Then .env
config();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

console.log('🔧 Configuration:');
console.log(`   API URL: ${API_URL}`);
console.log(`   Bot Token: ${BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'Not set'}`);
console.log('');

async function testBotLoginFlow() {
  console.log('🧪 Testing Bot Login Flow\n');
  
  // Step 1: Create login token
  console.log('1️⃣ Creating login token...');
  try {
    const response = await axios.post(`${API_URL}/auth/bot/create-login-token`, {
      deviceInfo: 'Test Script',
    });
    
    const { token, botUrl, expiresAt } = response.data;
    
    console.log('✅ Token created successfully:');
    console.log(`   Token: ${token.substring(0, 16)}...`);
    console.log(`   Bot URL: ${botUrl}`);
    console.log(`   Expires: ${expiresAt}`);
    console.log('');
    
    // Step 2: Simulate what should happen
    console.log('2️⃣ What should happen next:\n');
    console.log('   A. User opens bot URL → Telegram opens');
    console.log('   B. Telegram sends update to webhook:');
    console.log('      {');
    console.log('        "message": {');
    console.log(`          "text": "/start login_${token}",`);
    console.log('          "from": { "id": 123456 }');
    console.log('        }');
    console.log('      }');
    console.log('');
    console.log('   C. Webhook calls handleDeepLinkLogin()');
    console.log('   D. Backend confirms login');
    console.log('   E. Bot sends confirmation message to user');
    console.log('   F. Frontend polling gets "approved" status');
    console.log('');
    
    // Step 3: Check webhook endpoint
    console.log('3️⃣ Checking webhook endpoint...');
    try {
      const webhookResponse = await axios.get('https://app.outlivion.space/api/bot', {
        timeout: 5000,
      });
      console.log('✅ Webhook endpoint is accessible');
      console.log(`   Status: ${webhookResponse.status}`);
    } catch (error: any) {
      console.error('❌ Webhook endpoint not accessible:', error.message);
    }
    console.log('');
    
    // Step 4: Verify bot is configured
    console.log('4️⃣ Checking Telegram bot configuration...');
    if (!BOT_TOKEN) {
      console.error('❌ TELEGRAM_BOT_TOKEN not set');
    } else {
      try {
        const botInfo = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
        console.log('✅ Bot is accessible:');
        console.log(`   Username: @${botInfo.data.result.username}`);
        console.log(`   Name: ${botInfo.data.result.first_name}`);
        
        const webhookInfo = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
        console.log('✅ Webhook info:');
        console.log(`   URL: ${webhookInfo.data.result.url}`);
        console.log(`   Pending: ${webhookInfo.data.result.pending_update_count}`);
        
        if (webhookInfo.data.result.last_error_message) {
          console.warn(`   ⚠️  Last error: ${webhookInfo.data.result.last_error_message}`);
        }
      } catch (error: any) {
        console.error('❌ Cannot access bot:', error.message);
      }
    }
    console.log('');
    
    // Step 5: Manual testing instructions
    console.log('5️⃣ Manual testing:\n');
    console.log('   1. Open this URL in Telegram:');
    console.log(`      ${botUrl}`);
    console.log('');
    console.log('   2. Expected behavior:');
    console.log('      - Bot opens');
    console.log('      - You see START button OR bot automatically sends message');
    console.log('      - Click START (if shown)');
    console.log('      - Bot sends: "✅ Авторизация подтверждена!"');
    console.log('');
    console.log('   3. Check frontend polling:');
    console.log('      - Should change from "pending" to "approved"');
    console.log('      - Should redirect to dashboard');
    console.log('');
    
    // Step 6: Polling test
    console.log('6️⃣ Testing polling endpoint...');
    const checkResponse = await axios.get(`${API_URL}/auth/bot/check-login?token=${token}`);
    console.log(`   Status: ${checkResponse.data.status}`);
    console.log(`   Message: ${checkResponse.data.message}`);
    console.log('');
    
    if (checkResponse.data.status === 'pending') {
      console.log('✅ Session is pending (waiting for user to click START in bot)');
      console.log('');
      console.log('📝 Next steps:');
      console.log('   1. Open bot URL in Telegram');
      console.log('   2. Click START button');
      console.log('   3. Check that bot sends confirmation');
      console.log('   4. Run this script again to verify status changed to "approved"');
    } else if (checkResponse.data.status === 'approved') {
      console.log('✅ Session already approved!');
      console.log('   Frontend should receive tokens and redirect');
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('   API Error:', error.response.data);
    }
    process.exit(1);
  }
}

testBotLoginFlow();

