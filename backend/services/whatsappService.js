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
    cleanNumber = String(fromNumber || '').replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

    if (!cleanNumber || !bolnaObjectId) {
      throw new Error('Missing phone or bolnaObjectId');
    }

    const payload = {
      integrated_number: process.env.MSG91_NUMBER,
      content_type: 'template',
      payload: {
        messaging_product: 'whatsapp',
        type: 'template',
        template: {
          name: process.env.MSG91_TEMPLATE_NAME, // msg2
          language: { code: 'en' },
          to_and_components: [
            {
              to: [cleanNumber],
              components: [
                // BODY {{1}}
                {
                  type: 'body',
                  parameters: [
                    {
                      type: 'text',
                      text: name || 'Customer'
                    }
                  ]
                },
                // BUTTON {{2}}
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
    };

    console.log('📦 MSG91 PAYLOAD:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
      payload,
      {
        headers: {
          authkey: process.env.MSG91_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ MSG91 RESPONSE:', response.data);

    return response.data;

  } catch (err) {
    console.error('❌ MSG91 ERROR:', err.response?.data || err.message);
    throw err;
  }
}


module.exports = { sendWhatsAppMessage };
