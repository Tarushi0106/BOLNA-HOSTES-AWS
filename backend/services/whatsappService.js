// services/whatsappService.js
console.log('🚀 REACHING MSG91 API');

const axios = require('axios');
const Calls = require('../models/Msg91WebhookLog');   // 🔥 ADD THIS LINE
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MSG91_API_KEY = process.env.MSG91_API_KEY;
const MSG91_TEMPLATE_NAME = process.env.MSG91_TEMPLATE_NAME || 'kyc_ivr';
const MSG91_NUMBER = process.env.MSG91_NUMBER;

async function sendWhatsAppMessage(phoneNumber, name) {
  let cleanNumber = String(phoneNumber).replace(/\D/g, '');
  if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

  console.log('📤 REACHING MSG91 →', cleanNumber, name);

  const response = await axios.post(
    'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
    {
      integrated_number: process.env.MSG91_NUMBER,
      content_type: 'template',
      payload: {
        messaging_product: 'whatsapp',
        type: 'template',
        template: {
          name: process.env.MSG91_TEMPLATE_NAME,
          language: { code: 'en' },
          to_and_components: [
            {
              to: [cleanNumber],
              components: {
                body_1: { type: 'text', value: name || 'Customer' }
              }
            }
          ]
        }
      }
    },
    {
      headers: {
        authkey: process.env.MSG91_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  // 🔥🔥🔥 THIS IS THE ONLY REQUIRED ADDITION 🔥🔥🔥
  const { request_id } = response.data;

  await Calls.create({
    phone_number: cleanNumber,
    whatsapp_message_id: request_id,
    whatsapp_status: 'sent'
  });

  return response.data;
}

module.exports = { sendWhatsAppMessage };
