const express = require('express');
const router = express.Router();
const Calls = require('../models/Calls');

router.post('/webhook', async (req, res) => {

  try {
    const payload = req.body;

    // ✅ Accept all known formats
    const requestId =
      payload.request_id ||
      payload.requestId ||
      payload.oneApiRequestId ||
      payload.messageId;

    const status =
      payload.status ||
      payload.event ||
      payload.deliveryStatus ||
      'unknown';

    const reason =
      payload.reason ||
      payload.error ||
      payload.errorMessage ||
      payload.failureReason ||
      null;

    if (!requestId) {
      console.warn('⚠️ MSG91 webhook without requestId:', payload);
      return res.sendStatus(200);
    }

    await Calls.findOneAndUpdate(
      { whatsapp_message_id: requestId },
      {
        whatsapp_status: status.toLowerCase(),
        whatsapp_error: reason,
        whatsapp_delivery_payload: payload,
        whatsapp_delivered_at:
          status.toLowerCase() === 'delivered'
            ? new Date()
            : undefined
      }
    );

    console.log('📩 MSG91 WEBHOOK:', requestId, status, reason);
    res.sendStatus(200);

  } catch (err) {
    console.error('❌ MSG91 WEBHOOK ERROR:', err.message);
    res.sendStatus(200);
  }
});


module.exports = router;
