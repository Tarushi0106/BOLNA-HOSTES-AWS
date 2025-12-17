const mongoose = require('mongoose');

const bolnaCallSchema = new mongoose.Schema(
  {
    executionId: { type: String, unique: true, required: true },
    fromNumber: { type: String, required: true },
    toNumber: { type: String, required: true },
    status: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BolnaCall', bolnaCallSchema);
