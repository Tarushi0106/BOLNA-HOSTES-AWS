require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const Calls = require('../models/Calls');

  const data = await Calls.find(
    {
      source: 'bolna',
      $or: [
        { name: { $ne: '' } },
        { email: { $ne: '' } },
        { phone_number: { $ne: '' } }
      ]
    },
    {
      bolna_call_id: 1,
      name: 1,
      email: 1,
      phone_number: 1,
      best_time_to_call: 1,
      summary: 1,
      _id: 0
    }
  ).lean();

  console.table(data);
  process.exit(0);
})();
