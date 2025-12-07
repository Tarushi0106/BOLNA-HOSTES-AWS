const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🔍 Configuration Check:');
console.log(`  BOLNA_AGENT_ID: ${process.env.BOLNA_AGENT_ID ? '✅' : '❌'}`);
console.log(`  BOLNA_API_KEY: ${process.env.BOLNA_API_KEY ? '✅' : '❌'}`);
console.log(`  GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✅' : '❌'}`);
console.log(`  MONGODB_URI: ${process.env.MONGODB_URI ? '✅' : '❌'}`);

const axios = require('axios');

async function testBolna() {
  console.log('\n🧪 Testing Bolna API...');
  try {
    const url = `https://api.bolna.ai/agent/${process.env.BOLNA_AGENT_ID}/executions`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${process.env.BOLNA_API_KEY}` }
    });
    console.log(`✅ Bolna API: ${res.data.length || 0} calls found`);
    return true;
  } catch (err) {
    console.log(`❌ Bolna API error: ${err.response?.status || err.code}`);
    return false;
  }
}

async function testGroq() {
  console.log('\n🧪 Testing Groq API...');
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const msg = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "OK"' }]
    });
    console.log(`✅ Groq API: Working (llama-3.1-8b-instant)`);
    return true;
  } catch (err) {
    console.log(`❌ Groq API error: ${err.message.substring(0, 100)}`);
    return false;
  }
}

async function testMongo() {
  console.log('\n🧪 Testing MongoDB...');
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    const count = await mongoose.connection.db.collection('bolnaCalls').countDocuments();
    console.log(`✅ MongoDB: ${count} records`);
    await mongoose.connection.close();
    return true;
  } catch (err) {
    console.log(`❌ MongoDB error: ${err.message.substring(0, 100)}`);
    return false;
  }
}

async function run() {
  const bolna = await testBolna();
  const groq = await testGroq();
  const mongo = await testMongo();
  
  console.log('\n' + '═'.repeat(40));
  if (bolna && groq && mongo) {
    console.log('✅ ALL SYSTEMS READY - Run: node backend/services/bolnaService.js');
  } else {
    console.log('⚠️  FIX ERRORS ABOVE BEFORE RUNNING SYNC');
  }
  console.log('═'.repeat(40));
  process.exit(!bolna || !groq || !mongo ? 1 : 0);
}

run();
