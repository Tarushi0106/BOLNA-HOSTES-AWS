// const mongoose = require('mongoose');
// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '../.env') });

// const MONGODB_URI = process.env.MONGODB_URI;

// async function cleanupDB() {
//   try {
//     await mongoose.connect(MONGODB_URI);
//     console.log('✅ Connected to MongoDB');

//     const BolnaCall = mongoose.model('BolnaCall');
//     const result = await BolnaCall.deleteMany({});

//     console.log(`🗑️  Deleted ${result.deletedCount} records from database`);
//     console.log('✅ Database cleaned successfully');

//     await mongoose.connection.close();
//   } catch (err) {
//     console.error('❌ Cleanup error:', err.message);
//     process.exit(1);
//   }
// }

// cleanupDB();
