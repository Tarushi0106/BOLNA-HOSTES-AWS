// // services/bolnaService.js
// console.log('🔥 bolnaService.js LOADED');

// const mongoose = require('mongoose');
// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '../.env') });

// const Calls = require('../models/Calls');
// const { extractNameAndSummary } = require('./groqSummary');
// const {
//   extractEmail,
//   extractPhone,
//   extractBestTime,
// } = require('./extractFields');

// const MONGODB_URI = process.env.MONGODB_URI;

// /* -----------------------------------------
//    ✅ CLEAN BOLNA TRANSCRIPT (CRITICAL FIX)
// ------------------------------------------ */
// function extractCleanTranscript(call) {
//   // Case 1: Bolna already gives plain transcript
//   if (call.transcript && call.transcript.trim()) {
//     return call.transcript.trim();
//   }

//   // Case 2: ASR lattice format (conversation.turns)
//   if (!call.conversation?.turns) return '';

//   return call.conversation.turns
//     .map(turn => {
//       if (!Array.isArray(turn.turn_latency)) return '';
//       const last = turn.turn_latency[turn.turn_latency.length - 1];
//       return last?.text || '';
//     })
//     .filter(Boolean)
//     .join('\n');
// }

// // --- NEW: heuristic fallback to extract a person's name from transcript/email
// function fallbackExtractName(transcript, emailCandidate) {
//   if (!transcript && !emailCandidate) return null;
//   const text = (transcript || '').replace(/\s+/g, ' ').trim();

//   // common name phrases
//   const patterns = [
//     /(?:my name is|this is|i am|i'm|name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
//     /(?:this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
//     /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?:speaking|here|on the line)/im,
//     /(?:this is|hi,|hello,)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i
//   ];

//   for (const re of patterns) {
//     const m = text.match(re);
//     if (m && m[1]) {
//       return m[1].trim();
//     }
//   }

//   // Look for capitalized word sequences (first occurrence)
//   const caps = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/);
//   if (caps && caps[1]) {
//     const candidate = caps[1].trim();
//     // reject common words
//     const reject = ['Hello','Hi','Thanks','Thank','Yes','No','Okay','OK'];
//     if (!reject.includes(candidate.split(' ')[0])) return candidate;
//   }

//   // Derive from email local-part if available
//   if (emailCandidate) {
//     const local = String(emailCandidate).split('@')[0];
//     const parts = local.split(/[.\-_]/).filter(Boolean);
//     if (parts.length) {
//       const nameParts = parts.slice(0, 2).map(p => p.charAt(0).toUpperCase() + p.slice(1));
//       return nameParts.join(' ');
//     }
//   }

//   return null;
// }

// // --- NEW: simple summary fallback (first meaningful sentence, max 40 words)
// function fallbackExtractSummary(transcript) {
//   if (!transcript) return '';
//   const cleaned = transcript.replace(/\s+/g, ' ').trim();
//   const sentences = cleaned.split(/(?<=[.?!])\s+/);
//   for (const s of sentences) {
//     const words = s.split(/\s+/).filter(Boolean);
//     if (words.length >= 5) {
//       // limit to 40 words
//       return words.slice(0, 40).join(' ').replace(/[.?!]*$/,'').trim();
//     }
//   }
//   // fallback to first 120 chars
//   return cleaned.substring(0, 120).trim();
// }

// /* -----------------------------------------
//    ✅ MAIN PROCESSOR
// ------------------------------------------ */
// async function processSingleBolnaCall(call) {
//   await mongoose.connect(MONGODB_URI);

//   const exists = await Calls.findOne({ bolna_call_id: call.id });
//   if (exists) {
//     console.log('⏭️ Duplicate skipped:', call.id);
//     return;
//   }

//   // ✅ CLEAN TRANSCRIPT
//   const transcript = extractCleanTranscript(call);

//   // ✅ AI: name + summary (ONLY from Groq) - may return empty
//   let ai = { name: null, summary: '' };
//   try {
//     ai = (await extractNameAndSummary(transcript)) || {};
//   } catch (e) {
//     console.warn('AI name/summary extraction failed, will use fallback heuristics:', e?.message || e);
//     ai = {};
//   }

