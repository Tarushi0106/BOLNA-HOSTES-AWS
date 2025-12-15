const express = require("express");
const router = express.Router();
const BolnaUserNo = require("../models/bolnauserno");

router.post("/bolna/user-number", async (req, res) => {
  try {
    console.log("🔥 BOLNA WEBHOOK HIT");
    console.log(JSON.stringify(req.body, null, 2));

    const payload = req.body;

    // ✅ Correct Bolna fields
    const userNumber =
      payload.telephony_data?.from_number ||
      payload.from_number ||
      payload.from ||
      null;

    if (!userNumber) {
      return res.status(400).json({
        success: false,
        message: "User number not found in payload"
      });
    }

    await BolnaUserNo.updateOne(
      { executionId: payload.execution_id || payload.id },
      {
        executionId: payload.execution_id || payload.id,
        userNumber
      },
      { upsert: true }
    );

    console.log("✅ User number saved:", userNumber);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
