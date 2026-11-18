# 🎫 SupportDesk – Customer Support Ticket Management System

A full-stack customer support platform designed to simplify ticket management and improve communication between customers, support agents, and administrators.

## 📌 Overview

SupportDesk is a web-based application where customers can raise and track support tickets, agents can manage assigned tickets, and administrators can oversee support operations through a centralized dashboard.

## ✨ Key Features

- **Customer Portal:** Register, log in, create tickets, and track ticket status.
- **Agent Dashboard:** View assigned tickets, update statuses, and manage customer comments.
- **Admin Dashboard:** View all tickets, assign agents, and monitor ticket statistics.
- **Ticket History:** Track ticket updates and conversations.
- **Role-Based Access:** Different permissions for customers, agents, and administrators.
- **Session Authentication:** Secure login sessions and protected routes.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | SQLite, better-sqlite3 |
| Authentication | Express Sessions, bcryptjs |

## 📂 Project Structure

```text
customer-support-portal/
│
├── client/                 # React frontend
│   └── src/
│       ├── Auth.jsx
│       ├── Tickets.jsx
│       ├── AgentDashboard.jsx
│       ├── AdminDashboard.jsx
│       └── ...
│
├── server/                 # Express backend
│   ├── routes/
│   │   ├── auth.js
│   │   └── tickets.js
│   ├── db.js
│   └── server.js
│
├── .gitignore
├── README.md
└── package.json
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd customer-support-portal
```

https://github.com/kajolkcse2025-debug/SupportDesk-Customer-Support-Portal

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Start the backend

```bash
npm run dev
```

### 4. Install frontend dependencies

Open a new terminal:

```bash
cd client
npm install
```

### 5. Start the frontend

```bash
npm run dev
```

Open the local frontend URL displayed in your terminal.

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| Customer | Create and track support tickets |
| Agent | Manage assigned tickets and update statuses |
| Admin | Manage tickets and assign support agents |

## 🔐 Security

- Password hashing using bcryptjs.
- Session-based authentication.
- Protected API routes.
- Role-based authorization.
- SQLite database constraints.

## 🚀 Project Status

Core application features have been implemented, including customer, agent, and administrator workflows.

## 👩‍💻 Built With

React • Node.js • Express • SQLite • JavaScript

---

**SupportDesk – Making Customer Support Management Simpler.**
