
import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";

const router = express.Router();

// Check whether the user is logged in and has the required role.
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    if (role && req.session.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action",
      });
    }

    next();
  };
}

// Check whether a user can access a particular ticket.
function canAccessTicket(ticket, user) {
  if (!ticket || !user) return false;

  if (user.role === "admin") return true;

  if (
    user.role === "customer" &&
    ticket.customer_id === user.id
  ) {
    return true;
  }

  if (
    user.role === "agent" &&
    ticket.assigned_agent_id === user.id
  ) {
    return true;
  }

  return false;
}

// CUSTOMER: Create a ticket
router.post("/", requireRole("customer"), (req, res) => {
  try {
    const { subject, description, priority } = req.body;

    if (!subject?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required",
      });
    }

    const validPriorities = ["Low", "Medium", "High"];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority",
      });
    }

    const result = db.prepare(`
      INSERT INTO tickets
      (customer_id, subject, description, priority)
      VALUES (?, ?, ?, ?)
    `).run(
      req.session.user.id,
      subject.trim(),
      description.trim(),
      priority
    );

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticketId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error("Create ticket error:", error);

    res.status(500).json({
      success: false,
      message: "Could not create ticket",
    });
  }
});

// CUSTOMER: Get dashboard statistics
router.get("/stats", requireRole("customer"), (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS open,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS inProgress,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved
      FROM tickets
      WHERE customer_id = ?
    `).get(req.session.user.id);

    res.json({
      success: true,
      stats: {
        total: stats.total || 0,
        open: stats.open || 0,
        inProgress: stats.inProgress || 0,
        resolved: stats.resolved || 0,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load statistics",
    });
  }
});

// ADMIN: Get all tickets
router.get("/all", requireRole("admin"), (req, res) => {
  try {
    const tickets = db.prepare(`
      SELECT
        t.*,
        c.name AS customer_name,
        a.name AS agent_name
      FROM tickets t
      JOIN users c ON t.customer_id = c.id
      LEFT JOIN users a ON t.assigned_agent_id = a.id
      ORDER BY t.created_at DESC
    `).all();

    res.json({ success: true, tickets });
  } catch (error) {
    console.error("Get all tickets error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load tickets",
    });
  }
});

// ADMIN: Get available agents
router.get("/agents", requireRole("admin"), (req, res) => {
  try {
    const agents = db.prepare(`
      SELECT id, name, email
      FROM users
      WHERE role = 'agent'
      ORDER BY name
    `).all();

    res.json({ success: true, agents });
  } catch (error) {
    console.error("Get agents error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load agents",
    });
  }
});

// ADMIN: Create a new support agent
router.post("/agents", requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = db.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).get(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'agent')
    `).run(
      name.trim(),
      normalizedEmail,
      passwordHash
    );

    res.status(201).json({
      success: true,
      message: "Support agent created successfully",
      agent: {
        id: result.lastInsertRowid,
        name: name.trim(),
        email: normalizedEmail,
        role: "agent",
      },
    });

  } catch (error) {
    console.error("Create agent error:", error);

    res.status(500).json({
      success: false,
      message: "Could not create support agent",
    });
  }
});

