const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sendWhatsAppMessage, updateWhatsAppStatus } = require('./whatsappService');

const BOLNA_AGENT_ID = process.env.BOLNA_AGENT_ID;
const BOLNA_API_KEY = process.env.BOLNA_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

if (!BOLNA_AGENT_ID || !BOLNA_API_KEY || !GROQ_API_KEY || !MONGODB_URI) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const BOLNA_API_URL = `https://api.bolna.ai/agent/${BOLNA_AGENT_ID}/executions`;

let groq;
function initGroq() {
  if (!groq) {
    const Groq = require('groq-sdk');
    groq = new Groq({ apiKey: GROQ_API_KEY });
  }
  return groq;
}

/* -------------------- DATABASE -------------------- */

async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected');
}

function getBolnaCallModel() {
  try {
    return mongoose.model('BolnaCall');
  } catch {
    const schema = new mongoose.Schema({
      bolna_call_id: { type: String, unique: true, sparse: true },
      name: String,
      email: String,
      phone_number: String,
      best_time_to_call: String,
      summary: String,
      transcript: String,
      call_duration: Number,
      call_timestamp: Date,
      user_number: String,
      source: { type: String, default: 'bolna-ai' },
      whatsapp_status: {
        type: String,
        enum: ['not_sent', 'pending', 'sent', 'failed'],
        default: 'pending'
      },
      whatsapp_message_id: String,
      whatsapp_sent_at: Date,
      whatsapp_error: String,
      createdAt: { type: Date, default: Date.now }
    });

    schema.index({ phone_number: 1, call_timestamp: 1 });
    return mongoose.model('BolnaCall', schema, 'bolnaCalls');
  }
}

/* -------------------- BOLNA FETCH -------------------- */

