const express = require("express");
const router = express.Router();

// TEMP storage (memory)
let lastRaw = null;

router.post("/webhook", (req, res) => {
  lastRaw = req.body;

  console.log("✅ Bolna webhook received");
  res.status(200).json({ success: true });
});

// 🔍 GET endpoint to VIEW extracted RAW data
router.get("/debug", (req, res) => {
  if (!lastRaw) {
    return res.status(404).json({
      message: "No webhook data received yet"
    });
  }

  const fromNumber =
    lastRaw.user_number ||
    lastRaw.telephony_data?.from_number ||
    null;

  const toNumber =
    lastRaw.agent_number ||
    lastRaw.telephony_data?.to_number ||
    null;

  res.json({
    executionId: lastRaw.id || null,
    from: fromNumber,
    to: toNumber,
    transcript: lastRaw.transcript || null
  });
});

module.exports = router;
