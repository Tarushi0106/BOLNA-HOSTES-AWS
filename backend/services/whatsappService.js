// services/whatsappService.js
console.log('🚀 REACHING MSG91 API');

const axios = require('axios');
const Msg91WebhookLog = require('../models/Msg91WebhookLog');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MSG91_API_KEY = process.env.MSG91_API_KEY;
const MSG91_TEMPLATE_NAME = process.env.MSG91_TEMPLATE_NAME; // msg2
const MSG91_NUMBER = process.env.MSG91_NUMBER;

/**
 * @param {string} fromNumber - customer phone number
 * @param {string} name - customer name
 * @param {string} bolnaObjectId - UNIQUE ID from Bolna (VERY IMPORTANT)
 */
async function sendWhatsAppMessage(fromNumber, name, bolnaObjectId) {
  let cleanNumber;

  try {
    // ✅ Clean phone number
    cleanNumber = String(fromNumber || '').replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

    if (!cleanNumber || !bolnaObjectId) {
      throw new Error('Invalid phone or missing bolnaObjectId');
    }

    console.log('📤 SENDING WHATSAPP →', cleanNumber, bolnaObjectId);

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
                components: [
                  // 🔹 BODY VARIABLE {{1}}
                  {
                    type: 'body',
                    parameters: [
                      {
                        type: 'text',
                        text: name || 'Customer'
                      }
                    ]
                  },

                  // 🔹 BUTTON VARIABLE {{1}}
                  {
                    type: 'button',
                    sub_type: 'url',
                    index: '0',
                    parameters: [
                      {
                        type: 'text',
                        text: bolnaObjectId
                      }
                    ]
                  }
                ]
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

    const requestId = response.data?.request_id || null;
    const status = requestId ? 'sent' : 'failed';

    await Msg91WebhookLog.create({
      phone_number: cleanNumber,
      status,
      whatsapp_status: status,
      whatsapp_message_id: requestId,
      raw_response: response.data
    });

    return { success: true, request_id: requestId };

  } catch (error) {
    await Msg91WebhookLog.create({
      phone_number: cleanNumber || fromNumber,
      status: 'failed',
      whatsapp_status: 'failed',
      raw_response: error.response?.data || error.message
    });

    return { success: false };
  }
}

module.exports = { sendWhatsAppMessage };