//   // Deterministic fields
//   const email = extractEmail(transcript) || null;
//   const phone = extractPhone(transcript) || null;
//   const best_time_to_call = extractBestTime(transcript) || null;

//   // Use AI result if valid, otherwise apply heuristic fallbacks
//   let name = (ai.name || '').trim() || null;
//   if (!name || name.toLowerCase() === 'n/a') {
//     const fallback = fallbackExtractName(transcript, email);
//     if (fallback) {
//       console.log(`⚙️  Fallback name used for call ${call.id}:`, fallback);
//       name = fallback;
//     } else {
//       // last resort derive from email
//       if (email) {
//         const local = String(email).split('@')[0].replace(/[._-]/g, ' ');
//         name = local.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).slice(0,2).join(' ');
//         console.log(`⚙️  Derived name from email for call ${call.id}:`, name);
//       } else {
//         name = null;
//       }
//     }
//   }

//   let summary = (ai.summary || '').trim() || '';
//   if (!summary) {
//     summary = fallbackExtractSummary(transcript);
//     if (summary) console.log(`⚙️  Fallback summary used for call ${call.id}`);
//   }

//   await Calls.create({
//     bolna_call_id: call.id,
//     transcript,
//     name: name || null,
//     email: email || null,
//     phone_number: phone || null,
//     best_time_to_call: best_time_to_call || null,
//     summary: summary || '',
//     source: 'bolna',
//     status: call.status,
//     created_at: call.created_at || new Date(),
//   });

//   console.log('✅ Call saved:', call.id, '| name:', name || '(blank)');
// }

// module.exports = { processSingleBolnaCall };
// services/bolnaService.js
console.log('🔥 bolnaService.js LOADED');

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Calls = require('../models/Calls');
const { extractNameAndSummary } = require('./groqSummary');
const {
  extractEmail,
  extractPhone,
  extractBestTime,
} = require('./extractFields');
const { sendWhatsAppMessage } = require('./whatsappService');

const MONGODB_URI = process.env.MONGODB_URI;

// ------------------ DB CONNECTION (SAFE) ------------------
let isConnected = false;
async function ensureMongo() {
  if (!isConnected) {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected');
  }
}

// ------------------ CLEAN TRANSCRIPT ------------------
function extractCleanTranscript(call) {
  if (call.transcript && call.transcript.trim()) {
    return call.transcript.trim();
  }

  if (!call.conversation?.turns) return '';

  return call.conversation.turns
    .map(t => {
      if (!Array.isArray(t.turn_latency)) return '';
      const last = t.turn_latency[t.turn_latency.length - 1];
      return last?.text || '';
    })
    .filter(Boolean)
    .join('\n');
}

// ------------------ NAME SANITY FILTER ------------------
const NAME_BLACKLIST = [
  'digital',
  'certification',
  'connectivity',
  'services',
  'solutions',
  'tele',
  'teleservices',
  'authority',
  'framework',
  'ratings',
  'institute'
];

function isLikelyPersonName(name) {
  if (!name) return false;
  return !NAME_BLACKLIST.some(w =>
    name.toLowerCase().includes(w)
  );
}

// ------------------ FALLBACK NAME ------------------
function fallbackExtractName(transcript, email) {
  if (!transcript) return null;
  const text = transcript.replace(/\s+/g, ' ');

  const patterns = [
    /(?:my name is|this is|i am|i'm|name is)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/i,
    /^([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})\s+(speaking|here)/im,
    /(?:hi|hello)[, ]+\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/i
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1] && isLikelyPersonName(m[1])) {
      return m[1].trim();
    }
  }

  // derive from email
  if (email) {
    const local = email.split('@')[0];
    const parts = local.split(/[._-]/).filter(Boolean);
    if (parts.length) {
      const candidate = parts
        .slice(0, 2)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
      if (isLikelyPersonName(candidate)) return candidate;
    }
  }

  return null;
}

// ------------------ FALLBACK SUMMARY ------------------
function fallbackExtractSummary(transcript) {
  if (!transcript) return '';
  const cleaned = transcript.replace(/\s+/g, ' ').trim();
  const sentences = cleaned.split(/(?<=[.?!])\s+/);

  for (const s of sentences) {
    const words = s.split(' ');
    if (words.length >= 6) {
      return words.slice(0, 40).join(' ').replace(/[.?!]*$/, '');
    }
  }

  return cleaned.slice(0, 120);
}

