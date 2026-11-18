
import { useEffect, useState } from "react";
import Auth from "./Auth";
import Tickets from "./Tickets";
import AgentDashboard from "./AgentDashboard";
import AdminDashboard from "./AdminDashboard";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/me",
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  async function handleLogout() {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  }

  if (checkingSession) {
    return <div className="app-loading">Checking your session...</div>;
  }

  if (!user) {
    return <Auth onAuthSuccess={setUser} />;
  }

  const roleNames = {
    customer: "Customer",
    agent: "Support Agent",
    admin: "Administrator",
  };

  const navigation = [
    { icon: "⌂", label: "Dashboard", href: "#dashboard" },
    { icon: "▤", label: "Tickets", href: "#tickets" },
    { icon: "◷", label: "Activity", href: "#activity" },
  ];

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">S</div>
          <h2>SupportDesk</h2>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav>
          {navigation.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              className={index === 0 ? "active" : ""}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span>✦</span>
            <div>
              <strong>Need help?</strong>
              <p>Contact your support team.</p>
            </div>
          </div>

          <p className="sidebar-version">SupportDesk v1.0</p>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOP HEADER */}
        <header className="topbar">

          <div>
            <p className="breadcrumb">Workspace / Dashboard</p>
            <h1>Dashboard</h1>
          </div>

          <div className="topbar-actions">

            <div className="user-profile">
              <div className="avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>

              <div className="user-details">
                <strong>{user.name}</strong>
                <span>{roleNames[user.role] || user.role}</span>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout ↗
            </button>

          </div>
        </header>

        {/* WELCOME SECTION */}
        <section className="welcome-section" id="dashboard">

          <div>
            <h2>Welcome back, {user.name}! 👋</h2>
            <p>
              Here's what's happening with your support workspace today.
            </p>
          </div>

          <div className="date-label">
            ✦ Support workspace
          </div>

        </section>

        {/* ROLE-BASED DASHBOARDS */}
        <section className="dashboard-content" id="tickets">

          {user.role === "customer" && (
            <Tickets />
          )}

          {user.role === "agent" && (
            <AgentDashboard />
          )}

          {user.role === "admin" && (
            <AdminDashboard />
          )}

        </section>

        {/* FOOTER */}
        <footer className="app-footer" id="activity">
          <span>SupportDesk</span>
          <span>Customer Support Management Platform</span>
        </footer>

      </main>
    </div>
  );
}

export default App;