async function fetchBolnaCalls(options = {}) {
  try {
    console.log('\n🔐 Bolna API Debug Info:');
    console.log(`   Agent ID: ${BOLNA_AGENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   API Key: ${BOLNA_API_KEY ? '✅ Set (***' + BOLNA_API_KEY.slice(-4) + ')' : '❌ Missing'}`);
    console.log(`   URL: ${BOLNA_API_URL}`);
    console.log(`   Method: GET`);

    const res = await axios.get(BOLNA_API_URL, {
      headers: {
        Authorization: `Bearer ${BOLNA_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      params: options
    });

    console.log('✅ API call successful');
    console.log('📊 Raw API response count:', Array.isArray(res.data) ? res.data.length : Array.isArray(res.data.executions) ? res.data.executions.length : 'unknown');

    return Array.isArray(res.data) ? res.data : (Array.isArray(res.data.executions) ? res.data.executions : []);
  } catch (err) {
    console.error('\n❌ fetchBolnaCalls error:');
    console.error(`   Status: ${err.response?.status || 'N/A'}`);
    console.error(`   Message: ${err.message}`);
    return [];
  }
}

/* -------------------- GROQ EXTRACTION -------------------- */

async function extractDataWithGroq(transcript, userNumber, retries = 0) {
  if (!transcript || transcript.trim().length < 10) {
    return {
      name: null,
      email: null,
      phone_number: userNumber || null,
      best_time_to_call: null,
      summary: ''
    };
  }

  const systemPrompt = `You are a data extraction expert. Your task is to extract customer information from call transcripts with 100% accuracy.

EXTRACTION RULES:
1. NAME: Look for "my name is", "this is", "I am", "call me", or any person's name mentioned. Use proper capitalization.
2. EMAIL: Search for email addresses in any format (user@domain.com). Convert to lowercase. Validate it has @ and domain.
3. PHONE: Extract any phone number mentioned. Keep ONLY digits (0-9). Remove +, -, spaces, country codes if present. Look for variations like "nine eight seven..." spelled out.
4. BEST TIME TO CALL: Only extract if explicitly stated (e.g., "call me tomorrow at 2pm", "next week Monday morning"). Use exact wording from transcript.
5. SUMMARY: Write ONE clear sentence (max 40 words) describing what the customer wants or the call purpose.

OUTPUT FORMAT - Return ONLY valid JSON, nothing else:
{"name":"value or null","email":"value or null","phone_number":"value or null","best_time_to_call":"value or null","summary":"value or empty string"}

CRITICAL:
- Use null (not empty string) for name, email, phone_number, best_time_to_call if not found
- Use empty string "" for summary if nothing meaningful extracted
- Return ONLY JSON object, no text before or after
- Phone numbers must be digits only (e.g., 919876543210 not +91-98765-43210)
- Email must be lowercase and valid format`;

  const userPrompt = `Extract customer information from this call transcript. Be thorough and extract ALL available information.

TRANSCRIPT:
${transcript}

Return ONLY the JSON object:`;

  try {
    const groqInstance = initGroq();

    const completion = await groqInstance.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.05,
      max_tokens: 200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    const raw = (completion?.choices?.[0]?.message?.content || '').trim();
    
    // More robust JSON extraction
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️  No JSON found, using heuristic fallback');
      return heuristicFallback(transcript, userNumber);
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (jsonErr) {
      // Try to fix common JSON issues
      let fixed = jsonMatch[0]
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      try {
        parsed = JSON.parse(fixed);
      } catch (e) {
        console.warn('⚠️  JSON parse failed, using heuristic fallback');
        return heuristicFallback(transcript, userNumber);
      }
    }

    const normalized = validateAndNormalize(parsed, userNumber);
    return normalized || heuristicFallback(transcript, userNumber);
  } catch (err) {
    if (err.status === 429 || err.error?.code === 'rate_limit_exceeded') {
      if (retries < 3) {
        const waitTime = Math.pow(2, retries) * 10000;
        console.warn(`⏳ Rate limited. Retrying in ${waitTime / 1000}s...`);
        await new Promise(r => setTimeout(r, waitTime));
        return extractDataWithGroq(transcript, userNumber, retries + 1);
      }
    }
    console.error('❌ Groq error:', err.message);
    return heuristicFallback(transcript, userNumber);
  }
}

/* -------------------- VALIDATION -------------------- */

function validateAndNormalize(obj, userNumber) {
  if (!obj || typeof obj !== 'object') return null;

  const allowedKeys = ['name', 'email', 'phone_number', 'best_time_to_call', 'summary'];
  for (const k of Object.keys(obj)) {
    if (!allowedKeys.includes(k)) return null;
  }

  let name = (obj.name === null) ? null : String(obj.name).trim();
  if (name === '') name = null;

  let email = (obj.email === null) ? null : String(obj.email).trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    email = null;
  }

  let phone = (obj.phone_number === null) ? null : String(obj.phone_number).replace(/\D/g, '');
  if (phone === '') phone = null;

  if (!phone && userNumber) {
    const candidate = String(userNumber).replace(/\D/g, '');
    phone = candidate.length >= 7 ? candidate : null;
  }

  let bt = (obj.best_time_to_call === null) ? null : String(obj.best_time_to_call).trim();
  if (bt === '') bt = null;

  let summary = (typeof obj.summary === 'string') ? obj.summary.trim() : '';
  const words = summary.split(/\s+/).filter(Boolean);
  if (words.length > 40) summary = words.slice(0, 40).join(' ') + '...';

  return {
    name: name || null,
    email: email || null,
    phone_number: phone || null,
    best_time_to_call: bt || null,
    summary: summary || ''
  };
}

function heuristicFallback(transcript, userNumber) {
  // More aggressive extraction when LLM fails
  transcript = transcript || '';

  // NAME: Look for patterns
  let name = null;
  const namePatterns = [
    /my name is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /this is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /I'm\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /call me\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:speaking|here)/im
  ];
  for (const pattern of namePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      name = match[1].trim();
      break;
    }
  }

  // EMAIL: Look for @ symbol
  let email = null;
  const emailMatch = transcript.match(/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    email = emailMatch[1].toLowerCase();
  }

  // PHONE: Multiple patterns including spoken numbers
  let phone = null;
  const phonePatterns = [
    /(?:phone|number|call me at|reach me at|my number is)\s*:?\s*(\+?[0-9\s\-()]{7,})/i,
    /\b(\d{10})\b/,
    /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/
  ];
  
  for (const pattern of phonePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      phone = match[1].replace(/\D/g, '');
      if (phone.length >= 7) break;
    }
  }

  // Use userNumber as fallback
  if (!phone && userNumber) {
    phone = String(userNumber).replace(/\D/g, '');
    if (phone.length < 7) phone = null;
  }

  // BEST TIME TO CALL
  let bestTime = null;
  const timePatterns = [
    /(?:call me|reach me|contact me)\s+(?:on\s+)?([a-z0-9\s:ampm,\-]+)(?:\.|$)/i,
    /(?:tomorrow|today|next\s+\w+|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i
  ];
  
  for (const pattern of timePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      bestTime = match[1].trim();
      break;
    }
  }

  // SUMMARY: First meaningful sentence
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
  let summary = '';
  if (sentences.length > 0) {
    summary = sentences[0].trim().substring(0, 240);
  }

  return {
    name: name || null,
    email: email || null,
    phone_number: phone || null,
    best_time_to_call: bestTime || null,
    summary: summary || ''
  };
}

/* -------------------- SAVE TO DB -------------------- */

async function saveToDB(extractedData, call) {
  const BolnaCall = getBolnaCallModel();

  const normalizedUserNumber = call.user_number
    ? String(call.user_number).replace(/^\+?91/, '')
    : null;

  return await BolnaCall.create({
    bolna_call_id: call.id || null,
    name: extractedData.name || null,
    email: extractedData.email || null,
    phone_number: extractedData.phone_number || null,
    best_time_to_call: extractedData.best_time_to_call || null,
    summary: extractedData.summary || '',
    transcript: call.transcript || call.output?.transcript || '',
    call_duration: call.conversation_duration || 0,
    call_timestamp: call.created_at ? new Date(call.created_at) : new Date(),
    user_number: normalizedUserNumber,
    source: 'bolna-ai',
    whatsapp_status: call.whatsapp_status || call.whatsapp?.status || 'pending',
    whatsapp_message_id: call.whatsapp_message_id || call.whatsapp?.messageId || null,
    whatsapp_sent_at: call.whatsapp_sent_at ? new Date(call.whatsapp_sent_at) : null,
    whatsapp_error: call.whatsapp_error || null
  });
}

/* -------------------- CLEANUP -------------------- */

async function cleanupDatabase() {
  const BolnaCall = getBolnaCallModel();
  const result = await BolnaCall.deleteMany({});
  console.log(`🗑️  Deleted ${result.deletedCount} records from database`);
  return result.deletedCount;
}

/* -------------------- PROCESS -------------------- */

async function processBolnaCalls() {
  await connectDB();

  const BolnaCall = getBolnaCallModel();

  console.log('🔍 Database Status:');
  const beforeCleanup = await BolnaCall.countDocuments();
  console.log(`📊 Records before cleanup: ${beforeCleanup}`);

  // Clean all records to match Bolna exactly
  if (process.env.CLEANUP_DAYS === '0' || process.argv.includes('--reset')) {
    console.log('🔄 CLEANUP: Deleting ALL records to sync fresh...');
    await BolnaCall.deleteMany({});
  }

  const afterCleanup = await BolnaCall.countDocuments();
  console.log(`📊 Records after cleanup: ${afterCleanup}`);

  const calls = await fetchBolnaCalls();
  if (!Array.isArray(calls) || calls.length === 0) {
    console.log('⚠️ No calls from Bolna');
    await mongoose.connection.close();
    return;
  }

  console.log(`\n📞 Bolna API returned ${calls.length} calls`);

  let newCount = 0;
  let duplicateCount = 0;
  let whatsappCount = 0;
  let errorCount = 0;

  console.log('\n🔄 Processing calls...');
  for (let idx = 0; idx < calls.length; idx++) {
    const call = calls[idx];
    try {
      const bolnaId = call.id;

      if (!bolnaId) {
        console.warn('⚠️ Call missing ID, skipping');
        errorCount++;
        continue;
      }

      // Check for duplicates
      const exists = await BolnaCall.findOne({ bolna_call_id: bolnaId });

      if (exists) {
        duplicateCount++;
        continue;
      }

      const phone = call.user_number
        ? String(call.user_number).replace(/^\+91/, '')
        : null;

      const transcript = call.transcript || call.output?.transcript || '';

      const extracted = await extractDataWithGroq(transcript, phone);
      const savedCall = await saveToDB(extracted, call);

      newCount++;
      console.log(`✅ [${idx + 1}/${calls.length}] Saved: ${bolnaId}`);

      // 📱 SEND WHATSAPP MESSAGE
      if (extracted.phone_number) {
        console.log(`📱 Sending WhatsApp to: ${extracted.phone_number}`);
        
        const whatsappResult = await sendWhatsAppMessage(
          extracted.phone_number,
          extracted
        );

        if (whatsappResult.success) {
          await updateWhatsAppStatus(
            savedCall._id,
            'sent',
            whatsappResult.messageId
          );
          whatsappCount++;
          console.log(`✅ WhatsApp sent successfully`);
        } else {
          await updateWhatsAppStatus(
            savedCall._id,
            'failed',
            null,
            whatsappResult.error
          );
          console.error(`❌ WhatsApp failed: ${whatsappResult.error}`);
        }
      }

      await new Promise(r => setTimeout(r, 3000));

    } catch (err) {
      if (err.code === 11000) {
        duplicateCount++;
      } else {
        errorCount++;
        console.error(`❌ Error: ${err.message}`);
      }
    }
  }

  const finalCount = await BolnaCall.countDocuments();

  console.log('\n' + '═'.repeat(50));
  console.log('✅ SYNC COMPLETE');
  console.log('═'.repeat(50));
  console.log(`Bolna API returned:     ${calls.length}`);
  console.log(`New calls saved:        ${newCount}`);
  console.log(`WhatsApp messages sent: ${whatsappCount}`);
  console.log(`Duplicates skipped:     ${duplicateCount}`);
  console.log(`Errors:                 ${errorCount}`);
  console.log('─'.repeat(50));
  console.log(`Database total:         ${finalCount}`);
  console.log('═'.repeat(50));

  if (finalCount === calls.length) {
    console.log('\n✅ Perfect! Database matches Bolna API exactly.');
  }

  await mongoose.connection.close();
}

/* -------------------- RUN -------------------- */

if (process.argv[2] === '--reset') {
  connectDB()
    .then(async () => {
      const BolnaCall = getBolnaCallModel();
      const result = await BolnaCall.deleteMany({});
      console.log(`🗑️  Reset: Deleted ${result.deletedCount} records`);
      await mongoose.connection.close();
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else {
  processBolnaCalls()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = {
  processBolnaCalls,
  extractDataWithGroq,
  fetchBolnaCalls
};