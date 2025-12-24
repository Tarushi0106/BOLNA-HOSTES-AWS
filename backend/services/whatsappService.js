// services/whatsappService.js
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function sendWhatsAppMessage(phoneNumber, name, objectId) {
  let cleanNumber = String(phoneNumber || '').replace(/\D/g, '');
  if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

  const payload = {
    integrated_number: process.env.MSG91_NUMBER,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template: {
        name: 'msg2',
        language: {
          code: 'en',
          policy: 'deterministic'
        },
        namespace: '200e5e99_0383_4028_94ab_da0ea079f023',
        to_and_components: [
          {
            to: [cleanNumber],
            components: {
              body_1: {
                type: 'text',
                value: name
              },
              button_1: {
                subtype: 'url',
                type: 'text',
                value: objectId  // ObjectId goes in the button URL
              }
            }
          }
        ]
      }
    }
  };

  console.log('🔗 WhatsApp URL will contain:', objectId);
  console.log('🔗 Full URL: http://13.53.90.157:3000/lead-form/' + objectId);

  try {
    const res = await axios.post(
      'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
      payload,
      {
        headers: {
          authkey: process.env.MSG91_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ WhatsApp sent with ObjectId:', objectId);
    return { success: true, objectId, ...res.data };
  } catch (error) {
    console.error('❌ WhatsApp error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { sendWhatsAppMessage };