// backend/models/LeadForm.js
const mongoose = require('mongoose');

const KeyPersonSchema = new mongoose.Schema({
  name: String,
  title: String,
  role: String,
  contactNo: String,
  email: String,
}, { _id: false });

const LeadFormSchema = new mongoose.Schema({
  bolnaCallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Calls', required: false },
  filledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  personName: String,
  personPhone: String,
  personEmail: String,

  businessEntityName: String,
  state: String,
  accountManager: String,
  hoAddress: String,
  ceoName: String,
  ceoEmail: String,
  circleContactNo: String,
  panIndiaLocations: String,
  totalEmployees: String,
  annualTurnover: String,
  currentTelecomSpend: String,
  currentDataSpend: String,

  keyPerson1: KeyPersonSchema,
  keyPerson2: KeyPersonSchema,
  keyPerson3: KeyPersonSchema,

  currentDiscussion: String,
}, { timestamps: true, strict: false });

module.exports = mongoose.models.LeadForm || mongoose.model('LeadForm', LeadFormSchema);
