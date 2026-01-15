const express = require('express');
const router = express.Router();
const Calls = require('../models/Calls');
const { processSingleBolnaCall } = require('../services/bolnaService');

router.get('/', async (req, res) => {
  try {
    const calls = await Calls.find({})
      .sort({ createdAt: -1 })
   

    res.json(calls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch calls' });
  }
});

// 🔥 WEBHOOK FOR INSTANT BOLNA CALL RECEIPT
router.post('/webhook/bolna', async (req, res) => {
  try {
    console.log('🔥 [WEBHOOK] Received Bolna call data:', JSON.stringify(req.body, null, 2));

    const call = req.body; // Assuming Bolna sends the call object directly

    if (!call || !call.id) {
      console.error('❌ [WEBHOOK] Invalid call data received');
      return res.status(400).json({ error: 'Invalid call data' });
    }

    // Process immediately
    await processSingleBolnaCall(call);

    console.log('✅ [WEBHOOK] Call processed instantly:', call.id);
    res.status(200).json({ success: true, message: 'Call processed' });
  } catch (err) {
    console.error('❌ [WEBHOOK] Error processing call:', err.message);
    res.status(500).json({ error: 'Failed to process call' });
  }
});




module.exports = router;

