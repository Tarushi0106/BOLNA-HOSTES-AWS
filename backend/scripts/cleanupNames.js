require('dotenv').config();
const mongoose = require('mongoose');
const Calls = require('../models/Calls');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const res = await Calls.updateMany(
    {
      source: 'bolna',
      name: {
        $in: [
          'Digital Certification',
          'Digital Connectivity',
          'Shaurya Devi',
          'Shaurrya TeleServices',
          'Shaurrya Tele Services'
        ]
      }
    },
    { $set: { name: null } }
  );

  console.log('✅ Cleaned polluted names:', res.modifiedCount);
  process.exit();
})();
