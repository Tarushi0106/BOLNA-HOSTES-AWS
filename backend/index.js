const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors());
app.use(express.json());

// sanitize accidental trailing whitespace/newlines
app.use((req, res, next) => {
  if (typeof req.url === 'string') req.url = req.url.replace(/[\s\r\n]+$/g, '');
  if (typeof req.originalUrl === 'string') req.originalUrl = req.originalUrl.replace(/[\s\r\n]+$/g, '');
  next();
});

// request logging
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

/* -------------------- MODELS -------------------- */
const BolnaCall = require('./models/Calls');

/* -------------------- MONGODB -------------------- */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');

    // Start Bolna polling AFTER DB ready
    // require service lazily (it will use process.env etc)
    const { fetchBolnaCalls } = require('./services/fetchBolnaCalls');
    fetchBolnaCalls(); // run once at boot
    setInterval(fetchBolnaCalls, 60 * 1000);
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

/* -------------------- ROUTES -------------------- */
/*
  IMPORTANT:
  Your router file lives at ./routes/form.js (singular).
  We mount it at /api/form so all routes inside become /api/form/...
*/
// app.post('/api/conversation/test', (req, res) => {
//   console.log('🧪 TEST ENDPOINT HIT');
//   res.json({ success: true, body: req.body });
// });
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/forms', require('./routes/form'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/calls', require('./routes/calls'));

app.use('/api/msg91', require('./routes/msg91Webhook'));


/* -------------------- DASHBOARD STATS -------------------- */
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const total = await BolnaCall.countDocuments();
    const withEmail = await BolnaCall.countDocuments({ email: { $exists: true, $ne: '' } });
    const withPhone = await BolnaCall.countDocuments({ phone_number: { $exists: true, $ne: '' } });

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

/* -------------------- HEALTH & API ROOT -------------------- */
app.get('/', (req, res) => {
  res.json({ message: 'Backend root — try /api/form/list-names or /api/test' });
});
app.get('/api/test', (req, res) => res.json({ message: 'Backend working ✅' }));

/* -------------------- DEBUG route (temporary) -------------------- */
app.get('/debug', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

/* -------------------- GLOBAL 404 (MUST BE LAST) -------------------- */
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found', path: req.originalUrl, method: req.method });
});



/* -------------------- SERVER (single instance) -------------------- */
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});


const { processBolnaCalls } = require('./services/bolnaService');

// 🔁 AUTO-RUN BOLNA → WHATSAPP PIPELINE EVERY 30 SECONDS
// setInterval(async () => {
//   try {
//     await processBolnaCalls();
//   } catch (err) {
//     console.error('❌ processBolnaCalls failed:', err.message);
//   }
// }, 30 * 1000);
