// services/whatsappService.js
console.log('🚀 REACHING MSG91 API');

const axios = require('axios');
const Msg91WebhookLog = require('../models/Msg91WebhookLog');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MSG91_API_KEY = process.env.MSG91_API_KEY;
const MSG91_TEMPLATE_NAME = process.env.MSG91_TEMPLATE_NAME || 'msg';
const MSG91_NUMBER = process.env.MSG91_NUMBER;

async function sendWhatsAppMessage(fromNumber, name) {
  let cleanNumber; // ✅ DECLARED OUTSIDE

  try {
    cleanNumber = String(fromNumber || '').replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

    if (!cleanNumber) {
      throw new Error('Invalid from_number');
    }

    console.log('📤 REACHING MSG91 →', cleanNumber, name);

    const response = await axios.post(
      'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
      {
        integrated_number: MSG91_NUMBER,
        content_type: 'template',
        payload: {
          messaging_product: 'whatsapp',
          type: 'template',
          template: {
            name: MSG91_TEMPLATE_NAME,
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
          authkey: MSG91_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const request_id =
      typeof response.data?.request_id === 'string'
        ? response.data.request_id
        : null;

    const status = request_id ? 'sent' : 'failed';

    await Msg91WebhookLog.create({
      phone_number: cleanNumber,
      status,                    // 🔥 REQUIRED BY SCHEMA
      whatsapp_status: status,
      whatsapp_message_id: request_id,
      raw_response: response.data
    });

    return {
      success: Boolean(request_id),
      request_id,
      raw: response.data
    };

  } catch (error) {
    // 🔥 cleanNumber may still be undefined here, so guard it
    await Msg91WebhookLog.create({
      phone_number: cleanNumber || String(fromNumber),
      status: 'failed',
      whatsapp_status: 'failed',
      raw_response: error.response?.data || error.message
    });

    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

module.exports = { sendWhatsAppMessage };