// ADMIN: Assign ticket to an agent
router.post("/:id/assign", requireRole("admin"), (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const agentId = Number(req.body.agentId);

    if (
      !Number.isInteger(ticketId) || ticketId <= 0 ||
      !Number.isInteger(agentId) || agentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket or agent ID",
      });
    }

    const agent = db.prepare(`
      SELECT id FROM users
      WHERE id = ? AND role = 'agent'
    `).get(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    const result = db.prepare(`
      UPDATE tickets
      SET assigned_agent_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(agentId, ticketId);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.json({
      success: true,
      message: "Ticket assigned successfully",
    });
  } catch (error) {
    console.error("Assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Could not assign ticket",
    });
  }
});

// AGENT: Get assigned tickets
router.get("/assigned", requireRole("agent"), (req, res) => {
  try {
    const tickets = db.prepare(`
      SELECT
        t.*,
        c.name AS customer_name
      FROM tickets t
      JOIN users c ON t.customer_id = c.id
      WHERE t.assigned_agent_id = ?
      ORDER BY t.created_at DESC
    `).all(req.session.user.id);

    res.json({ success: true, tickets });
  } catch (error) {
    console.error("Assigned tickets error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load assigned tickets",
    });
  }
});

// AGENT: Update ticket status
router.patch("/:id/status", requireRole("agent"), (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const validStatuses = ["In Progress", "Resolved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const ticket = db.prepare(`
      SELECT * FROM tickets
      WHERE id = ? AND assigned_agent_id = ?
    `).get(ticketId, req.session.user.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Assigned ticket not found",
      });
    }

    const allowedTransitions = {
      Open: "In Progress",
      "In Progress": "Resolved",
    };

    if (allowedTransitions[ticket.status] !== status) {
      return res.status(400).json({
        success: false,
        message: "This status transition is not allowed",
      });
    }

    const updateTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE tickets
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, ticketId);

      db.prepare(`
        INSERT INTO ticket_events
        (ticket_id, actor_id, old_status, new_status)
        VALUES (?, ?, ?, ?)
      `).run(
        ticketId,
        req.session.user.id,
        ticket.status,
        status
      );
    });

    updateTransaction();

    res.json({
      success: true,
      message: "Ticket status updated successfully",
    });
  } catch (error) {
    console.error("Status update error:", error);

    res.status(500).json({
      success: false,
      message: "Could not update ticket status",
    });
  }
});

// HISTORY: Get status change history
router.get("/:id/history", (req, res, next) => {
  requireRole()(req, res, next);
}, (req, res) => {
  try {
    const ticketId = Number(req.params.id);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    const ticket = db.prepare(`
      SELECT * FROM tickets WHERE id = ?
    `).get(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(ticket, req.session.user)) {
      return res.status(403).json({
        success: false,
        message: "You cannot access this ticket history",
      });
    }

    const history = db.prepare(`
      SELECT
        e.id,
        e.old_status,
        e.new_status,
        e.created_at,
        u.name AS actor_name,
        u.role AS actor_role
      FROM ticket_events e
      JOIN users u ON e.actor_id = u.id
      WHERE e.ticket_id = ?
      ORDER BY e.created_at ASC, e.id ASC
    `).all(ticketId);

    res.json({ success: true, history });
  } catch (error) {
    console.error("History error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load ticket history",
    });
  }
});

// COMMENTS: Get ticket comments
router.get("/:id/comments", (req, res, next) => {
  requireRole()(req, res, next);
}, (req, res) => {
  try {
    const ticketId = Number(req.params.id);

    const ticket = db.prepare(`
      SELECT * FROM tickets WHERE id = ?
    `).get(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(ticket, req.session.user)) {
      return res.status(403).json({
        success: false,
        message: "You cannot access these comments",
      });
    }

    const comments = db.prepare(`
      SELECT
        c.id,
        c.body,
        c.created_at,
        u.name AS author_name,
        u.role AS author_role
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC, c.id ASC
    `).all(ticketId);

    res.json({ success: true, comments });
  } catch (error) {
    console.error("Get comments error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load comments",
    });
  }
});

// COMMENTS: Add a comment
router.post("/:id/comments", (req, res, next) => {
  requireRole()(req, res, next);
}, (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const { body } = req.body;

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID",
      });
    }

    if (
      typeof body !== "string" ||
      !body.trim() ||
      body.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Comment must contain 1 to 2000 characters",
      });
    }

    const ticket = db.prepare(`
      SELECT * FROM tickets WHERE id = ?
    `).get(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!canAccessTicket(ticket, req.session.user)) {
      return res.status(403).json({
        success: false,
        message: "You cannot comment on this ticket",
      });
    }

    db.prepare(`
      INSERT INTO comments (ticket_id, author_id, body)
      VALUES (?, ?, ?)
    `).run(ticketId, req.session.user.id, body.trim());

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Add comment error:", error);

    res.status(500).json({
      success: false,
      message: "Could not add comment",
    });
  }
});

// CUSTOMER: Get only their own tickets
router.get("/", requireRole("customer"), (req, res) => {
  try {
    const tickets = db.prepare(`
      SELECT
        t.*,
        a.name AS agent_name
      FROM tickets t
      LEFT JOIN users a ON t.assigned_agent_id = a.id
      WHERE t.customer_id = ?
      ORDER BY t.created_at DESC
    `).all(req.session.user.id);

    res.json({ success: true, tickets });
  } catch (error) {
    console.error("Customer tickets error:", error);

    res.status(500).json({
      success: false,
      message: "Could not load your tickets",
    });
  }
});

export default router;
