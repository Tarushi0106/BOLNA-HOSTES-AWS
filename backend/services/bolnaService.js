console.log('🔥 bolnaService.js LOADED');

const mongoose = require('mongoose');
const path = require('path');

// ✅ Load env safely
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Calls = require('../models/Calls');
const { extractNameAndSummary } = require('./groqSummary');
const {
  extractEmail,
  extractPhone,
  extractBestTime,
} = require('./extractFields');
const { sendWhatsAppMessage } = require('./whatsappService');
const { fetchBolnaCalls } = require('./fetchBolnaCalls');

// ✅ SAFE Mongo URI resolution (NO ENV EDIT REQUIRED)
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb+srv://tarushichaudhary_db_user:mongo@cluster0.s4kr17c.mongodb.net/bolnaCalls?retryWrites=true&w=majority';

if (!MONGO_URI) {
  throw new Error('❌ MongoDB URI missing – cannot start backend');
}

// ------------------ DB CONNECTION (BULLETPROOF) ------------------
let isConnected = false;

async function ensureMongo() {
  if (isConnected) return;

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
}

// ------------------ CLEAN TRANSCRIPT ------------------
function extractCleanTranscript(call) {
  if (call?.transcript?.trim()) return call.transcript.trim();

  if (!call?.conversation?.turns) return '';

  return call.conversation.turns
    .map(t => {
      if (!Array.isArray(t.turn_latency)) return '';
      const last = t.turn_latency[t.turn_latency.length - 1];
      return last?.text || '';
    })
    .filter(Boolean)
    .join('\n');
}

// ------------------ NAME FILTER ------------------
const NAME_BLACKLIST = [
  'digital','certification','services','solutions',
  'teleservices','authority','institute','ratings'
];

function isLikelyPersonName(name) {
  if (!name) return false;
  return !NAME_BLACKLIST.some(w =>
    name.toLowerCase().includes(w)
  );
}

// ------------------ FALLBACK NAME ------------------
function fallbackExtractName(transcript, email) {
  if (!transcript && !email) return null;

  const text = (transcript || '').replace(/\s+/g, ' ');

  const patterns = [
    /(?:my name is|this is|i am|i'm)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/i,
    /^([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})\s+(speaking|here)/im
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1] && isLikelyPersonName(m[1])) return m[1].trim();
  }

  if (email) {
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length) {
      const guess = parts.slice(0, 2).map(
        p => p[0].toUpperCase() + p.slice(1)
      ).join(' ');
      if (isLikelyPersonName(guess)) return guess;
    }
  }

  return null;
}

// ------------------ FALLBACK SUMMARY ------------------
function fallbackExtractSummary(transcript = '') {
  const cleaned = transcript.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned.split(/(?<=[.?!])\s+/)[0].slice(0, 300);
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

  let ai = {};
  try {
    ai = await extractNameAndSummary(transcript);
  } catch {
    console.warn('⚠️ Groq failed – fallback used');
  }

  const email = extractEmail(transcript);
const phone = extractPhone(transcript);
const best_time_to_call = extractBestTime(transcript);

let name = isLikelyPersonName(ai?.name)
  ? ai.name
  : fallbackExtractName(transcript, email);

let summary = ai?.summary || fallbackExtractSummary(transcript);

// ✅ 🔥 FIX: REMOVE TIME FROM SUMMARY
if (summary && best_time_to_call) {
  summary = summary.replace(
    new RegExp(best_time_to_call, 'gi'),
    ''
  ).trim();
}

  const savedCall = await Calls.create({
    bolna_call_id: call.id,
    transcript,
    name: name || null,
    email: email || null,
    phone_number: phone || null,
    best_time_to_call,
    summary,
    source: 'bolna',
    status: call.status,
    created_at: call.created_at || new Date(),
  });

  console.log('✅ Call saved:', call.id, '|', name || '(no name)');

  // 🔥 IMMEDIATE WHATSAPP SEND
  if (phone) {
    console.log('📤 Sending immediate WhatsApp for call:', call.id);
    try {
     const res = await sendWhatsAppMessage(phone, name || 'Customer', call.id);

// 🔥 If MSG91 accepted request → mark as SENT
await Calls.findByIdAndUpdate(savedCall._id, {
  whatsapp_status: 'sent',
  whatsapp_sent_at: new Date(),
  whatsapp_message_id: res?.messageId || null,
  whatsapp_error: null
});

      console.log('✅ Immediate WhatsApp sent for call:', call.id);
    } catch (e) {
  await Calls.findByIdAndUpdate(savedCall._id, {
    whatsapp_status: 'failed',
    whatsapp_error: e.message || 'MSG91 send error'
  });
}

  } else {
    console.log('⚠️ No phone number for call:', call.id, '- skipping WhatsApp');
  }
}






// ------------------ WHATSAPP SENDER ------------------
async function sendPendingWhatsAppMessages({ limit = 20 } = {}) {
  console.log('🔄 sendPendingWhatsAppMessages called with limit:', limit);
  await ensureMongo();

  const pending = await Calls.find({
    phone_number: { $exists: true, $ne: null },
    whatsapp_status: { $in: ['pending', 'not_sent'] }
  }).limit(limit);

  console.log('📋 Found', pending.length, 'pending WhatsApp messages');

  for (const c of pending) {
    console.log('📤 Processing call ID:', c.bolna_call_id, 'Phone:', c.phone_number);
    try {
      const phone = String(c.phone_number).replace(/\D/g, '');
      const res = await sendWhatsAppMessage(phone, c.name || 'Customer', c.bolna_call_id);

      await Calls.findByIdAndUpdate(c._id, {
        whatsapp_status: res?.success ? 'sent' : 'failed',
        whatsapp_sent_at: new Date(),
        whatsapp_message_id: res?.messageId || null
      });
      console.log('✅ WhatsApp sent for call:', c.bolna_call_id, 'Status:', res?.success ? 'sent' : 'failed');
    } catch (e) {
      console.error('❌ WhatsApp failed for call:', c.bolna_call_id, 'Error:', e.message);
      await Calls.findByIdAndUpdate(c._id, {
        whatsapp_status: 'failed',
        whatsapp_error: e.message
      });
    }
  }
}

// ------------------ MAIN PROCESSOR FOR MULTIPLE CALLS ------------------
async function processBolnaCalls() {
  console.log('🔄 processBolnaCalls started');
  await ensureMongo();

  const calls = await fetchBolnaCalls();
  console.log('📥 Fetched', calls.length, 'calls from Bolna API');

  if (!calls || calls.length === 0) {
    console.log('⚠️ No calls to process');
    return;
  }

  for (const call of calls) {
    try {
      await processSingleBolnaCall(call);
    } catch (err) {
      console.error('❌ Error processing call:', call.id || call.execution_id, err.message);
    }
  }

  console.log('✅ All calls processed, now sending pending WhatsApp messages');
  await sendPendingWhatsAppMessages({ limit: 50 }); // Send for all processed

  console.log('🎉 processBolnaCalls completed');
}

module.exports = {
  processSingleBolnaCall,
  sendPendingWhatsAppMessages,
  processBolnaCalls
};