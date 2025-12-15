const express = require("express");
const router = express.Router();
const BolnaUserNo = require("../models/bolnauserno");

/**
 * 🔔 BOLNA ANALYTICS WEBHOOK
 * This receives FULL execution payload
 */
router.post("/bolna/webhook", async (req, res) => {
  try {
    console.log("🔥 BOLNA WEBHOOK HIT 🔥");
    console.log(JSON.stringify(req.body, null, 2));

    const executionId = req.body.execution_id;
    const telephony = req.body.telephony_data || {};

    // 🧠 Detect caller correctly
    let userNumber = null;

    if (telephony.direction === "inbound") {
      userNumber = telephony.from_number;
    } else if (telephony.direction === "outbound") {
      userNumber = telephony.to_number;
    }

    if (!executionId || !userNumber) {
      console.warn("⚠️ Missing executionId or userNumber");
      return res.sendStatus(200); // IMPORTANT: do not fail webhook
    }

    await BolnaUserNo.updateOne(
      { executionId },
      { $set: { userNumber } },
      { upsert: true }
    );

    console.log("✅ USER NUMBER SAVED:", executionId, userNumber);

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err);
    res.sendStatus(500);
  }
});

/**
 * 🔍 Fetch user number by executionId
 */
router.get("/bolna-user/:executionId", async (req, res) => {
  try {
    const doc = await BolnaUserNo.findOne({
      executionId: req.params.executionId
    });

    if (!doc) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({
      executionId: doc.executionId,
      userNumber: doc.userNumber
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
