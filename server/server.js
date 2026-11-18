
import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import ticketRoutes from "./routes/tickets.js";
import db from "./db.js";
import authRoutes from "./routes/auth.js";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing");
}

const app = express();

// SQLite-backed session storage
class SQLiteSessionStore extends session.Store {
  constructor(database) {
    super();

    this.db = database;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_expire
      ON sessions(expire);
    `);

    this.db
      .prepare("DELETE FROM sessions WHERE expire <= ?")
      .run(Date.now());
  }

  get(sid, callback) {
    try {
      const row = this.db
        .prepare("SELECT sess, expire FROM sessions WHERE sid = ?")
        .get(sid);

      if (!row) return callback(null, null);

      if (row.expire <= Date.now()) {
        this.destroy(sid, () => {});
        return callback(null, null);
      }

      callback(null, JSON.parse(row.sess));
    } catch (error) {
      callback(error);
    }
  }

  set(sid, sessionData, callback = () => {}) {
    try {
      const expiresAt = sessionData.cookie?.expires
        ? new Date(sessionData.cookie.expires).getTime()
        : Date.now() + (sessionData.cookie?.maxAge ?? 86400000);

      this.db.prepare(`
        INSERT INTO sessions (sid, sess, expire)
        VALUES (?, ?, ?)
        ON CONFLICT(sid)
        DO UPDATE SET
          sess = excluded.sess,
          expire = excluded.expire
      `).run(sid, JSON.stringify(sessionData), expiresAt);

      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  destroy(sid, callback = () => {}) {
    try {
      this.db
        .prepare("DELETE FROM sessions WHERE sid = ?")
        .run(sid);

      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  touch(sid, sessionData, callback = () => {}) {
    try {
      const expiresAt = sessionData.cookie?.expires
        ? new Date(sessionData.cookie.expires).getTime()
        : Date.now() + (sessionData.cookie?.maxAge ?? 86400000);

      this.db.prepare(`
        UPDATE sessions
        SET expire = ?
        WHERE sid = ?
      `).run(expiresAt, sid);

      callback(null);
    } catch (error) {
      callback(error);
    }
  }
}

const appSessionStore = new SQLiteSessionStore(db);

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
  store: appSessionStore,
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
