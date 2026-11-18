
import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";

const router = express.Router();

// CUSTOMER REGISTRATION
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether email already exists
    const existingUser = db.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).get(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert customer into database
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'customer')
    `).run(name.trim(), normalizedEmail, passwordHash);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: result.lastInsertRowid,
        name: name.trim(),
        email: normalizedEmail,
        role: "customer"
      }
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during registration"
    });
  }
});

// CUSTOMER / AGENT / ADMIN LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = db.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).get(normalizedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Regenerate session after successful login
    req.session.regenerate((error) => {
      if (error) {
        console.error("Session error:", error);

        return res.status(500).json({
          success: false,
          message: "Could not create login session"
        });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      return res.json({
        success: true,
        message: "Login successful",
        user: req.session.user
      });
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during login"
    });
  }
});

// CHECK CURRENT LOGIN
router.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "Not logged in"
    });
  }

  res.json({
    success: true,
    user: req.session.user
  });
});

// LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Logout failed"
      });
    }

    res.clearCookie("support.sid");

    res.json({
      success: true,
      message: "Logged out successfully"
    });
  });
});

export default router;
