const cron = require('node-cron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { processBolnaCalls } = require('../services/bolnaService');

let cronJob = null;

/**
 * Start the cron job for syncing Bolna calls
 * Runs every 30 minutes
 */
function startCronJobs() {
  console.log('⏰ Initializing cron jobs...');

  // Sync Bolna calls every 30 minutes
  cronJob = cron.schedule('*/30 * * * *', async () => {
    console.log('\n🔄 [CRON] Starting Bolna sync...');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    try {
      await processBolnaCalls();
      console.log('✅ [CRON] Sync completed successfully');
    } catch (err) {
      console.error('❌ [CRON] Sync failed:', err.message);
    }
  });

  console.log('✅ Cron jobs started:');
  console.log('   📞 Bolna sync: Every 30 minutes (*/30 * * * *)');
}

/**
 * Stop all cron jobs
 */
function stopCronJobs() {
  if (cronJob) {
    cronJob.stop();
    console.log('⏹️  Cron jobs stopped');
  }
}

module.exports = {
  startCronJobs,
  stopCronJobs
};
