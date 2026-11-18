# SupportDesk – Customer Support Ticket Management System

## Overview
SupportDesk is a web-based customer support platform that helps customers raise support tickets and allows support agents and administrators to manage them.

## Technology Stack
- Frontend: React.js, Vite, CSS
- Backend: Node.js, Express.js
- Database: SQLite with better-sqlite3
- Authentication: Express Sessions and bcryptjs

## Main Features
- Customer registration, login and logout
- Create and track support tickets
- Agent ticket assignment and status updates
- Ticket comments and history
- Admin dashboard and ticket management
- Role-based access control
- Session-based authentication

## User Roles
- Customer: Creates and views their own tickets.
- Agent: Manages assigned tickets.
- Admin: Views all tickets and assigns agents.

## Run Locally
1. Start the backend from the `server` folder using `npm run dev` (or the configured start script).
2. Start the frontend from the `client` folder using `npm run dev`.
3. Open the frontend URL shown in the terminal.

## Security
- Passwords are hashed using bcryptjs.
- Protected routes require authentication.
- Role-based authorization restricts access to protected operations.
- SQLite foreign keys and constraints help maintain data integrity.

## Project Status
Core features implemented and basic role-based security tests completed.