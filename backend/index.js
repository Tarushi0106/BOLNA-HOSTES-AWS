// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();

// /* ================= MIDDLEWARE (ONCE, AT TOP) ================= */
// app.use(cors());
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));

// /* ---------------- SANITIZER ---------------- */
// app.use((req, res, next) => {
//   if (typeof req.url === "string") req.url = req.url.trim();
//   if (typeof req.originalUrl === "string") req.originalUrl = req.originalUrl.trim();
//   next();
// });

// /* ---------------- LOGGER ---------------- */
// app.use((req, res, next) => {
//   console.log("➡️", req.method, req.originalUrl);
//   next();
// });

// /* ================= ROUTES ================= */
// app.use("/api/forms", require("./routes/form"));
// app.use("/api/auth", require("./routes/auth"));
// app.use("/api/calls", require("./routes/calls"));
// app.use("/api/bolna", require("./routes/bolnaWebhook"));

// /* ================= MONGODB ================= */
// mongoose
//   .connect(process.env.MONGODB_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch(err => {
//     console.error("❌ MongoDB error:", err.message);
//     process.exit(1);
//   });

// /* ---------------- HEALTH ---------------- */
// app.get("/api/test", (req, res) =>
//   res.json({ message: "Backend working ✅" })
// );

// /* ---------------- 404 ---------------- */
// app.use((req, res) => {
//   res.status(404).json({
//     message: "Endpoint not found",
//     path: req.originalUrl,
//     method: req.method
//   });
// });

// /* ---------------- SERVER ---------------- */
// const PORT = process.env.PORT || 5001;
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`🚀 Backend running on http://localhost:${PORT}`);
// });





// ================== IMPORTS ==================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

const app = express();

// ================== MIDDLEWARE ==================
app.use(cors());

// Body parsers
app.use(express.json({ limit: "10mb", strict: false }));
app.use(express.urlencoded({ extended: true }));

// 🔒 Sanitize accidental trailing whitespace/newlines
app.use((req, res, next) => {
  if (typeof req.url === "string") {
    req.url = req.url.replace(/[\s\r\n]+$/g, "");
  }
  if (typeof req.originalUrl === "string") {
    req.originalUrl = req.originalUrl.replace(/[\s\r\n]+$/g, "");
  }
  next();
});

// 📝 Request logging
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

// ================== MODELS ==================
const BolnaCall = require("./models/Calls");

// ================== MONGODB CONNECTION ==================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    // 🚀 Start Bolna polling AFTER DB is ready
    const { fetchBolnaCalls } = require("./services/fetchBolnaCalls");

    fetchBolnaCalls(); // run once on startup
    setInterval(fetchBolnaCalls, 60 * 1000); // every 1 minute
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

// ================== ROUTES ==================
app.use("/api/forms", require("./routes/form"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/calls", require("./routes/calls"));
app.use("/api/bolna", require("./routes/bolnaWebhook"));

// ================== DASHBOARD STATS ==================
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const total = await BolnaCall.countDocuments();

    const withEmail = await BolnaCall.countDocuments({
      email: { $exists: true, $ne: "" },
    });

    const withPhone = await BolnaCall.countDocuments({
      phone_number: { $exists: true, $ne: "" },
    });

    res.json({
      success: true,
      stats: {
        total_calls: total,
        calls_with_email: withEmail,
        calls_with_phone: withPhone,
      },
    });
  } catch (err) {
    console.error("❌ Dashboard stats error:", err);
    res.status(500).json({ success: false });
  }
});

// ================== HEALTH CHECKS ==================
app.get("/", (req, res) => {
  res.json({
    message: "Backend root — try /api/forms/list-names or /api/test",
  });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working ✅" });
});

// ================== DEBUG (TEMPORARY) ==================
app.get("/debug", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ================== GLOBAL 404 (LAST) ==================
app.use((req, res) => {
  res.status(404).json({
    message: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// ================== SERVER ==================
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

// ================== OPTIONAL AUTO PIPELINE ==================
// const { processBolnaCalls } = require("./services/bolnaService");

// setInterval(async () => {
//   try {
//     await processBolnaCalls();
//   } catch (err) {
//     console.error("❌ processBolnaCalls failed:", err.message);
//   }
// }, 30 * 1000);
