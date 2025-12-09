require("dotenv").config();
const mongoose = require("mongoose");
const Calls = require("../models/Calls");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const data = await Calls.find(
    {
      source: "bolna",
      phone_number: { $exists: true, $ne: "" }
    },
    {
      bolna_call_id: 1,
      name: 1,
      email: 1,
      phone_number: 1,
      best_time_to_call: 1,
      _id: 0
    }
  ).lean();

  console.table(data);
  process.exit(0);
})();
