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
    const forms = await LeadForm.aggregate([
      { $sort: { updatedAt: -1 } }, // 🔥 latest first
      {
        $group: {
          _id: "$bolnaCallId",       // 🔥 one form per call
          doc: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { updatedAt: -1 } }
    ]);

    const data = forms.map(f => ({
      id: f._id,
      displayName: f.personName || "—",
      phone: f.personPhone || "—",
      businessEntityName: f.businessEntityName || "—",
      state: f.state || "—",
      totalEmployees: f.totalEmployees || "—",
      currentDiscussion: f.currentDiscussion || "—",
    }));

    res.json({ success: true, data });

  } catch (err) {
    console.error("❌ list-names error:", err);
    res.status(500).json({ success: false });
  }
});







/* =======================================================
   GET /api/forms/prefill/:id
    AUTO-DETECT callId OR formId
======================================================= */
router.get("/prefill/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    let call = null;
    let form = null;

    // 1 Try as CALL ID
    call = await Calls.findById(id).lean();
    if (call) {
      form = await LeadForm.findOne({ bolnaCallId: call._id }).lean();
    }

    // 2 If not call  try as FORM ID
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
    UPSERT (SAVE / UPDATE)
======================================================= */
router.post("/:callId", async (req, res) => {
  try {
    const { callId } = req.params;

    console.log(" POST /api/forms/:callId");
    console.log("CallID:", callId);
    console.log("Payload keys:", Object.keys(req.body));

    // Validate callId format
    if (!mongoose.Types.ObjectId.isValid(callId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid Call ID format" 
      });
    }

    // Find the call
 let call = await Calls.findById(callId);

// 🔥 IF NOT A CALL ID, TRY FORM ID
if (!call) {
  const existingForm = await LeadForm.findById(callId);
  if (!existingForm) {
    return res.status(404).json({
      success: false,
      error: "Neither Call nor Form found"
    });
  }

  call = await Calls.findById(existingForm.bolnaCallId);
  if (!call) {
    return res.status(404).json({
      success: false,
      error: "Linked Call not found"
    });
  }
}


    console.log(" Found call:", call._id);

    // Remove bolnaCallId from payload to avoid conflicts
    const updateData = { ...req.body };
    delete updateData.bolnaCallId;

    // Update or create form
    const form = await LeadForm.findOneAndUpdate(
      { bolnaCallId: call._id },
      { ...updateData, bolnaCallId: call._id },
      { new: true, upsert: true, runValidators: false }
    );

    console.log(" Form saved to DB:", form._id);

    return res.json({ 
      success: true, 
      data: form,
      message: "Form saved successfully"
    });

  } catch (err) {
    console.error(" POST /api/forms error:", err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || "Internal server error"
    });
  }
});

module.exports = router;
