const express = require('express');
const router = express.Router();
const Calls = require('../models/Calls');

router.post('/msg91/webhook', async (req, res) => {
  try {
    const payload = req.body;

    const requestId = payload?.request_id;
    const status = payload?.status;
    const reason = payload?.reason || payload?.error || null;

    if (!requestId) {
      return res.sendStatus(200);
    }

    await Calls.findOneAndUpdate(
      { whatsapp_message_id: requestId },
      {
        whatsapp_status: status,
        whatsapp_error: reason,
        whatsapp_delivery_payload: payload
      }
    );

    console.log('📩 MSG91 WEBHOOK:', status, reason);
    res.sendStatus(200);

  } catch (err) {
    console.error('❌ MSG91 WEBHOOK ERROR:', err.message);
    res.sendStatus(200);
  }
});

module.exports = router;
