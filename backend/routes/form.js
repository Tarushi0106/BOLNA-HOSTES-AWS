const express = require("express");
const router = express.Router();

const LeadForm = require("../models/LeadForm");
const Calls = require("../models/Calls");

/* =======================================================
   GET /api/forms/list-names
   Dropdown / sidebar listing
======================================================= */
router.get("/list-names", async (req, res) => {
  try {
    const docs = await LeadForm.find({})
      .sort({ createdAt: -1 })
      .lean();

    const mapped = docs.map(f => ({
      id: String(f._id),
      displayName: f.personName || f.ceoName || "Unnamed Lead",
      phone: f.personPhone || null,
      businessEntityName: f.businessEntityName || "—",
      currentDiscussion: f.currentDiscussion || "—",
      createdAt: f.createdAt
    }));

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error("GET /api/forms/list-names error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================================================
   POST /api/forms/:callId
   Save filled form
======================================================= */
router.post("/:callId", async (req, res) => {
  try {
    const { callId } = req.params;
    const { filledBy = null, ...formData } = req.body;

    const call = await Calls.findById(callId);
    if (!call) {
      return res.status(404).json({ success: false, message: "Bolna call not found" });
    }

    const form = await LeadForm.create({
      bolnaCallId: call._id,
      filledBy,
      ...formData
    });

    return res.status(201).json({
      success: true,
      data: form
    });
  } catch (err) {
    console.error("POST /api/forms/:callId error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================================================
   GET /api/forms
   Light list (dashboard table)
======================================================= */
router.get("/", async (req, res) => {
  try {
    const forms = await LeadForm.find({})
      .select("personName personPhone businessEntityName currentDiscussion createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: forms });
  } catch (err) {
    console.error("GET /api/forms error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================================================
   GET /api/forms/by-call/:callId
   All forms linked to a Bolna call
======================================================= */
router.get("/by-call/:callId", async (req, res) => {
  try {
    const forms = await LeadForm.find({
      bolnaCallId: req.params.callId
    }).lean();

    return res.json({ success: true, data: forms });
  } catch (err) {
    console.error("GET /api/forms/by-call error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* =======================================================
   GET /api/forms/:id
   FULL filled form (⚠️ MUST BE LAST)
======================================================= */
router.get("/:id", async (req, res) => {
  try {
    const form = await LeadForm.findById(req.params.id).lean();

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    return res.json({
      success: true,
      data: form
    });
  } catch (err) {
    console.error("GET /api/forms/:id error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
/* =======================================================
   GET /api/forms/prefill/:callId
   Prefill from BolnaCalls + LeadForm
======================================================= */
router.get("/prefill/:callId", async (req, res) => {
  try {
    const { callId } = req.params;

    // 1️⃣ Fetch Bolna Call
    const call = await Calls.findById(callId).lean();
    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Bolna call not found"
      });
    }

    // 2️⃣ Fetch LeadForm (if already filled)
    const form = await LeadForm.findOne({
      bolnaCallId: callId
    }).lean();

    // 3️⃣ Merge response
    return res.json({
      success: true,
      data: {
        // 🔹 FROM BOLNA CALL
        personName: call.name || "",
        personPhone: call.phone_number || "",
        personEmail: call.email || "",

        // 🔹 FROM FORM (if exists)
        ...(form || {})
      }
    });

  } catch (err) {
    console.error("GET /api/forms/prefill error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
