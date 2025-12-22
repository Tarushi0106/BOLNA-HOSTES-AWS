// // backend/scripts/processBolnaCalls.js
// const axios = require('axios');
// const mongoose = require('mongoose');
// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '../.env') });

// const BOLNA_AGENT_ID = process.env.BOLNA_AGENT_ID;
// const BOLNA_API_KEY = process.env.BOLNA_API_KEY;
// const GROQ_API_KEY = process.env.GROQ_API_KEY;
// const MONGODB_URI = process.env.MONGODB_URI;

// if (!BOLNA_AGENT_ID || !BOLNA_API_KEY || !GROQ_API_KEY || !MONGODB_URI) {
//   console.error('❌ Missing required environment variables');
//   process.exit(1);
// }

// const BOLNA_API_URL = `https://api.bolna.ai/agent/${BOLNA_AGENT_ID}/executions`;

// let groq;
// function initGroq() {
//   if (!groq) {
//     const Groq = require('groq-sdk');
//     groq = new Groq({ apiKey: GROQ_API_KEY });
//   }
//   return groq;
// }

// async function connectDB() {
//   await mongoose.connect(MONGODB_URI);
//   console.log('✅ MongoDB connected');
// }

// function getBolnaCallModel() {
//   try {
//     return mongoose.model('BolnaCall');
//   } catch {
//     const schema = new mongoose.Schema({
//       call_id: String, // optional Bolna call id
//       name: String,
//       email: String,
//       phone_number: String,
//       best_time_to_call: String,
//       summary: String,
//       transcript: String,
//       call_duration: Number,
//       call_timestamp: Date,
//       user_number: String,
//       source: { type: String, default: 'bolna-ai' },
//       whatsapp_status: {
//         type: String,
//         enum: ['not_sent', 'pending', 'sent', 'failed'],
//         default: 'pending'
//       },
//       whatsapp_message_id: String,
//       whatsapp_sent_at: Date,
//       whatsapp_error: String,
//       createdAt: { type: Date, default: Date.now }
//     });

//     return mongoose.model('BolnaCall', schema, 'bolnaCalls');
//   }
// }

// async function fetchBolnaCalls(options = {}) {
//   try {
//     const res = await axios.get(BOLNA_API_URL, {
//       headers: {
//         Authorization: `Bearer ${BOLNA_API_KEY}`,
//         'Content-Type': 'application/json',
//         Accept: 'application/json'
//       },
//       params: options
//     });

//     console.log('DEBUG: bolna response top-level keys:', Object.keys(res.data || {}));
//     const sample = Array.isArray(res.data) ? res.data[0] : (Array.isArray(res.data.executions) ? res.data.executions[0] : res.data);
//     if (sample) {
//       console.log('DEBUG: sample execution object (truncated):', JSON.stringify(sample, (k, v) => (typeof v === 'string' && v.length > 1000) ? `${v.slice(0, 1000)}... (truncated)` : v, 2));
//     }

//     return Array.isArray(res.data) ? res.data : (Array.isArray(res.data.executions) ? res.data.executions : []);
//   } catch (err) {
//     console.error('❌ fetchBolnaCalls error:', err.message);
//     if (err.response) {
//       console.error('Status:', err.response.status, 'Body sample:', JSON.stringify(err.response.data).slice(0, 1000));
//     }
//     return [];
//   }
// }

// function heuristicsFromTranscript(transcript, userNumber) {
//   const text = (transcript || '').replace(/\n+/g, ' ').trim();
//   const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
//   const phoneMatch = text.match(/(\+?\d{7,15})/);
//   let name = null;
//   const nameMatch = text.match(/\b(?:my name is|this is|i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i);
//   if (nameMatch) {
//     name = nameMatch[1].trim();
//   } else {
//     const firstWords = text.split(/[.?!]/)[0].trim();
//     const capMatch = firstWords.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/);
//     if (capMatch) name = capMatch[1];
//   }

//   const summary = text.length > 200 ? text.slice(0, 197) + '...' : text;