// =======================================================
// ✅ MAIN PROCESSOR
// =======================================================
async function processSingleBolnaCall(call) {
  await ensureMongo();

  const exists = await Calls.findOne({ bolna_call_id: call.id });
  if (exists) {
    console.log('⏭️ Duplicate skipped:', call.id);
    return;
  }

  const transcript = extractCleanTranscript(call);

  // ---- AI Extraction (STRICT) ----
  let ai = { name: null, summary: '' };
  try {
    ai = await extractNameAndSummary(transcript);
  } catch (err) {
    console.warn('⚠️ Groq failed, using fallback');
  }

  // ---- Deterministic Fields ----
  const email = extractEmail(transcript) || null;
  const phone = extractPhone(transcript) || null;
  const best_time_to_call = extractBestTime(transcript) || null;

  // ---- Name Resolution ----
  let name = ai?.name?.trim() || null;

  if (!isLikelyPersonName(name)) {
    const fallback = fallbackExtractName(transcript, email);
    name = fallback || null;
    if (name) {
      console.log(`⚙️ Fallback name used: ${name}`);
    }
  }

  // ---- Summary Resolution ----
  let summary = ai?.summary?.trim() || '';
  if (!summary) {
    summary = fallbackExtractSummary(transcript);
  }

  // ---- SAVE ----
  await Calls.create({
    bolna_call_id: call.id,
    transcript,
    name,
    email,
    phone_number: phone,
    best_time_to_call,
    summary,
    source: 'bolna',
    status: call.status,
    created_at: call.created_at || new Date(),
  });

  console.log(
    '✅ Saved:',
    call.id,
    '| name:',
    name || '(null)'
  );
}

// NEW: send pending WhatsApp messages for saved calls
async function sendPendingWhatsAppMessages({ limit = 20 } = {}) {
  await ensureMongo();

  const pending = await Calls.find({
    phone_number: { $exists: true, $ne: null, $ne: '' },
    whatsapp_status: { $in: ['pending', 'not_sent'] }
  }).limit(limit);

  console.log(`🔔 sendPendingWhatsAppMessages: found ${pending.length} pending messages`);

  let sent = 0;
  let failed = 0;

  for (const c of pending) {
    const phone = String(c.phone_number).replace(/\D/g, '');
    if (!phone || phone.length < 7) {
      console.warn(`⚠️ Invalid phone for call ${c._id}:`, c.phone_number);
      await Calls.findByIdAndUpdate(c._id, { whatsapp_status: 'failed', whatsapp_error: 'invalid phone' });
      failed++;
      continue;
    }

    try {
      const payload = {
        name: c.name || '',
        summary: c.summary || '',
        best_time_to_call: c.best_time_to_call || '',
        email: c.email || '',
        phone_number: phone
      };

      console.log(`📱 Sending WhatsApp to ${phone} for call ${c._id}`);
      const result = await sendWhatsAppMessage(phone, payload);

      if (result && result.success) {
        const messageId = result.messageId || result.data?.request_id || null;
        await Calls.findByIdAndUpdate(c._id, {
          whatsapp_status: 'sent',
          whatsapp_message_id: messageId,
          whatsapp_sent_at: new Date(),
          whatsapp_error: null
        });
        sent++;
        console.log(`✅ WhatsApp sent for call ${c._id}`);
      } else {
        await Calls.findByIdAndUpdate(c._id, {
          whatsapp_status: 'failed',
          whatsapp_error: JSON.stringify(result?.error || 'unknown')
        });
        failed++;
        console.warn(`❌ WhatsApp failed for call ${c._id}:`, result?.error || 'unknown');
      }
    } catch (err) {
      await Calls.findByIdAndUpdate(c._id, {
        whatsapp_status: 'failed',
        whatsapp_error: err?.message || String(err)
      });
      failed++;
      console.error(`❌ Exception sending WhatsApp for call ${c._id}:`, err?.message || err);
    }

    // small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  return { sent, failed, total: pending.length };
}

// ------------------
module.exports = { processSingleBolnaCall, sendPendingWhatsAppMessages };
