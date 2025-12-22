// const mongoose = require('mongoose');
// const Calls = require('../models/Calls'); // Adjust path to your Calls model

// async function cleanupAndAnalyze() {
//   try {
//     await mongoose.connect('mongodb+srv://tarushichaudhary_db_user:mongo@cluster0.s4kr17c.mongodb.net/bolnaCalls');
//     console.log('✅ Connected to MongoDB');
    
//     // First, let's see what we have
//     console.log('📊 Current database analysis:');
//     const totalCalls = await Calls.countDocuments();
//     console.log(`Total calls: ${totalCalls}`);
    
//     // Count duplicates by bolna_call_id
//     const duplicateGroups = await Calls.aggregate([
//       {
//         $group:  {
//           _id: "$bolna_call_id",
//           count: { $sum: 1 },
//           calls: { $push:  { _id: "$_id", createdAt: "$createdAt", name: "$name" } }
//         }
//       },
//       { $match: { count: { $gt: 1 } } },
//       { $sort: { count: -1 } }
//     ]);
    
//     console.log(`Duplicate groups found: ${duplicateGroups.length}`);
    
//     let totalDeleted = 0;
//     for (const group of duplicateGroups) {
//       // Sort by creation time, keep the earliest one
//       const sortedCalls = group.calls.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
//       const [keep, ... toDelete] = sortedCalls;
      
//       if (toDelete.length > 0) {
//         const result = await Calls.deleteMany({ 
//           _id: { $in: toDelete.map(c => c._id) } 
//         });
//         totalDeleted += result.deletedCount;
//         console.log(`✅ Kept call ${group._id}, deleted ${result.deletedCount} duplicates`);
//       }
//     }
    
//     console.log(`🧹 Cleanup complete!  Deleted ${totalDeleted} duplicate records`);
    
//     const finalCount = await Calls.countDocuments();
//     console.log(`📊 Final count: ${finalCount} calls`);
    
//     // Check name extraction issues
//     const nameIssues = await Calls.find({
//       $or: [
//         { name: /^Sia from/ },
//         { name: null },
//         { name: "" }
//       ]
//     }).limit(10);
    
//     console.log('\n📝 Sample calls with name issues:');
//     nameIssues.forEach((call, i) => {
//       console.log(`${i+1}. ID: ${call. bolna_call_id}, Name:  "${call.name}", Transcript preview: "${call.transcript?. substring(0, 100)}..."`);
//     });
    
//   } catch (error) {
//     console.error('❌ Error:', error);
//   } finally {
//     mongoose.disconnect();
//   }
// }

// cleanupAndAnalyze();