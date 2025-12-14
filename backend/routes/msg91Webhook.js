
const express = require('express');
const router = express.Router();
const Calls = require('../models/msgpayload'); // or Calls.js (same model)

router.post('/webhook', async (req, res) => {
     console.log('🔥 MSG91 WEBHOOK BODY:', req.body);
  try {
    const payload = req.body;

    const requestId =
      payload.request_id ||
      payload.requestId ||
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

    if (!requestId) return res.sendStatus(200);

   await Calls.findOneAndUpdate(
  { whatsapp_message_id: requestId },
  {
    whatsapp_status: status.toLowerCase(),
    whatsapp_error: reason,
    whatsapp_delivery_payload: payload
  },
  { new: true }
);

if (!updated) {
  console.error('❌ No DB record found for requestId:', requestId);
} else {
  console.log('✅ DB UPDATED:', updated.whatsapp_status, updated.whatsapp_error);
}

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(200);
  }
});

/* ✅ DEBUG FETCH ROUTE */
router.get('/debug/whatsapp/:requestId', async (req, res) => {
  const data = await Calls.findOne({
    whatsapp_message_id: req.params.requestId
  });

  if (!data) {
    return res.status(404).json({
      message: 'No record found for this requestId'
    });
  }

  res.json({
    whatsapp_status: data.whatsapp_status,
    whatsapp_error: data.whatsapp_error,
    raw_payload: data.whatsapp_delivery_payload
  });
});
router.post('/debug/create-call', async (req, res) => {
  const { requestId } = req.body;

  const call = await Calls.create({
    phone_number: '9999999999',
    whatsapp_message_id: requestId,
    whatsapp_status: 'sent'
  });

  res.json(call);
});

module.exports = router;