//   return {
//     name: name || null,
//     email: emailMatch ? emailMatch[0] : null,
//     phone_number: phoneMatch ? phoneMatch[0] : (userNumber || null),
//     best_time_to_call: null,
//     summary: summary || null
//   };
// }

// async function extractDataWithGroq(transcript, userNumber) {
//   const MIN_TRANSCRIPT_LEN = 20;
//   if (!transcript || transcript.length < MIN_TRANSCRIPT_LEN) {
//     console.warn('WARN: transcript missing or short, using heuristics');
//     return heuristicsFromTranscript(transcript, userNumber);
//   }

//   try {
//     const groqInstance = initGroq();
//     const systemPrompt = 'Extract call details and return ONLY valid JSON with keys: name, email, phone_number, best_time_to_call, summary. Use null for missing fields.';
//     const userPrompt = `TRANSCRIPT:\n${transcript}\n\nReturn exactly one JSON object with those keys.`;

//     const completion = await groqInstance.chat.completions.create({
//       model: 'llama-3.1-8b-instant',
//       temperature: 0.05,
//       max_tokens: 400,
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: userPrompt }
//       ]
//     });

//     console.log('DEBUG: raw groq completion keys:', Object.keys(completion || {}));
//     const rawContent = (completion && completion.choices && completion.choices[0] && (completion.choices[0].message?.content || completion.choices[0].text)) || JSON.stringify(completion);
//     console.log('DEBUG: raw groq response (first 2000 chars):', String(rawContent).slice(0, 2000));

//     let jsonText = null;
//     const match = String(rawContent).match(/\{[\s\S]*\}/);
//     if (match) {
//       jsonText = match[0];
//     } else {
//       const cleaned = String(rawContent).replace(/[\u2018\u2019\u201C\u201D]/g, '"');
//       const m2 = cleaned.match(/\{[\s\S]*\}/);
//       if (m2) jsonText = m2[0];
//     }

//     if (!jsonText) {
//       console.warn('WARN: no JSON block found in LLM response, falling back to heuristics');
//       return heuristicsFromTranscript(transcript, userNumber);
//     }

//     let data;
//     try {
//       data = JSON.parse(jsonText);
//     } catch (parseErr) {
//       const fixed = jsonText.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
//       try {
//         data = JSON.parse(fixed);
//       } catch (err) {
//         console.error('ERROR: Failed to parse JSON from LLM response:', err.message);
//         console.error('JSON candidate:', jsonText.slice(0, 1000));
//         return heuristicsFromTranscript(transcript, userNumber);
//       }
//     }

//     return {
//       name: data.name ?? null,
//       email: data.email ?? null,
//       phone_number: data.phone_number || userNumber || null,
//       best_time_to_call: data.best_time_to_call ?? null,
//       summary: data.summary ?? null
//     };
//   } catch (err) {
//     console.error('❌ Groq error:', err && err.message ? err.message : err);
//     console.error('Falling back to heuristics for transcript');
//     return heuristicsFromTranscript(transcript, userNumber);
//   }
// }

// function normalizeWhatsappStatus(raw) {
//   if (!raw && raw !== 0) return 'pending';
//   const s = String(raw).toLowerCase();
//   if (s.includes('sent')) return 'sent';
//   if (s.includes('fail') || s.includes('error')) return 'failed';
//   if (s.includes('not') || s.includes('unsent') || s.includes('un_sent')) return 'not_sent';
//   if (s.includes('pending') || s.includes('waiting')) return 'pending';
//   // fallback
//   return 'pending';
// }

// async function saveToDB(extractedData, call) {
//   const BolnaCall = getBolnaCallModel();

//   const normalizedUserNumber = call.user_number ? String(call.user_number).replace(/^\+?91/, '') : null;

//   const whatsappMessageId =
//     call.whatsapp_message_id ||
//     (call.whatsapp && (call.whatsapp.message_id || call.whatsapp.messageId)) ||
//     null;

//   const whatsappSentAt =
//     call.whatsapp_sent_at ||
//     (call.whatsapp && (call.whatsapp.sent_at || call.whatsapp.sentAt)) ||
//     null;

//   const whatsappError =
//     call.whatsapp_error ||
//     (call.whatsapp && (call.whatsapp.error || (call.whatsapp.error && call.whatsapp.error.message))) ||
//     null;

