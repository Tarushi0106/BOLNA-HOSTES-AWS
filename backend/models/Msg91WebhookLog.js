const mongoose = require("mongoose");

const Msg91WebhookLogSchema = new mongoose.Schema({
  requestId: String,
  customerNumber: String,
  templateName: String,

  status: {
    type: String,
    enum: ["SUCCESS", "FAILED"],
    required: true
  },

  errorCode: String,
  errorReason: String,
  rawPayload: Object
}, { timestamps: true });

module.exports = mongoose.model("Msg91WebhookLog", Msg91WebhookLogSchema);
