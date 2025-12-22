// const mongoose = require('mongoose');
// const path = require('path');

// // Load environment variables
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// const Calls = require('../models/Calls');

// async function removeDuplicates() {
//   try {
//     const MONGO_URI = process.env.MONGO_URI || 
//                      process.env.MONGODB_URI || 
//                      'mongodb+srv://tarushichaudhary_db_user:mongo@cluster0.s4kr17c.mongodb.net/bolnaCalls';
    
//     console.log('🔄 Connecting to MongoDB...');
//     await mongoose.connect(MONGO_URI, { 
//       serverSelectionTimeoutMS: 10000,
//       socketTimeoutMS: 45000,
//     });
//     console.log('✅ Connected to MongoDB');
    
//     const beforeCount = await Calls.countDocuments();
//     console.log(`📊 Before cleanup: ${beforeCount} calls`);
    
//     // Find and remove duplicates by bolna_call_id
//     console.log('\n🧹 Finding duplicates by bolna_call_id...');
//     const duplicateGroups = await Calls.aggregate([
//       {
//         $group:  {
//           _id: "$bolna_call_id",
//           count: { $sum: 1 },
//           calls: { 
//             $push: { 
//               _id: "$_id", 
//               createdAt: "$createdAt",
//               name: "$name"
//             } 
//           }
//         }
//       },
//       { $match: { count: { $gt: 1 } } },
//       { $sort: { count: -1 } }
//     ]);
    
//     console.log(`Found ${duplicateGroups.length} groups with duplicates`);
    
//     let totalDeleted = 0;
    
//     // Remove duplicates - keep the oldest record in each group
//     for (let i = 0; i < duplicateGroups.length; i++) {
//       const group = duplicateGroups[i];
//       console.log(`\n🔄 Processing group ${i + 1}/${duplicateGroups.length}:  ${group._id}`);
//       console.log(`   Found ${group.count} copies`);
      
//       // Sort by creation date (oldest first)
//       const sortedCalls = group.calls.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
//       // Keep the first (oldest), delete the rest
//       const [keep, ... toDelete] = sortedCalls;
      
//       if (toDelete.length > 0) {
//         const deleteIds = toDelete.map(call => call._id);
//         const result = await Calls.deleteMany({ _id: { $in:  deleteIds } });
        
//         console.log(`   ✅ Kept:  ${keep._id} (${keep.createdAt})`);
//         console.log(`   🗑️ Deleted: ${result.deletedCount} duplicates`);
        
//         totalDeleted += result.deletedCount;
//       }
      
//       // Progress update every 10 groups
//       if ((i + 1) % 10 === 0) {
//         console.log(`📈 Progress: ${i + 1}/${duplicateGroups.length} groups processed`);
//       }
//     }
    
//     // Check for any remaining phone+time duplicates
//     console. log('\n🔍 Checking for remaining phone+time duplicates...');
//     const phoneTimeDuplicates = await Calls. aggregate([
//       {
//         $match: {
//           from_number: { $exists: true, $ne: null }
//         }
//       },
//       {
//         $group: {
//           _id:  {
//             from_number: "$from_number",
//             // Group by 5-minute windows
//             timeWindow: {
//               $subtract: [
//                 "$createdAt",
//                 { $mod: [{ $toLong: "$createdAt" }, 300000] } // 5 minutes in ms
//               ]
//             }
//           },
//           count: { $sum: 1 },
//           calls: { 
//             $push:  { 
//               _id: "$_id", 
//               bolna_call_id: "$bolna_call_id",
//               createdAt: "$createdAt"
//             } 
//           }
//         }
//       },
//       { $match: { count: { $gt: 1 } } }
//     ]);
    
//     console.log(`Found ${phoneTimeDuplicates.length} potential phone+time duplicates`);
    
//     // Remove phone+time duplicates (be more conservative here)
//     let phoneTimeDeleted = 0;
//     for (const group of phoneTimeDuplicates) {
//       // Only delete if calls are within 1 minute of each other and have same phone
//       const sortedCalls = group.calls. sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
//       for (let i = 1; i < sortedCalls. length; i++) {
//         const prev = sortedCalls[i - 1];
//         const curr = sortedCalls[i];
//         const timeDiff = Math.abs(new Date(curr.createdAt) - new Date(prev.createdAt));
        
//         // If within 1 minute, consider it a duplicate
//         if (timeDiff < 60000) { // 1 minute
//           await Calls.deleteOne({ _id: curr._id });
//           console.log(`🗑️ Removed phone+time duplicate: ${curr. bolna_call_id}`);
//           phoneTimeDeleted++;
//         }
//       }
//     }
    
//     const afterCount = await Calls.countDocuments();
    
//     console.log('\n🎉 Cleanup Complete!');
//     console.log(`📊 Before: ${beforeCount} calls`);
//     console.log(`📊 After: ${afterCount} calls`);
//     console.log(`🗑️ Deleted by bolna_call_id: ${totalDeleted}`);
//     console.log(`🗑️ Deleted by phone+time: ${phoneTimeDeleted}`);
//     console.log(`📉 Total reduction: ${beforeCount - afterCount} calls`);
    
//     // Verify no duplicates remain
//     const remainingDuplicates = await Calls.aggregate([
//       {
//         $group: {
//           _id: "$bolna_call_id",
//           count: { $sum: 1 }
//         }
//       },
//       { $match: { count: { $gt: 1 } } }
//     ]);
    
//     console.log(`\n✅ Verification: ${remainingDuplicates.length} duplicate groups remaining`);
    
//   } catch (error) {
//     console.error('❌ Error:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('👋 Disconnected from MongoDB');
//   }
// }

// removeDuplicates();