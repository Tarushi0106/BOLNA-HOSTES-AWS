const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    product_name: String,
    otc: String,
    amc: String,
    mrc: String,
    duration: String,
    payment_frequency: String
  },
  { _id: false }
);

const LeadFormSchema = new mongoose.Schema(
  {
    // ✅ PERSONAL (from call)
    personName: String,
    personPhone: String,
    personEmail: String,
    callerPhone: String,

    // ✅ LEAD DETAILS (FROM FORM)
    company_name: String,
    contact_person: String,
    contact_no: String,
    company_email: String,
    address: String,
    lead_state: String,
    date: String,                 // Date of visit
    product_interested: String,
    remark: String,

    // ✅ PRODUCTS (optional future)
    products: [ProductSchema],

    // ✅ LINK TO CALL
    bolnaCallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Calls",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeadForm", LeadFormSchema);
