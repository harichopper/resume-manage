// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.options("*", cors()); // Handle preflight requests

app.use(express.json());

// ✅ Validate environment variables
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "POLLINATION_API_KEY"];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`Error: Missing environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/resumes", require("./routes/resumes"));
app.use("/v1/suggestions", require("./routes/suggestions"));

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ✅ Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", mongodb: mongoose.connection.readyState });
});

// ✅ Root endpoint (no redirect — return JSON instead)
app.get("/", (req, res) => {
  res.json({
    status: "Backend running",
    message: "Welcome to Resume Manager API",
    loginUrl: (process.env.FRONTEND_URL || "http://localhost:3000") + "/login"
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app; // ✅ Export for Vercel
