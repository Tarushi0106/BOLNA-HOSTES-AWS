require("dotenv").config();
const axios = require("axios");

const BASE_URL = "https://api.bolna.ai/v1"; // ✅ CORRECT
const API_KEY = process.env.BOLNA_API_KEY;

async function fetchExecutionRaw(executionId) {
  const res = await axios.get(
    `${BASE_URL}/agent-executions/${executionId}/raw`,
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json"
      }
    }
  );

  const raw = res.data;

  return {
    executionId: raw.id,

    fromNumber:
      raw.user_number ||
      raw.telephony_data?.from_number ||
      null,

    toNumber:
      raw.agent_number ||
      raw.telephony_data?.to_number ||
      null,

    transcript: raw.transcript || null,
    duration: raw.conversation_duration,
    provider: raw.provider,
    status: raw.status
  };
}

module.exports = { fetchExecutionRaw };
