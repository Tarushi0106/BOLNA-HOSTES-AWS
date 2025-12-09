const axios = require('axios');
const { processSingleBolnaCall } = require('./bolnaService');

const BOLNA_AGENT_ID = process.env.BOLNA_AGENT_ID;
const BOLNA_API_KEY  = process.env.BOLNA_API_KEY;

const BOLNA_URL = `https://api.bolna.ai/agent/${BOLNA_AGENT_ID}/executions`;

async function fetchBolnaCalls() {
  try {
    console.log('⏱️ CRON: Starting Bolna sync');

    const res = await axios.get(BOLNA_URL, {
      headers: {
        Authorization: `Bearer ${BOLNA_API_KEY}`,
        Accept: 'application/json'
      }
    });

    const calls =
      res.data?.data?.executions ||
      res.data?.data ||
      [];

    console.log(`✅ Received ${calls.length} calls`);

    for (const call of calls) {
      if (call.status === 'completed') {
        await processSingleBolnaCall(call);
      }
    }

    console.log('✅ CRON: Bolna sync successful');
  } catch (err) {
    console.error(
      '❌ CRON: Bolna sync failed:',
      err.response?.data || err.message
    );
  }
}

module.exports = { fetchBolnaCalls };
