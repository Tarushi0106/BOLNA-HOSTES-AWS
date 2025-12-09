/***********************
 * backend/index.js
 ***********************/
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

/* -------------------- MODELS (LOAD ONCE) -------------------- */
const BolnaCall = require('./models/Calls');

/* -------------------- MONGODB -------------------- */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');

    // ✅ Start Bolna polling AFTER DB ready
    const { fetchBolnaCalls } = require('./services/fetchBolnaCalls');

    fetchBolnaCalls(); // run once on boot

    setInterval(() => {
      fetchBolnaCalls();
    }, 60 * 1000);
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

/* -------------------- ROUTES -------------------- */
const authRoutes = require('./routes/auth');
const callsRoutes = require('./routes/calls');

app.use('/api/auth', authRoutes);
app.use('/api/calls', callsRoutes);

/* -------------------- DASHBOARD STATS -------------------- */
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const total = await BolnaCall.countDocuments();
    const withEmail = await BolnaCall.countDocuments({
      email: { $exists: true, $ne: '' }
    });
    const withPhone = await BolnaCall.countDocuments({
      phone_number: { $exists: true, $ne: '' }
    });

    res.json({
      success: true,
      stats: {
        total_calls: total,
        calls_with_email: withEmail,
        calls_with_phone: withPhone
      }
    });
  } catch (err) {
    console.error('❌ Dashboard stats error:', err);
    res.status(500).json({ success: false });
  }
});

/* -------------------- HEALTH -------------------- */
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend working ✅' });
});

/* -------------------- 404 -------------------- */
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

/* -------------------- WHATSAPP SCHEDULER -------------------- */
const { sendPendingWhatsAppMessages } = require('./services/bolnaService');

// Run once at startup (non-blocking)
(async () => {
  try {
    console.log('🔁 Running pending WhatsApp send once at startup...');
    const res = await sendPendingWhatsAppMessages({ limit: 50 });
    console.log('🔁 Startup WhatsApp run result:', res);
  } catch (err) {
    console.error('🔴 Startup WhatsApp run failed:', err?.message || err);
  }
})();

// Schedule job every 5 minutes
cron.schedule('* * * * *', async () => {
  try {
    console.log('⏰ Cron: sendPendingWhatsAppMessages starting...');
    const result = await sendPendingWhatsAppMessages({ limit: 50 });
    console.log('⏰ Cron: sendPendingWhatsAppMessages completed:', result);
  } catch (err) {
    console.error('⏰ Cron error sending WhatsApp:', err?.message || err);
  }
}, {
  scheduled: true,
  timezone: process.env.CRON_TIMEZONE || 'UTC'
});

/* -------------------- SERVER -------------------- */
const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
