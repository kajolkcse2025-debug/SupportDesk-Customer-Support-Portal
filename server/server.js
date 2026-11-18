
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import ticketRoutes from "./routes/tickets.js";
import db from "./db.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing");
}

const app = express();

// Render runs behind a reverse proxy.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

app.use(session({
  name: "support.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Customer Support API is running!",
    database: db.open ? "Connected" : "Disconnected"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
