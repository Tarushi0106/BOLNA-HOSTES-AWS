const mongoose = require('mongoose');

const msgpayload = new mongoose.Schema({
  phone_number: String,

  // MSG91
  whatsapp_message_id: {
    type: String,
    index: true
  },
  whatsapp_status: {
    type: String,
    default: 'pending'
  },
  whatsapp_error: {
    type: String,
    default: null
  },
  whatsapp_delivery_payload: {
    type: Object,
    default: null
  },
  whatsapp_delivered_at: Date

}, { timestamps: true });

module.exports = mongoose.model('msgpayload', msgpayload);
