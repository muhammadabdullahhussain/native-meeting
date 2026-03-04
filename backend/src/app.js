const path = require("path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
// const hpp = require('hpp');
// const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require("./api/routes/auth");
const uploadRoutes = require("./api/routes/upload");
const userRoutes = require("./api/routes/users");
const groupRoutes = require("./api/routes/groups");
const connectionRoutes = require("./api/routes/connections");
const messageRoutes = require("./api/routes/messages");
const notificationRoutes = require("./api/routes/notifications");
const interestRoutes = require("./api/routes/interests");
const referralController = require("./api/controllers/referralController");
const webController = require("./api/controllers/webController");
const errorMiddleware = require("./api/middleware/errorMiddleware");

const app = express();

// ─── VIEW ENGINE & STATIC FILES ──────────────────────────────────────────────
app.use(expressLayouts);
app.set("layout", "layout"); // default layout
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../public")));

// ─── MIDDLEWARE ─────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: "*", // For development, allow all origins to prevent mobile connection issues
    credentials: true,
  }),
);

// ─── SECURITY MIDDLEWARE ─────────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "*"],
        connectSrc: ["'self'", "*"],
      },
    },
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
// app.use(mongoSanitize()); // Deprecated in Express 5 (re-assignment conflict)
// app.use(hpp()); // Deprecated in Express 5 (re-assignment conflict)

// ─── ROUTES ──────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/interests", interestRoutes);

// ─── WEB ROUTES ──────────────────────────────────────────────────────────────

app.get("/", webController.home);
app.get("/about", webController.about);
app.get("/safety", webController.safety);
app.get("/help", webController.help);
app.get("/legal", webController.legal);
app.get("/pricing", webController.pricing);
app.get("/join", referralController.renderJoinPage);

// 404 Handler for API
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// 404 Handler for Web
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────

app.use(errorMiddleware);

module.exports = app;
