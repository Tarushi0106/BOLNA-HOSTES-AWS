const { processSingleBolnaCall } = require('../services/bolnaService');

(async () => {
  await processSingleBolnaCall({
    id: 'test-call-123',
    status: 'completed',
    transcript: 'My number is 9267996225',
    telephony_data: {
      from_number: '+919910205084'
    }
  });

  console.log('✅ Test completed');
  process.exit(0);
})();
