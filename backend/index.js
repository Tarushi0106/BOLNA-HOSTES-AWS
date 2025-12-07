// backend/index.js - UPDATED VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const { processBolnaCalls } = require('./services/bolnaService');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Add small request logger for debugging incoming requests
app.use((req, res, next) => {
	console.log(`➡️  ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
	next();
});

// ---------- MongoDB ----------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

// ---------- User Model ----------
const User = require('./models/User');

// ---------- AUTH ROUTES ----------
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: { id: user._id, name, email }
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// ---------- LOGIN ----------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ---------- GET CALLS (NO LIMIT) ----------
const Calls = require('./models/Calls');

// Replace your existing app.get('/api/calls', ...) with this handler
app.get('/api/calls', async (req, res) => {
  try {
    // support query param ?limit=50
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
    const calls = await Calls.find({})
      .sort({ createdAt: -1 })
      .limit(limit);

    // compute total number of documents in collection (unique count)
    const total = await Calls.countDocuments();

    const normalized = calls.map(c => ({
      _id: c._id,
      name: c.name || c.Name || 'N/A',
      phone_number: c.phone_number || c.Phone || c.phone || c.phone_number || 'N/A',
      email: c.email || c.Email || 'N/A',
      summary: c.summary || c.Summary || 'N/A',
      best_time_to_call: c.best_time_to_call || c.bestTimeToCall || c['Best Time to Call'] || 'N/A',
      whatsapp_status: c.whatsapp_status || 'pending',
      whatsapp_message_id: c.whatsapp_message_id || null,
      createdAt: c.createdAt
    }));

    // Return both page and total count so UI can show real totals
    res.json({ calls: normalized, total });
  } catch (err) {
    console.error('Fetch calls error:', err);
    res.status(500).json({ message: 'Failed to fetch calls' });
  }
});

// ---------- SYNC DATA FROM BOLNA WITH AI EXTRACTION ----------
app.post('/api/sync-bolna', async (req, res) => {
  try {
    console.log('🔄 Starting Bolna sync...');
    
    const result = await processBolnaCalls();
    
    res.json({
      message: 'Sync completed',
      ...result
    });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ 
      error: 'Sync failed',
      details: err.message 
    });
  }
});

// ---------- DEBUG: Count comparison ----------
app.get('/api/debug/count', async (req, res) => {
  try {
    const dbCount = await Calls.countDocuments();
    res.json({
      database_count: dbCount,
      message: `Total calls in database: ${dbCount}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- CLEAR ALL CALLS (for testing) ----------
app.post('/api/clear-calls', async (req, res) => {
  try {
    const result = await Calls.deleteMany({});
    res.json({
      message: 'All calls cleared',
      deleted: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- TEST ----------
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend working ✅' });
});

// add near other routes (before 404 handler)
const { sendWhatsAppMessage } = require('./services/whatsappService');

app.post('/api/test-whatsapp', async (req, res) => {
  try {
    const { phone, message, name } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'phone is required (include country code, e.g. 919876543210)' });
    }

    // Build minimal callData expected by whatsappService
    const callData = {
      name: name || 'Test User',
      summary: message || 'This is a test WhatsApp message from Shaurya Teleservices.',
      best_time_to_call: null,
      email: null,
      phone_number: phone
    };

    const result = await sendWhatsAppMessage(phone, callData);

    if (result.success) {
      return res.json({ success: true, messageId: result.messageId, timestamp: result.timestamp });
    } else {
      return res.status(500).json({ success: false, error: result.error || 'Unknown error from WhatsApp API' });
    }
  } catch (err) {
    console.error('Test WhatsApp error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- SCHEDULER STATUS ----------
let bolnaCronJob = null;
let bolnaCronStatus = 'stopped'; // 'running' | 'stopped'
let bolnaLastRun = null;
let bolnaNextRun = null;

// schedule in listen/start block (example: every 30 minutes)
function startBolnaCron() {
	// avoid duplicate scheduling
	if (bolnaCronJob) return;
	bolnaCronJob = cron.schedule('*/30 * * * *', async () => {
		bolnaCronStatus = 'running';
		bolnaLastRun = new Date().toISOString();
		try {
			await processBolnaCalls();
		} catch (err) {
			console.error('❌ Cron sync failed:', err?.message || err);
		} finally {
			// compute rough next run time (30 min)
			const next = new Date(Date.now() + 30 * 60 * 1000);
			bolnaNextRun = next.toISOString();
			bolnaCronStatus = 'scheduled';
		}
	}, {
		scheduled: true,
		timezone: process.env.CRON_TIMEZONE || 'UTC'
	});
	bolnaCronStatus = 'scheduled';
	bolnaNextRun = new Date(Date.now() + 30 * 60 * 1000).toISOString();
}

// Expose status endpoint
app.get('/api/scheduler/status', (req, res) => {
	res.json({
		success: true,
		scheduler: {
			name: 'bolna-sync',
			status: bolnaCronStatus,
			lastRun: bolnaLastRun,
			nextRun: bolnaNextRun,
			schedule: '*/30 * * * * (every 30 minutes)'
		}
	});
});

// Manual run endpoint
app.post('/api/scheduler/run-now', async (req, res) => {
	try {
		bolnaLastRun = new Date().toISOString();
		await processBolnaCalls();
		bolnaNextRun = new Date(Date.now() + 30 * 60 * 1000).toISOString();
		return res.json({ success: true, message: 'Manual sync completed', lastRun: bolnaLastRun });
	} catch (err) {
		console.error('Manual sync error:', err);
		return res.status(500).json({ success: false, error: err.message || err });
	}
});

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// ---------- SERVER ----------
// changed default port from 4000 to 5000 so frontend requests to :5000 match backend
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`🚀 Backend running on http://localhost:${PORT}`);
	startBolnaCron();
});