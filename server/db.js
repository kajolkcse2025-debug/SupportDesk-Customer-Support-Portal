
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use Render's persistent disk path when configured.
// Otherwise, use the existing local SQLite folder.
const databasePath =
  process.env.DATABASE_PATH ||
  path.join(__dirname, "database", "support.db");

// Make sure the database folder exists.
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

// Connect to SQLite.
const db = new Database(databasePath);

// Enable foreign key constraints.
db.pragma("foreign_keys = ON");

console.log("DATABASE LOCATION:", databasePath);
console.log("SQLite database connected!");

// Create database tables.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('customer', 'agent', 'admin')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    assigned_agent_id INTEGER,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium'
      CHECK (priority IN ('Low', 'Medium', 'High')),
    status TEXT NOT NULL DEFAULT 'Open'
      CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ticket_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    actor_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (actor_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_tickets_customer
    ON tickets(customer_id);

  CREATE INDEX IF NOT EXISTS idx_tickets_agent
    ON tickets(assigned_agent_id);

  CREATE INDEX IF NOT EXISTS idx_tickets_status
    ON tickets(status);

  CREATE INDEX IF NOT EXISTS idx_comments_ticket
    ON comments(ticket_id);

  CREATE INDEX IF NOT EXISTS idx_events_ticket
    ON ticket_events(ticket_id);
`);

console.log("Database tables created successfully!");

export default db;
