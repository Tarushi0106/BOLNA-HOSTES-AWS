const mongoose = require("mongoose");

const BolnaUserNoSchema = new mongoose.Schema({
  executionId: { type: String, unique: true, index: true },
  userNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BolnaUserNo", BolnaUserNoSchema);
