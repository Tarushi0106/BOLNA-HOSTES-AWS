const express = require('express');
const router = express.Router();
const WhatsAppLog = require('../models/WhatsAppLog');

router.get('/', async (req, res) => {
  try {
    const logs = await WhatsAppLog.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
