const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { processBolnaCalls } = require('./services/bolnaService');
const { sendWhatsAppMessage } = require('./services/whatsappService');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Request logger (keep this)
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  next();
});

/* -------------------- MongoDB -------------------- */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

/* -------------------- MODELS -------------------- */
const Calls = require('./models/Calls');
require('./models/User');

/* -------------------- AUTH ROUTES -------------------- */
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

/* -------------------- CALLS API -------------------- */
app.get('/api/calls', async (req, res) => {
  try {
    const calls = await mongoose.model('Calls')
      .find({})
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch calls' });
  }
});

/* -------------------- TEST WHATSAPP -------------------- */
app.post('/api/test-whatsapp', async (req, res) => {
  try {
    const { phone, message, name } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    const result = await sendWhatsAppMessage(phone, {
      name: name || 'Test User',
      summary: message || 'Test message'
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- HEALTH CHECK -------------------- */
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend working ✅' });
});

/* -------------------- DASHBOARD STATS -------------------- */
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const total = await Calls.countDocuments();
    const withEmail = await Calls.countDocuments({ email: { $exists: true, $ne: null, $ne: '' } });
    const withPhone = await Calls.countDocuments({ phone_number: { $exists: true, $ne: null, $ne: '' } });

    return res.json({
      success: true,
      stats: {
        total_calls: total,
        calls_with_email: withEmail,
        calls_with_phone: withPhone,
        recent_calls: total
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stats: { total_calls: 0, calls_with_email: 0, calls_with_phone: 0, recent_calls: 0 }
    });
  }
});

/* -------------------- 404 (✅ MUST BE LAST) -------------------- */
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
