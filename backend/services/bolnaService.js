console.log('🔥 bolnaService.js LOADED');

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Calls = require('../models/Calls');
const { extractNameAndSummary } = require('./groqSummary');
const { extractEmail, extractPhone, extractBestTime } = require('./extractFields');
const { sendWhatsAppMessage } = require('./whatsappService');
// const { fetchBolnaCalls } = require('./fetchBolnaCalls');

/* ------------------ MONGO ------------------ */
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb+srv://tarushichaudhary_db_user:mongo@cluster0.s4kr17c.mongodb.net/bolnaCalls';

let isConnected = false;
async function ensureMongo() {
  if (isConnected) return;
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  isConnected = true;
  console.log('✅ MongoDB connected');
}

/* ------------------ TRANSCRIPT ------------------ */
function extractCleanTranscript(call) {
  if (call?.transcript?.trim()) return call.transcript.trim();
  if (!Array.isArray(call?.conversation?.turns)) return '';
  return call.conversation.turns
    .map(t => t?.turn_latency?.at(-1)?.text || '')
    .filter(Boolean)
    .join('\n');
}

/* ------------------ NAME HELPERS ------------------ */
const NAME_BLACKLIST = [
  'digital','certification','services','solutions',
  'teleservices','authority','institute','ratings'
];

function isLikelyPersonName(name) {
  return name && !NAME_BLACKLIST.some(w => name.toLowerCase().includes(w));
}

function fallbackExtractName(transcript, email) {
  const text = (transcript || '').replace(/\s+/g, ' ');
  const patterns = [
    /(?:my name is|this is|i am|i'm)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/i
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1] && isLikelyPersonName(m[1])) return m[1];
  }
  if (email) {
    const p = email.split('@')[0].split(/[._-]/);
    const guess = p.slice(0, 2).map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
    if (isLikelyPersonName(guess)) return guess;
  }
  return null;
}

function fallbackExtractSummary(transcript = '') {
  return transcript.replace(/\s+/g, ' ').split(/[.?!]/)[0]?.slice(0, 300) || '';
}

/* ================== MAIN ================== */
async function processSingleBolnaCall(call) {
  await ensureMongo();

  if (await Calls.findOne({ bolna_call_id: call.id })) {
    console.log('⏭️ Duplicate skipped:', call.id);
    return;
  }

  const transcript = extractCleanTranscript(call);
const fromNumber =
  call.telephony_data?.from_number ||
  call.telephony_data?.caller ||
  call.caller ||
  call.from ||
  call.user_number ||
  call.__raw?.from ||
  call.__raw?.caller ||
  null;

console.log("📞 FINAL caller number resolved as:", fromNumber);



  let ai = {};
  try {
    ai = await extractNameAndSummary(transcript);
  } catch {}

  const email = extractEmail(transcript);
 let phone = extractPhone(transcript);

// ❌ If AI phone equals caller, IGNORE IT
if (phone && fromNumber && phone.replace(/\D/g, '') === fromNumber.replace(/\D/g, '')) {
  console.log('⚠️ AI phone equals caller, ignoring AI phone');
  phone = null;
}

  const best_time_to_call = extractBestTime(transcript);

  const name =
    isLikelyPersonName(ai?.name) ? ai.name : fallbackExtractName(transcript, email);

  let summary = ai?.summary || fallbackExtractSummary(transcript);
  if (summary && best_time_to_call) {
    summary = summary.replace(new RegExp(best_time_to_call, 'gi'), '').trim();
  }

  const savedCall = await Calls.create({
    bolna_call_id: call.id,
    from_number: fromNumber,          // ✅ STORE REAL CALLER
    transcript,
    name: name || null,
    email: email || null,
    phone_number: phone || null,      // ✅ AI PHONE (DASHBOARD)
    best_time_to_call,
    summary,
    source: 'bolna',
    status: call.status,
created_at: call.created_at || new Date(),
createdAt: call.created_at || new Date(),

    whatsapp_status: 'pending'
  });

  console.log('✅ Call saved:', call.id);

  /* ---------- IMMEDIATE WHATSAPP (FROM BOLNA) ---------- */
if (!fromNumber) {
  console.warn('⚠️ No caller number found, WhatsApp not sent');
  await Calls.findByIdAndUpdate(savedCall._id, {
    whatsapp_status: 'failed',
    whatsapp_error: 'No caller number'
  });
} else {
  try {
    console.log('📞 Sending WhatsApp to:', fromNumber);

    const res = await sendWhatsAppMessage(fromNumber, name || 'Customer');

    await Calls.findByIdAndUpdate(savedCall._id, {
      whatsapp_status: res?.success ? 'sent' : 'failed',
      whatsapp_sent_at: new Date(),
      whatsapp_message_id: res?.request_id || null
    });

    console.log('✅ WhatsApp attempted:', fromNumber);
  } catch (e) {
    await Calls.findByIdAndUpdate(savedCall._id, {
      whatsapp_status: 'failed',
      whatsapp_error: e.message
    });
  }
}

}

/* ------------------ PENDING WHATSAPP ------------------ */
async function sendPendingWhatsAppMessages({ limit = 20 } = {}) {
  await ensureMongo();

  const pending = await Calls.find({
    from_number: { $exists: true, $ne: null },
    whatsapp_status: { $in: ['pending', 'failed'] }
  }).limit(limit);

  for (const c of pending) {
    try {
      const res = await sendWhatsAppMessage(c.from_number, c.name || 'Customer');
      await Calls.findByIdAndUpdate(c._id, {
        whatsapp_status: 'sent',
        whatsapp_sent_at: new Date(),
        whatsapp_message_id: res?.data?.request_id || null
      });
    } catch (e) {
      await Calls.findByIdAndUpdate(c._id, {
        whatsapp_status: 'failed',
        whatsapp_error: e.message
      });
    }
  }
}

/* ------------------ FETCH ALL ------------------ */
// async function processBolnaCalls() {
//   await ensureMongo();
//   const calls = await fetchBolnaCalls();
//   if (!Array.isArray(calls)) return;

//   for (const call of calls) {
//     try {
//       await processSingleBolnaCall(call);
//     } catch (e) {
//       console.error('❌ Error:', e.message);
//     }
//   }

//   await sendPendingWhatsAppMessages({ limit: 50 });
// }




module.exports = {
  processSingleBolnaCall,
  sendPendingWhatsAppMessages,
  // processBolnaCalls
};
