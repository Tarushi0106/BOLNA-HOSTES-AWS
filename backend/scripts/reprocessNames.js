// // scripts/reprocessNames.js
// const mongoose = require('mongoose');
// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '../.env') });

// const Calls = require('../models/Calls');
// const { extractNameAndSummary } = require('../services/groqSummary');

// (async () => {
//   await mongoose.connect(process.env.MONGODB_URI);

//   const calls = await Calls.find({ source: 'bolna' });

//   for (const call of calls) {
//     const { name, summary } = await extractNameAndSummary(call.transcript || '');

//     await Calls.updateOne(
//       { _id: call._id },
//       { $set: { name: name || '', summary: summary || call.summary } }
//     );

//     console.log('✅ Reprocessed:', call.bolna_call_id, '->', name || '(blank)');
//   }

//   process.exit();
// })();
