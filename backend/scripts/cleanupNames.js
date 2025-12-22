// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


// const mongoose = require('mongoose');
// const Calls = require('../models/Calls');

// // ⚠️ IMPORTANT: import Groq ONLY if key exists
// let extractNameAndSummary = null;
// if (process.env.GROQ_API_KEY) {
//   ({ extractNameAndSummary } = require('../services/groqSummary'));
// } else {
//   console.warn('⚠️ GROQ_API_KEY not found → AI extraction disabled');
// }

// /* ===================== CONFIG ===================== */

// const NAME_BLACKLIST = [
//   'digital','certification','services','solutions',
//   'teleservices','authority','institute','ratings',
//   'shaurrya', 'shaurya', 'assistant', 'agent', 'bot', 'sia'
// ];

// /* ===================== HELPERS ===================== */

// function cleanAndValidateName(raw) {
//   if (!raw) return null;

//   let name = raw
//     .toLowerCase()
//     .replace(/\b(and|my|me|is|this|hey|hello|from|calling)\b/g, '')
//     .replace(/\s+/g, ' ')
//     .trim();

//   if (name.split(' ').length < 2) return null;

//   name = name
//     .split(' ')
//     .map(w => w.charAt(0).toUpperCase() + w.slice(1))
//     .join(' ');

//   const lower = name.toLowerCase();
//   if (NAME_BLACKLIST.some(w => lower.includes(w))) return null;

//   if (!/^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/.test(name)) return null;

//   return name;
// }

// function extractNameFromTranscript(transcript, email) {
//   if (!transcript) return null;

//   const patterns = [
//     /(?:my name is|i am|this is|i'm)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/gi,
//     /(?:speaking with|talking to)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/gi,
//     /(?:hello|hi)[, ]+(?:this is )?([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/gi
//   ];

//   for (const pattern of patterns) {
//     const matches = [...transcript.matchAll(pattern)];
//     for (const m of matches) {
//       const cleaned = cleanAndValidateName(m[1]);
//       if (cleaned) return cleaned;
//     }
//   }

//   // Email fallback
//   if (email && email.includes('@')) {
//     const parts = email.split('@')[0].split(/[._-]/);
//     if (parts.length >= 2) {
//       const guess = `${parts[0]} ${parts[1]}`;
//       return cleanAndValidateName(guess);
//     }
//   }

//   return null;
// }

// /* ===================== MAIN ===================== */
// if (!process.env.MONGODB_URI) {
//   throw new Error('❌ MONGODB_URI missing in .env file');
// }

// async function reprocessNames() {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log('✅ Connected to MongoDB');

//     const calls = await Calls.find({
//       $or: [
//         { name: /sia.*shaurrya/i },
//         { name: null },
//         { name: '' }
//       ]
//     }).lean();

//     console.log(`🔧 Found ${calls.length} calls to reprocess`);

//     let fixed = 0;

//     for (let i = 0; i < calls.length; i++) {
//       const call = calls[i];
//       console.log(`\n🔄 ${i + 1}/${calls.length} → ${call.bolna_call_id}`);

//       let newName = null;

//       /* ---------- AI (optional) ---------- */
//       if (extractNameAndSummary && call.transcript) {
//         try {
//           const ai = await extractNameAndSummary(call.transcript);
//           const cleanedAI = cleanAndValidateName(ai?.name);
//           if (cleanedAI) {
//             newName = cleanedAI;
//             console.log(`🤖 AI → ${newName}`);
//           }
//         } catch {
//           console.warn('⚠️ AI failed, fallback to manual');
//         }
//       }

//       /* ---------- Manual ---------- */
//       if (!newName) {
//         newName = extractNameFromTranscript(call.transcript, call.email);
//         if (newName) console.log(`📝 Manual → ${newName}`);
//       }

//       /* ---------- Update ---------- */
//       if (newName && newName !== call.name) {
//         await Calls.updateOne(
//           { _id: call._id },
//           { $set: { name: newName } }
//         );
//         fixed++;
//       } else if (!newName && call.name?.toLowerCase().includes('sia')) {
//         await Calls.updateOne(
//           { _id: call._id },
//           { $set: { name: null } }
//         );
//         fixed++;
//       }

//       if ((i + 1) % 10 === 0) {
//         await new Promise(r => setTimeout(r, 1500));
//       }
//     }

//     console.log(`\n✅ Done. Fixed ${fixed} records.`);

//   } catch (err) {
//     console.error('❌ Fatal error:', err);
//   } finally {
//     await mongoose.disconnect();
//     console.log('👋 Disconnected');
//   }
// }

// reprocessNames();
