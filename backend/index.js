const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* ================= MIDDLEWARE (ONCE, AT TOP) ================= */
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ---------------- SANITIZER ---------------- */
app.use((req, res, next) => {
  if (typeof req.url === "string") req.url = req.url.trim();
  if (typeof req.originalUrl === "string") req.originalUrl = req.originalUrl.trim();
  next();
});

/* ---------------- LOGGER ---------------- */
app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl);
  next();
});

/* ================= ROUTES ================= */
app.use("/api/forms", require("./routes/form"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/calls", require("./routes/calls"));
app.use("/api/bolna", require("./routes/bolnaWebhook"));

/* ================= MONGODB ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

/* ---------------- HEALTH ---------------- */
app.get("/api/test", (req, res) =>
  res.json({ message: "Backend working ✅" })
);

/* ---------------- 404 ---------------- */
app.use((req, res) => {
  res.status(404).json({
    message: "Endpoint not found",
    path: req.originalUrl,
    method: req.method
  });
});

/* ---------------- SERVER ---------------- */
const PORT = process.env.PORT || 5001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
