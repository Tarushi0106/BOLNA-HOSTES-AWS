const mongoose = require('mongoose');

const bolnaUserNoSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      unique: true,
      sparse: true
    },
    userNumber: {
      type: String,
      required: true,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BolnaUserNo', bolnaUserNoSchema);
