require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/errorHandler");
const sessionRoutes = require("./routes/session.routes");
const vocabularyRoutes = require("./routes/vocabulary.routes");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin = same-origin, curl, Postman, or Vercel rewrite proxy
      if (!origin) return callback(null, true);
      // Allow any *.vercel.app subdomain (covers preview deploys too)
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      // Allow explicitly listed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In development allow everything
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI requests are rate limited. Please wait a moment." },
});

app.use(limiter);

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    ai: !!(process.env.GOOGLE_GENAI_API_KEY || process.env.OPENAI_API_KEY),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/sessions", aiLimiter, sessionRoutes);
app.use("/api/vocabulary", vocabularyRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Vocab Agent backend running on http://localhost:${PORT}`);
  console.log(`   AI key: ${(process.env.GOOGLE_GENAI_API_KEY || process.env.OPENAI_API_KEY) ? "configured" : "MISSING - set GOOGLE_GENAI_API_KEY in .env"}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = app;
