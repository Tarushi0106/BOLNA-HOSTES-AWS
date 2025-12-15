const axios = require("axios");
const BolnaUserNo = require("../models/bolnauserno");

const BOLNA_API_KEY = process.env.BOLNA_API_KEY;
const AGENT_ID = "12d793e7-3d09-4285-a72c-f0188d5cef26";

const LIST_URL = "https://platform.bolna.ai/api/v1/agent-executions";
const RAW_URL = "https://platform.bolna.ai/api/v1/agent-executions";

async function extractBolnaUserNumbers() {
  try {
    console.log("🔄 Fetching Bolna executions list...");

    // 1️⃣ Get execution IDs
    const listRes = await axios.get(LIST_URL, {
      headers: {
        "X-API-Key": BOLNA_API_KEY,
        "Content-Type": "application/json"
      },
      params: {
        agent_id: AGENT_ID,
        limit: 50,
        ordering: "-created_at"
      }
    });

    const executions = Array.isArray(listRes.data)
      ? listRes.data
      : [];

    let saved = 0;

    // 2️⃣ Fetch RAW execution data (THIS IS THE FIX)
    for (const exec of executions) {
      const rawRes = await axios.get(
        `${RAW_URL}/${exec.id}/raw`,
        {
          headers: {
            "X-API-Key": BOLNA_API_KEY,
            "Content-Type": "application/json"
          }
        }
      );

      const raw = rawRes.data;

      // ✅ EXACT fields from your pasted JSON
      const userNumber =
        raw.user_number ||
        raw.telephony_data?.from_number ||
        null;

      if (!userNumber) continue;

      await BolnaUserNo.updateOne(
        { executionId: raw.id },
        {
          executionId: raw.id,
          userNumber
        },
        { upsert: true }
      );

      saved++;
    }

    console.log(`✅ Done. User numbers saved: ${saved}`);
  } catch (err) {
    console.error(
      "❌ Failed to extract Bolna user numbers:",
      err.response?.data || err.message
    );
  }
  
}

module.exports = extractBolnaUserNumbers;
