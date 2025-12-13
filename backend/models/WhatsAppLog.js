const mongoose = require('mongoose');

const WhatsAppLogSchema = new mongoose.Schema(
  {
    call_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Calls'
    },

    bolna_call_id: {
      type: String,
      required: true
    },

    phone_number: String,
    customer_number: String,

    request_id: String,

    template_name: String,

    status: {
      type: String,
      enum: ['queued', 'failed', 'sent'],
      required: true
    },

    failure_reason: String,

    raw_response: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

module.exports = mongoose.model('WhatsAppLog', WhatsAppLogSchema);
