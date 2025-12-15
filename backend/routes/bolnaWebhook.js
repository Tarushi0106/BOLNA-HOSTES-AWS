// routes/bolnaWebhook.js
const express = require("express");
const router = express.Router();
const BolnaUserNo = require("../models/bolnauserno");

router.post("/webhook", async (req, res) => {
  try {
    const { execution_id, customer_number } = req.body;

    if (!execution_id || !customer_number) {
      return res.status(400).json({ message: "Missing data" });
    }

    await BolnaUserNo.updateOne(
      { executionId: execution_id },
      { $set: { userNumber: customer_number } },
      { upsert: true }
    );

    console.log("📞 Caller captured:", execution_id, customer_number);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).json({ success: false });
  }
});

router.get("/:executionId", async (req, res) => {
  const doc = await BolnaUserNo.findOne({
    executionId: req.params.executionId
  });

  if (!doc) return res.status(404).json({ message: "Not found" });

  res.json(doc);
});

module.exports = router;
