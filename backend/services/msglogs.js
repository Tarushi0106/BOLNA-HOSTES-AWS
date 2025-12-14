const axios = require('axios');
const Calls = require('../models/msgpayload');
const { extractMsg91Error } = require('./msg91Utils');

const MSG91_URL = 'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';
const MSG91_KEY = process.env.MSG91_API_KEY;

async function sendWhatsApp({ phone, templatePayload }) {
  const requestId = `msg91-${Date.now()}`;

  // 1️⃣ CREATE DB RECORD FIRST
  await Calls.create({
    phone_number: phone,
    whatsapp_message_id: requestId,
    whatsapp_status: 'sent'
  });

  try {
    await axios.post(MSG91_URL, {
      request_id: requestId,
      ...templatePayload
    }, {
      headers: {
        authkey: MSG91_KEY,
        'Content-Type': 'application/json'
      }
    });

    return { success: true, requestId };

  } catch (err) {
    const reason = extractMsg91Error(err);

    await Calls.findOneAndUpdate(
      { whatsapp_message_id: requestId },
      {
        whatsapp_status: 'failed',
        whatsapp_error: reason
      }
    );

    return { success: false, reason };
  }
}

module.exports = { sendWhatsApp };
