const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./api/routes/auth");
const uploadRoutes = require("./api/routes/upload");
const userRoutes = require("./api/routes/users");
const groupRoutes = require("./api/routes/groups");
const connectionRoutes = require("./api/routes/connections");
const messageRoutes = require("./api/routes/messages");
const notificationRoutes = require("./api/routes/notifications");
const interestRoutes = require("./api/routes/interests");
const errorMiddleware = require("./api/middleware/errorMiddleware");

const app = express();

// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

// ─── SECURITY MIDDLEWARE ─────────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

const limiter = rateLimit({
  max: 5000,
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again in a few minutes.",
  },
});
app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));

app.get("/healthz", (req, res) => {
  const mongoose = require("mongoose");
  const uri = process.env.MONGO_URI || "MISSING";
  res.status(200).json({
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    readyState: mongoose.connection.readyState,
    uriStart: uri.substring(0, 20) + "...",
    timestamp: new Date()
  });
});

// ─── ROUTES ──────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/interests", interestRoutes);

// ─── ROOT REDIRECT ───────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BondUs API is running",
    version: "1.0.0",
    frontend: "https://bondus.vercel.app"
  });
});

// Redirect legacy join links to Next.js app
app.get("/join", (req, res) => {
  const { code } = req.query;
  const redirectUrl = `https://bondus.vercel.app/join${code ? `?code=${code}` : ""}`;
  res.redirect(redirectUrl);
});

// 404 Handler for API
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// Generic 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────

app.use(errorMiddleware);

module.exports = app;
