const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/v1/admin',  adminRoutes);

module.exports = app;