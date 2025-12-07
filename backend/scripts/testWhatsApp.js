const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sendWhatsAppMessage } = require('../services/whatsappService');

async function main() {
  const [, , phoneArg, ...messageParts] = process.argv;

  const phone = phoneArg || process.env.TEST_WHATSAPP_PHONE;
  const message =
    messageParts.length > 0
      ? messageParts.join(' ')
      : process.env.TEST_WHATSAPP_MESSAGE || '✅ Test message from Shaurya Teleservices';

  if (!phone) {
    console.error('❌ Usage:');
    console.error('node backend/scripts/testWhatsApp.js <phone> "<message>"');
    console.error('OR set TEST_WHATSAPP_PHONE in .env');
    process.exit(1);
  }

  console.log('📤 Sending WhatsApp');
  console.log('👉 Phone:', phone);
  console.log('👉 Message:', message);

  try {
    const res = await sendWhatsAppMessage(phone, message);

    console.log('✅ WhatsApp sent successfully');
    console.log('📩 API Response:', res);
    process.exit(0);
  } catch (err) {
    console.error('❌ WhatsApp failed');
    console.error(err.response?.data || err.message);
    process.exit(1);
  }
}

main();
