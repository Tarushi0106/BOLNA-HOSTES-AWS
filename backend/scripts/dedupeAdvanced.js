// // backend/scripts/dedupeCalls.js
// const mongoose = require('mongoose');
// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '../.env') });

// const MONGODB_URI = process.env.MONGODB_URI;
// if (!MONGODB_URI) {
//   console.error('Missing MONGODB_URI');
//   process.exit(1);
// }

// async function run() {
//   await mongoose.connect(MONGODB_URI);
//   const Calls = mongoose.model('BolnaCall', new mongoose.Schema({}, { strict: false }), 'bolnaCalls');

//   console.log('Connected, finding duplicates by whatsapp_message_id...');
//   // 1) Dedupe by whatsapp_message_id (if message id exists)
//   const duplicatesByMsg = await Calls.aggregate([
//     { $match: { whatsapp_message_id: { $exists: true, $ne: null } } },
//     { $group: { _id: '$whatsapp_message_id', ids: { $push: { id: '$_id', createdAt: '$createdAt' } }, count: { $sum: 1 } } },
//     { $match: { count: { $gt: 1 } } }
//   ]);

//   for (const d of duplicatesByMsg) {
//     // keep the most recent
//     const sorted = d.ids.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//     const idsToRemove = sorted.slice(1).map(x => x.id);
//     if (idsToRemove.length) {
//       console.log(`Removing ${idsToRemove.length} duplicates for message id ${d._id}`);
//       await Calls.deleteMany({ _id: { $in: idsToRemove } });
//     }
//   }

//   console.log('Now deduping by (phone_number + call_timestamp) for remaining duplicates...');
//   // 2) For records without message id, dedupe by phone + timestamp (string)
//   const duplicatesByPhoneTime = await Calls.aggregate([
//     { $match: { whatsapp_message_id: { $exists: false } } },
//     {
//       $group: {
//         _id: { phone: '$phone_number', ts: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S", date: "$call_timestamp" } } },
//         ids: { $push: { id: '$_id', createdAt: '$createdAt' } },
//         count: { $sum: 1 }
//       }
//     },
//     { $match: { count: { $gt: 1 } } }
//   ]);

//   for (const d of duplicatesByPhoneTime) {
//     const sorted = d.ids.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//     const idsToRemove = sorted.slice(1).map(x => x.id);
//     if (idsToRemove.length) {
//       console.log(`Removing ${idsToRemove.length} duplicates for phone/time ${JSON.stringify(d._id)}`);
//       await Calls.deleteMany({ _id: { $in: idsToRemove } });
//     }
//   }

//   console.log('Dedupe finished');
//   await mongoose.connection.close();
//   process.exit(0);
// }

// run().catch(err => {
//   console.error(err);
//   process.exit(1);
// });