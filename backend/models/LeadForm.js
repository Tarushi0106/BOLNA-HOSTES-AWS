// backend/models/LeadForm.js
const mongoose = require('mongoose');

const KeyPersonSchema = new mongoose.Schema({
  name: String,
  title: String,
  role: String,
  contactNo: String,
  email: String,
}, { _id: false });

const ServicesSchema = new mongoose.Schema({
  internet: {
    site1: String,
    site2: String,
    site3: String,
    existingBandwidth: String,
  },
  smartCCTV: {
    site1: String,
    site2: String,
    site3: String,
  },
  wifiAsService: {
    site1: String,
    site2: String,
    site3: String,
  },
  sdWAN: {
    site1: String,
    site2: String,
    site3: String,
  },
  cyberSecurity: {
    site1: String,
    site2: String,
    site3: String,
  },
  ispName: String,
  existingPlans: String,
  currentJioEngagement: String,
  jioSubscribers: {
    cocpNos: String,
    ioipNos: String,
    jiofi: String,
  },
}, { _id: false });

const InfrastructureSchema = new mongoose.Schema({
  totalLocations: String,
  fibre: {
    discussionInitiated: String,
    permissionReceived: String,
    wvp: String,
    completed: String,
  },
  ibs: {
    discussionInitiated: String,
    permissionReceived: String,
    wvp: String,
    completed: String,
  },
  wifi: {
    discussionInitiated: String,
    permissionReceived: String,
    wvp: String,
    completed: String,
  },
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

  services: ServicesSchema,
  infrastructure: InfrastructureSchema,

  currentDiscussion: String,
}, { timestamps: true });

module.exports = mongoose.models.LeadForm || mongoose.model('LeadForm', LeadFormSchema);
