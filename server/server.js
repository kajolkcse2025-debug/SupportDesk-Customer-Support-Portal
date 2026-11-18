
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import ticketRoutes from "./routes/tickets.js";
import db from "./db.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

// Check session secret
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from .env file");
}

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

// Session configuration
app.use(session({
  name: "support.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Health check API
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Customer Support API is running!",
    database: db.open ? "Connected" : "Disconnected"
  });
});

// Authentication APIs
app.use("/api/auth", authRoutes);

// Ticket APIs
app.use("/api/tickets", ticketRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
