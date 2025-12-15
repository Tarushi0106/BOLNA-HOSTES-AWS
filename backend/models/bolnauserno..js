const mongoose = require("mongoose");

const BolnaUserNoSchema = new mongoose.Schema({
  executionId: { type: String, index: true },

  // 📞 USER NUMBER (CALLER)
  userNumber: { type: String, required: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BolnaUserNo", BolnaUserNoSchema);
