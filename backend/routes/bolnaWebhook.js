const express = require('express');
const router = express.Router();
const BolnaUserNo = require('../models/bolnauserno');
const axios = require('axios');
const { processSingleBolnaCall } = require("../services/bolnaService");
/**
 * GET all calls (from DB)
 */
// 🔄 SYNC ALL BOLNA EXECUTIONS (PAGINATED)
router.get("/sync-all", async (req, res) => {
  try {
    const BOLNA_API_KEY = process.env.BOLNA_API_KEY;
    const AGENT_ID = process.env.BOLNA_AGENT_ID;

    if (!BOLNA_API_KEY || !AGENT_ID) {
      return res.status(500).json({ error: "Bolna env vars missing" });
    }

    let page = 1;
    let hasMore = true;
    let inserted = 0;
    let skipped = 0;

    while (hasMore) {
      const response = await axios.get(
        `https://api.bolna.ai/v2/agent/${AGENT_ID}/executions?page_number=${page}`,
        {
          headers: {
            Authorization: `Bearer ${BOLNA_API_KEY}`,
          },
        }
      );

      const executions = response.data?.data || [];
      hasMore = response.data?.has_more === true;

 for (const exec of executions) {

  const fromNumber = exec.user_number || null;
  const toNumber = exec.agent_number || null;

  // 🚫 SKIP if numbers are missing
  if (!fromNumber || !toNumber) {
    skipped++;
    continue;
  }

  const exists = await BolnaUserNo.findOne({
    executionId: exec.id,
  });

  if (exists) {
    skipped++;
    continue;
  }

  await BolnaUserNo.create({
    executionId: exec.id,
    fromNumber,
    toNumber,
    userNumber: fromNumber,
    agentNumber: toNumber,
    timestamp: exec.created_at || new Date(),
  });

  inserted++;
}


      page++;
    }

    return res.json({
      success: true,
      inserted,
      skipped,
      totalProcessed: inserted + skipped,
    });

  } catch (err) {
    console.error("❌ sync-all error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/calls', async (req, res) => {
  try {
    const calls = await BolnaUserNo.find({})
      .sort({ timestamp: -1 })
      .select('executionId fromNumber toNumber userNumber agentNumber timestamp');

    // ❌ removed count
    res.json({
      data: calls
    });

  } catch (err) {
    console.error('❌ Fetch calls error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
router.post("/bolna", async (req, res) => {
  
  try {
    console.log("🔥 Bolna Webhook Hit");
    console.log(JSON.stringify(req.body, null, 2));

    const call = req.body;

    if (!call?.id) {
      return res.status(400).json({ error: "Invalid Bolna payload" });
    }

    await processSingleBolnaCall(call);

    res.json({ success: true });
  } catch (e) {
    console.error("❌ Webhook error:", e.message);
    res.status(500).json({ error: "Webhook failed" });
  }
});


module.exports = router;
