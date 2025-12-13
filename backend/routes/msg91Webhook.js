const express = require('express');
const router = express.Router();
const Calls = require('../models/Calls');

router.post('/webhook', async (req, res) => {
  try {
    console.log('📩 MSG91 WEBHOOK HIT');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    const payload = req.body || {};

    const requestId =
      payload.request_id ||
      payload.requestId ||
      payload.requestid ||
      null;

    const status =
      payload.status ||
      payload.delivery_status ||
      null;

    const reason =
      payload.reason ||
      payload.error ||
      payload.error_message ||
      null;

    // MSG91 sometimes sends EMPTY payloads
    if (!requestId) {
      return res.sendStatus(200);
    }

    await Calls.findOneAndUpdate(
      { whatsapp_message_id: requestId },
      {
        whatsapp_status: status,
        whatsapp_error: reason,
        whatsapp_delivery_payload: payload
      },
      { new: true }
    );

    console.log('✅ MSG91 UPDATED:', requestId, status, reason);
    return res.sendStatus(200);

  } catch (err) {
    console.error('❌ MSG91 WEBHOOK ERROR:', err);
    return res.sendStatus(200); // always ACK MSG91
  }
});

module.exports = router;
