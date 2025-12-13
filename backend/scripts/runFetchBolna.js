require('dotenv').config();
const mongoose = require('mongoose');
const { fetchBolnaCalls } = require('../services/fetchBolnaCalls');

(async () => {
  try {
    await fetchBolnaCalls();
  } catch (e) {
    console.error('❌ Cron fetch failed:', e.message);
  } finally {
    await mongoose.connection.close();
  }
})();
