// services/whatsappService.js
const axios = require('axios');
console.log(
  'MSG91_API_KEY =',
  process.env.MSG91_API_KEY,
  'length =',
  process.env.MSG91_API_KEY?.length
);


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
  name: process.env.MSG91_TEMPLATE_NAME,
  language: {
    code: 'en',
    policy: 'deterministic'
  },
  namespace: "41254aa9_0b89_4bd3_9d90_28d1124fe47c",
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
          value: objectId
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