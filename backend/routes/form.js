// backend/routes/form.js
const express = require("express");
const router = express.Router();

const LeadForm = require("../models/LeadForm");
const Calls = require("../models/Calls");

/* -------------------------------------------------------
   GET /api/forms/list-names
   Returns: id, name, phone, businessEntityName, discussion
-------------------------------------------------------- */
router.get('/list-names', async (req, res) => {
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
    console.error('GET /api/forms/list-names error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});




/* -------------------------------------------------------
   POST /api/forms/:callId
-------------------------------------------------------- */
router.post('/:callId', async (req, res) => {
  try {
    const { callId } = req.params;

    // SAFE destructuring
    const { filledBy = null, ...formData } = req.body;

    const call = await Calls.findById(callId);
    if (!call) {
      return res.status(404).json({ message: 'Bolna call not found' });
    }

    const form = await LeadForm.create({
      bolnaCallId: call._id,
      filledBy,          // ✅ always defined now
      ...formData        // ✅ saves full form
    });

    res.status(201).json({
      success: true,
      data: form
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});



/* -------------------------------------------------------
   GET /api/forms (light listing)
-------------------------------------------------------- */
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

/* -------------------------------------------------------
   GET /api/forms/:id (full form details)
-------------------------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const form = await LeadForm.findById(req.params.id);

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    return res.json({ success: true, data: form });
  } catch (err) {
    console.error("GET /api/forms/:id error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/* -------------------------------------------------------
   GET /api/forms/by-call/:callId
-------------------------------------------------------- */
router.get("/by-call/:callId", async (req, res) => {
  try {
    const forms = await LeadForm.find({
      bolnaCallId: req.params.callId,
    }).lean();

    return res.json({ success: true, data: forms });
  } catch (err) {
    console.error("GET /api/forms/by-call error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
