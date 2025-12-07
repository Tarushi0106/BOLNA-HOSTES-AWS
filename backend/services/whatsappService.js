const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// MSG91 Configuration
const MSG91_API_KEY = process.env.MSG91_API_KEY;
const MSG91_TEMPLATE_NAME = process.env.MSG91_TEMPLATE_NAME || 'welcome3';
const MSG91_NUMBER = process.env.MSG91_NUMBER;

// ✅ CORRECTLY EXPORTED FUNCTION
async function sendWhatsAppMessage(phoneNumber, messageText) {
  try {
    let cleanNumber = String(phoneNumber).replace(/[^0-9]/g, '');

    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }

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
            language: {
              code: 'en',
              policy: 'deterministic'
            },
            to_and_components: [
              {
                to: [cleanNumber],
                components: {
                  body_1: {
                    type: 'text',
                    value: messageText
                  }
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

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

module.exports = {
  sendWhatsAppMessage
};
