// testAutoCall.js
const { handleAutomaticCall } = require('./services/autoCallHandler.js');

async function test() {
  console.log('🧪 Testing automatic call handling...');
  
  try {
    // Simulate a call
    const result = await handleAutomaticCall('9910205084', 'Tarushi');
    
    console.log('✅ Test successful!');
    console.log('ObjectId:', result.objectId);
    console.log('Lead Form URL:', result.leadFormUrl);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();