const axios = require("axios");

const BASE_URL = "https://platform.bolna.ai/api/v1";
const API_KEY = process.env.BOLNA_API_KEY;

async function fetchExecutionRaw(executionId) {
  const res = await axios.get(
    `${BASE_URL}/agent-executions/${executionId}/raw`,
    {
      headers: {
        "X-API-Key": API_KEY
      }
    }
  );

  const raw = res.data;

  return {
    executionId: raw.id,

    // 📞 NUMBERS
    fromNumber:
      raw.user_number ||
      raw.telephony_data?.from_number ||
      null,

    toNumber:
      raw.agent_number ||
      raw.telephony_data?.to_number ||
      null,

    // 📝 TRANSCRIPT
    transcript: raw.transcript || null,

    // optional
    duration: raw.conversation_duration,
    provider: raw.provider,
    status: raw.status,

    raw // keep if needed
  };
}

module.exports = { fetchExecutionRaw };
