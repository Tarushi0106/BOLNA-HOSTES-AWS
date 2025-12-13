const axios = require('axios');
require('dotenv').config();

const BOLNA_AGENT_ID = process.env.BOLNA_AGENT_ID;
const BOLNA_API_KEY = process.env.BOLNA_API_KEY;

const BOLNA_URL = `https://api.bolna.ai/agent/${BOLNA_AGENT_ID}/executions`;

async function fetchBolnaCalls() {
  try {
    console.log('🔄 Fetching from Bolna');
    console.log('🌐 URL:', BOLNA_URL);

    const res = await axios.get(BOLNA_URL, {
      headers: {
        Authorization: `Bearer ${BOLNA_API_KEY}`,
        Accept: 'application/json',
      },
    });

    const calls =
      res.data?.data?.executions ||
      res.data?.data ||
      res.data ||
      [];

    console.log(
      '✅ Raw records:',
      Array.isArray(calls) ? calls.length : typeof calls
    );

    if (!Array.isArray(calls)) {
      console.error('❌ Unexpected Bolna response:', res.data);
      return;
    }

    const { processSingleBolnaCall } = require('./bolnaService');

    let processed = 0;
    let skipped = 0;

    for (const call of calls) {
      if (call.status !== 'completed') {
        skipped++;
        continue;
      }

      await processSingleBolnaCall(call);
      processed++;
    }

    console.log(
      `✅ Bolna sync done | Processed: ${processed}, Skipped: ${skipped}, Total: ${calls.length}`
    );
  } catch (err) {
    console.error(
      '❌ Bolna fetch failed:',
      err.response?.data || err.message
    );
  }
}
if (require.main === module) {
  require('dotenv').config();
  fetchBolnaCalls()
    .then(() => {
      console.log('✅ fetchBolnaCalls finished');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ fetchBolnaCalls crashed:', err);
      process.exit(1);
    });
}

module.exports = { fetchBolnaCalls };
