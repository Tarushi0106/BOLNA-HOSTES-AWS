require("dotenv").config();
const mongoose = require("mongoose");
const Calls = require("../models/Calls");
const {
  extractName,
  extractEmail,
  extractPhone,
  extractBestTime
} = require("../services/extractFields");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Mongo connected");

  // 1️⃣ Clear old extracted fields
  await Calls.updateMany(
    { source: "bolna" },
    {
      $unset: {
        name: 1,
        email: 1,
        phone_number: 1,
        best_time_to_call: 1
      }
    }
  );
  console.log("🧹 Old extracted fields cleared");

  // 2️⃣ Re-extract strictly from transcript
  const calls = await Calls.find({ source: "bolna" });
  let updated = 0;

  for (const c of calls) {
    const t = c.transcript || "";

    const name = extractName(t);
    const email = extractEmail(t);
    const phone = extractPhone(t);
    const time = extractBestTime(t);

    if (name || email || phone || time) {
      c.name = name || "";
      c.email = email || "";
      c.phone_number = phone || "";
      c.best_time_to_call = time || "";
      await c.save();
      updated++;
    }
  }

  console.log(`✅ Re-extracted data for ${updated} calls`);
  process.exit(0);
})();
