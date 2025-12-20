const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const LeadForm = require("../models/LeadForm");
const Calls = require("../models/Calls");

/* =======================================================
   GET /api/forms/list-names
======================================================= */
router.get("/list-names", async (req, res) => {
  try {
    const docs = await LeadForm.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      
      success: true,
      data: docs.map(f => ({
        
        id: String(f._id),
        displayName: f.personName || "Unnamed Lead",
        phone: f.personPhone || "",
        businessEntityName: f.businessEntityName || "",
        currentDiscussion: f.currentDiscussion || "",
        createdAt: f.createdAt
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================================================
   GET /api/forms/prefill/:id
   🔥 AUTO-DETECT callId OR formId
======================================================= */
router.get("/prefill/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    let call = null;
    let form = null;

    // 1️⃣ Try as CALL ID
    call = await Calls.findById(id).lean();
    if (call) {
      form = await LeadForm.findOne({ bolnaCallId: call._id }).lean();
    }

    // 2️⃣ If not call → try as FORM ID
    if (!call) {
      form = await LeadForm.findById(id).lean();
      if (!form) {
        return res.status(404).json({ success: false, message: "No data found" });
      }
      call = await Calls.findById(form.bolnaCallId).lean();
    }

    return res.json({
      success: true,
      data: {
           bolnaCallId: call?._id || null,
        // FROM CALL
        personName: call?.name || "",
        personPhone: call?.phone_number || "",
        personEmail: call?.email || "",

        // FROM FORM
        ...(form || {})
      }
    });

  } catch (err) {
    console.error("prefill error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================================================
   POST /api/forms/:callId
   🔥 UPSERT (SAVE / UPDATE)
======================================================= */
router.post("/:callId", async (req, res) => {
  try {
    const { callId } = req.params;

    const call = await Calls.findById(callId);
    if (!call) {
      return res.status(404).json({ success: false, message: "Bolna call not found" });
    }

    const form = await LeadForm.findOneAndUpdate(
      { bolnaCallId: call._id },
      { ...req.body, bolnaCallId: call._id },
      { new: true, upsert: true }
    );

    return res.json({ success: true, data: form });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