//   const rawStatus =
//     (typeof call.whatsapp_status !== 'undefined' && call.whatsapp_status !== null)
//       ? call.whatsapp_status
//       : (call.whatsapp && (call.whatsapp.status || call.whatsapp.state)) || null;

//   const whatsappStatus = normalizeWhatsappStatus(rawStatus);

//   // Build an idempotent filter for upsert:
//   // Priority: whatsapp_message_id -> bolna call id (call.id or call.execution_id) -> phone + timestamp
//   const filter = whatsappMessageId
//     ? { whatsapp_message_id: whatsappMessageId }
//     : (call.id || call.execution_id)
//       ? { call_id: call.id || call.execution_id }
//       : (normalizedUserNumber && call.created_at)
//         ? { user_number: normalizedUserNumber, call_timestamp: new Date(call.created_at) }
//         : { _id: null }; // worst case - will create new (no match)

//   const update = {
//     $set: {
//       call_id: call.id || call.execution_id || undefined,
//       name: extractedData.name,
//       email: extractedData.email,
//       phone_number: extractedData.phone_number,
//       best_time_to_call: extractedData.best_time_to_call,
//       summary: extractedData.summary,
//       transcript: call.transcript || (call.transcripts && Array.isArray(call.transcripts) ? (call.transcripts[0] && (call.transcripts[0].text || call.transcripts[0].transcript)) || '' : ''),
//       call_duration: call.conversation_duration || call.duration || 0,
//       call_timestamp: call.created_at ? new Date(call.created_at) : new Date(),
//       user_number: normalizedUserNumber,
//       source: 'bolna-ai',
//       whatsapp_status: whatsappStatus,
//       whatsapp_message_id: whatsappMessageId,
//       whatsapp_sent_at: whatsappSentAt ? new Date(whatsappSentAt) : null,
//       whatsapp_error: whatsappError
//     },
//     $setOnInsert: {
//       createdAt: new Date()
//     }
//   };

//   // If filter key is {_id: null} replace with {} to allow insert (because no unique filter)
//   const realFilter = (filter._id === null) ? {} : filter;

//   // Upsert ensures unique records by the chosen filter and avoids duplicates
//   const doc = await BolnaCall.findOneAndUpdate(realFilter, update, { upsert: true, new: true });
//   console.log('Saved/Updated call to DB id=', doc._id.toString(), 'whatsapp_status=', doc.whatsapp_status, 'whatsapp_message_id=', doc.whatsapp_message_id);
//   return doc;
// }

// async function processBolnaCalls() {
//   await connectDB();

//   const calls = await fetchBolnaCalls();

//   if (!calls || calls.length === 0) {
//     console.log('⚠️ No calls found');
//     await mongoose.connection.close();
//     return;
//   }

//   for (const call of calls) {
//     try {
//       const transcript = call.transcript
//         || (call.transcripts && Array.isArray(call.transcripts) && (call.transcripts[0] && (call.transcripts[0].text || call.transcripts[0].transcript)))
//         || call.output?.transcript
//         || '';

//       const userNumber = call.user_number ? String(call.user_number).replace(/^\+91/, '') : null;
//       console.log(`Processing call. call.id=${call.id || call.execution_id || '(none)'} transcript length=${(transcript || '').length} userNumber=${userNumber}`);

//       const extracted = await extractDataWithGroq(transcript || '', userNumber);

//       console.log('Extraction result:', extracted);

//       await saveToDB(extracted, call);
//       await new Promise(r => setTimeout(r, 500));
//     } catch (err) {
//       console.error('❌ Call processing error:', err && err.message ? err.message : err);
//     }
//   }

//   await mongoose.connection.close();
//   console.log('✅ Processing done');
// }

// if (require.main === module) {
//   processBolnaCalls()
//     .then(() => process.exit(0))
//     .catch(err => {
//       console.error('Fatal error:', err);
//       process.exit(1);
//     });
// }

// module.exports = {
//   processBolnaCalls,
//   extractDataWithGroq,
//   fetchBolnaCalls
// };