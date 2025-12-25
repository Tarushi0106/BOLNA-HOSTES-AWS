const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sendWhatsAppMessage } = require('./whatsappService');

// 🔴 CHANGE THIS TO YOUR OWN NUMBER (must be WhatsApp enabled)
const TEST_PHONE = '9910205084';   // example
const TEST_NAME = 'Tarushi Test';
const TEST_OBJECT_ID = 'test-object-id-123456';

(async () => {
  try {
    console.log('🚀 Starting WhatsApp test...');

    const result = await sendWhatsAppMessage(
      TEST_PHONE,
      TEST_NAME,
      TEST_OBJECT_ID
    );

    console.log('🎉 WhatsApp test SUCCESS');
    console.log(result);
    process.exit(0);
  } catch (err) {
    console.error('🔥 WhatsApp test FAILED');
    process.exit(1);
  }
})();
