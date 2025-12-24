const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function sendWhatsAppMessage(phoneNumber, name) {
  let cleanNumber = String(phoneNumber || '').replace(/\D/g, '');
  if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

  const payload = {
    integrated_number: process.env.MSG91_NUMBER, // "919820708573"
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template: {
        name: 'msg2',
        language: {
          code: 'en',
          policy: 'deterministic' // ✅ Required as per your template
        },
        namespace: '200e5e99_0383_4028_94ab_da0ea079f023', // ✅ Required
        to_and_components: [
          {
            to: [cleanNumber], // ✅ Must be an array
            components: {
              body_1: {
                type: 'text',
                value: name // This replaces the "name" in your message body
              },
              button_1: { // ✅ Note: button_1 (not button_url_1)
                subtype: 'url', // ✅ This is required
                type: 'text',
                value: name // This replaces the {{1}} in your button URL
              }
            }
          }
        ]
      }
    }
  };

  console.log('Sending payload:', JSON.stringify(payload, null, 2));

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

    console.log('✅ MSG91 RESPONSE:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ MSG91 ERROR:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { sendWhatsAppMessage };