const express = require("express");
const router = express.Router();
const msg91Store = require("../store/msg91Store");

router.post("/webhook", (req, res) => {
  const payload = req.body;

  const requestId =
    payload.request_id ||
    payload.requestId ||
    payload.crqid;

  const status =
    payload.status?.toLowerCase() === "failed"
      ? "FAILED"
      : "SUCCESS";

  const errorCode = payload.code || null;
  const reason = payload.message || payload.reason || null;

  if (requestId) {
    msg91Store.set(requestId, {
      status,
      errorCode,
      reason,
      time: new Date().toISOString()
    });
  }

  console.log("📩 MSG91 stored in memory:", requestId, reason);

  res.status(200).json({ ok: true });
});

module.exports = router;
