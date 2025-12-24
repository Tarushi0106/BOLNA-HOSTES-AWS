const { sendWhatsAppMessage } = require('./whatsappService.js');

async function testMessage() {
  try {
    const phoneNumber = '9910205084'; // Your actual number
    const name = 'Tarushi'; // Your actual name
    
    console.log('Sending WhatsApp message...');
    const result = await sendWhatsAppMessage(phoneNumber, name);
    console.log('Message sent successfully! ');
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

testMessage();