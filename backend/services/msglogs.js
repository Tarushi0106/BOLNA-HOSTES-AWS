const WhatsAppLog = require('../models/WhatsAppLog');

async function logQueued({ call, phone, requestId, template, raw }) {
  return WhatsAppLog.create({
    call_id: call._id,
    bolna_call_id: call.bolna_call_id,
    phone_number: phone,
    customer_number: phone,
    request_id: requestId || null,
    template_name: template,
    status: 'queued',
    raw_response: raw || null
  });
}

async function logFailed({ call, phone, reason, template, raw }) {
  return WhatsAppLog.create({
    call_id: call._id,
    bolna_call_id: call.bolna_call_id,
    phone_number: phone,
    customer_number: phone,
    template_name: template,
    status: 'failed',
    failure_reason: reason || 'MSG91 rejected request',
    raw_response: raw || null
  });
}

async function markSent(requestId) {
  return WhatsAppLog.findOneAndUpdate(
    { request_id: requestId },
    { status: 'sent' },
    { new: true }
  );
}

module.exports = { logQueued, logFailed, markSent };
