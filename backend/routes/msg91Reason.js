const express = require("express");
const router = express.Router();
const msg91Store = require("../store/msg91Store");

/**
 * GET reason by requestId
 */
router.get("/:requestId", (req, res) => {
  const { requestId } = req.params;

  const data = msg91Store.get(requestId);

  if (!data) {
    return res.status(404).json({
      success: false,
      reason: null,
      message: "Reason not available (webhook not received or server restarted)"
    });
  }

  res.json({
    success: true,
    requestId,
    status: data.status,
    reason: data.reason,
    errorCode: data.errorCode,
    receivedAt: data.time
  });
});

module.exports = router;
