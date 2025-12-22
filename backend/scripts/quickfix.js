// const mongoose = require('mongoose');
// const path = require('path');

// // Load environment variables from the parent directory
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// const Calls = require('../models/Calls');

// async function quickCleanup() {
//   try {
//     // Use the same connection string from your bolnaService.js
//   // ❌ remove hardcoded URI completely
// const MONGO_URI =
//   process.env.MONGODB_URI ||
//   process.env.MONGODB_URI;

// if (!MONGO_URI) {
//   throw new Error('MongoDB URI not found in env');
// }

    
//     console.log('🔄 Connecting to MongoDB...');
//     await mongoose.connect(MONGO_URI, { 
//       serverSelectionTimeoutMS: 10000,
//       socketTimeoutMS: 45000,
//     });
//     console.log('✅ Connected to MongoDB');
    
//     // First, let's see what we have
//     const before = {
//       total: await Calls. countDocuments(),
//       siaNames: await Calls.countDocuments({ name: /sia.*shaurrya/i }),
//       nullNames: await Calls.countDocuments({ name: null })
//     };
    
//     console.log('📊 Before cleanup:');
//     console.log(`Total calls: ${before.total}`);
//     console.log(`"Sia" names: ${before. siaNames}`);
//     console.log(`Null names: ${before.nullNames}`);
    
//     // Reset all "Sia from Shaurrya" names to null
//     const result1 = await Calls.updateMany(
//       { name: /sia.*shaurrya/i },
//       { name: null }
//     );
//     console.log(`✅ Reset ${result1.modifiedCount} "Sia from Shaurrya" names to null`);
    
//     // Extract names from email addresses where possible
//     const callsWithEmail = await Calls.find({
//       name: null,
//       email: { $exists: true, $ne: null, $ne: '', $regex: /@/ }
//     });
    
//     console.log(`🔄 Processing ${callsWithEmail.length} calls with emails... `);
    
//     let emailFixed = 0;
//     for (const call of callsWithEmail) {
//       try {
//         const emailPart = call.email.split('@')[0];
//         const nameParts = emailPart.split(/[._-]/);
        
//         // Skip if it contains known non-names or test accounts
//         const lowerEmail = emailPart.toLowerCase();
//         if (lowerEmail.includes('tarushi') || 
//             lowerEmail. includes('juhi') ||
//             lowerEmail.includes('test') ||
//             lowerEmail.includes('admin') ||
//             lowerEmail.includes('noreply') ||
//             lowerEmail.includes('support')) {
//           continue;
//         }
        
//         if (nameParts.length >= 2) {
//           const extractedName = nameParts
//             . slice(0, 2)
//             .filter(part => part.length > 0)
//             .map(part => part.charAt(0).toUpperCase() + part.slice(1))
//             .join(' ');
          
//           // Only use if it looks like a real name
//           if (extractedName. length >= 3 && 
//               extractedName.match(/^[A-Z][a-z]+(\s[A-Z][a-z]+){1,2}$/
// ) &&
//               !extractedName.toLowerCase().includes('gmail') &&
//               !extractedName.toLowerCase().includes('email')) {
            
//             await Calls.findByIdAndUpdate(call._id, { name: extractedName });
//             console.log(`📧 ${call.email} → "${extractedName}"`);
//             emailFixed++;
//           }
//         }
//       } catch (error) {
//         console.warn(`⚠️ Error processing email ${call. email}:`, error.message);
//       }
//     }
    
//     console.log(`✅ Extracted ${emailFixed} names from email addresses`);
    
//     // Also try to extract real names from transcript for remaining null names
//     const remainingNullNames = await Calls.find({
//       name: null,
//       transcript: { $exists: true, $ne: null, $ne: '' }
//     }).limit(50); // Limit to avoid timeout
    
//     console.log(`🔄 Trying to extract names from ${remainingNullNames.length} transcripts...`);
    
//     let transcriptFixed = 0;
//     for (const call of remainingNullNames) {
//       try {
//         const transcript = call.transcript;
        
//         // Simple pattern matching for common name introductions
//        const namePatterns = [
//   /my name is ([A-Z][a-z]+(\s[A-Z][a-z]+)?)/i,
//   /this is ([A-Z][a-z]+(\s[A-Z][a-z]+)?)/i,
//   /i am ([A-Z][a-z]+(\s[A-Z][a-z]+)?)/i,
//   /i'm ([A-Z][a-z]+(\s[A-Z][a-z]+)?)/i
// ];

        
//         for (const pattern of namePatterns) {
//           const match = transcript.match(pattern);
//           if (match && match[1]) {
//           let extractedName = match[1]
//   .toLowerCase()
//   .replace(/\b(and|my|is|this|hey|assistant|calling)\b/g, '')
//   .replace(/\s+/g, ' ')
//   .trim();

// // Capitalize
// extractedName = extractedName
//   .split(' ')
//   .map(w => w.charAt(0).toUpperCase() + w.slice(1))
//   .join(' ');

            
//             // Skip if it contains blacklisted words
//             const lowerName = extractedName. toLowerCase();
//             if (!lowerName.includes('sia') && 
//                 !lowerName.includes('shaurrya') && 
//                 !lowerName.includes('assistant') &&
//                 !lowerName.includes('calling') &&
//                 extractedName.length >= 2) {
              
//               await Calls.findByIdAndUpdate(call._id, { name: extractedName });
//               console.log(`📝 Transcript "${call.bolna_call_id. substring(0, 8)}..." → "${extractedName}"`);
//               transcriptFixed++;
//               break;
//             }
//           }
//         }
//       } catch (error) {
//         console.warn(`⚠️ Error processing transcript for ${call.bolna_call_id}:`, error.message);
//       }
//     }
    
//     console.log(`✅ Extracted ${transcriptFixed} names from transcripts`);
    
//     // Final stats
//     const after = {
//       total: await Calls.countDocuments(),
//       validNames: await Calls. countDocuments({
//         name:  { $exists: true, $ne: null, $ne: '', $not: /sia.*shaurrya/i }
//       }),
//       nullNames: await Calls.countDocuments({ name: null }),
//       siaNames: await Calls.countDocuments({ name: /sia.*shaurrya/i })
//     };
    
//     console.log('\n📊 After cleanup:');
//     console.log(`Total calls: ${after.total}`);
//     console.log(`Valid names: ${after.validNames} (${Math.round((after.validNames/after.total)*100)}%)`);
//     console.log(`Null names: ${after.nullNames}`);
//     console.log(`"Sia" names remaining: ${after.siaNames}`);
    
//     const improvement = after.validNames - (before.total - before.siaNames - before.nullNames);
//     console.log(`\n🎉 Improvement: +${improvement} valid names extracted! `);
//     console.log(`📧 From emails: ${emailFixed}`);
//     console.log(`📝 From transcripts: ${transcriptFixed}`);
    
//   } catch (error) {
//     console.error('❌ Error:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('👋 Disconnected from MongoDB');
//   }
// }

// quickCleanup();