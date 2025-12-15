// const axios = require("axios");

// const RAW_BASE = "https://platform.bolna.ai/api/v1/agent-executions";
// const API_KEY = process.env.BOLNA_API_KEY;

// async function getUserNumberFromBolna(executionId) {
//   const res = await axios.get(`${RAW_BASE}/${executionId}/raw`, {
//     headers: { "X-API-Key": API_KEY }
//   });

//   const raw = res.data;

//   // Priority order (safe)
//   const userNumber =
//     raw.user_number ||
//     raw.telephony_data?.from_number ||
//     raw.telephony_data?.to_number ||
//     null;

//   return {
//     executionId: raw.id,
//     userNumber,
//     raw // keep if you need more fields later
//   };
// }

// module.exports = { getUserNumberFromBolna };
