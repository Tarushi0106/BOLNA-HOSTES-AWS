const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  call_id: String,
  name: String,
  email: String,
  phone_number: String,
  best_time_to_call: String,
  summary: String,
  transcript: String,
  call_duration: Number,
  call_timestamp: Date,
  user_number: String,
  source: { type: String, default: 'bolna-ai' },
  whatsapp_status: {
    type: String,
    enum: ['not_sent', 'pending', 'sent', 'failed'],
    default: 'pending'
  },
  whatsapp_message_id: String,
  whatsapp_sent_at: Date,
  whatsapp_error: String
}, {
  strict: false,
  timestamps: true
});

// If you need an index on call_id or whatsapp_message_id, define it here once.
// For example, keep this and remove index: true on the field definition (if present):
callSchema.index({ whatsapp_message_id: 1 }, { unique: false });
callSchema.index({ call_id: 1 }, { unique: false });

module.exports = mongoose.model('Calls', callSchema, 'bolnaCalls');