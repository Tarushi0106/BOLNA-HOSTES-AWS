const axios = require('axios');
const Calls = require('../models/Calls');

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

    // ✅ CORRECT EXTRACTION (KEY FIX)
    const calls =
      res.data?.data?.executions ||   // ✅ main case
      res.data?.data ||               // fallback
      res.data ||                     // fallback
      [];

    console.log('✅ Raw records:', Array.isArray(calls) ? calls.length : typeof calls);

    if (!Array.isArray(calls)) {
      console.error('❌ Bolna response shape unexpected:', res.data);
      return;
    }

    let processed = 0;
    let skipped = 0;

    for (const call of calls) {
      // ✅ Only completed calls
      if (call.status !== 'completed') {
        skipped++;
        continue;
      }

      const exists = await Calls.findOne({ bolna_call_id: call.id });
      if (exists) {
        skipped++;
        continue;
      }

      const transcript =
        call.transcript ||
        call.conversation?.transcript ||
        '';

      await Calls.create({
        bolna_call_id: call.id,
        transcript,
        source: 'bolna',
        summary: '',
        whatsapp_status: 'pending',
        createdAt: new Date(call.created_at || Date.now())
      });

      processed++;
    }

    console.log(
      `✅ Bolna sync completed — Processed: ${processed}, Skipped: ${skipped}, Total: ${calls.length}`
    );
  } catch (err) {
    console.error(
      '❌ Bolna fetch failed:',
      err.response?.data || err.message
    );
  }
}

module.exports = { fetchBolnaCalls };
