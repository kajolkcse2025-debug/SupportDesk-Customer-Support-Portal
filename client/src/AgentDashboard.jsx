
import { useEffect, useMemo, useState } from "react";
import TicketComments from "./TicketComments";
import TicketHistory from "./TicketHistory";
import API_BASE_URL from "./api";
import "./AgentDashboard.css";

function AgentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  async function loadTickets() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tickets/assigned`,
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load tickets");
      }

      setTickets(data.tickets || []);
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === "Open").length,
    inProgress: tickets.filter(t => t.status === "In Progress").length,
    resolved: tickets.filter(t => t.status === "Resolved").length,
  }), [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        (ticket.subject || "").toLowerCase().includes(searchText) ||
        (ticket.customer_name || "").toLowerCase().includes(searchText) ||
        String(ticket.id).includes(searchText);

      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  async function updateStatus(ticketId, status) {
    try {
      setUpdatingId(ticketId);
      setMessage("");
      setMessageType("");

      const response = await fetch(
        `${API_BASE_URL}/api/tickets/${ticketId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Status update failed");
      }

      setMessage("Ticket status updated successfully.");
      setMessageType("success");

      await loadTickets();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="agent-loading">
        <div className="agent-loading-spinner"></div>
        <p>Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="agent-workspace">
      {/* WELCOME */}
      <section className="agent-welcome">
        <div>
          <span className="agent-eyebrow">AGENT WORKSPACE</span>
          <h1>Welcome to your workspace</h1>
          <p>
            Manage assigned requests, assist customers, and keep
            every support ticket moving forward.
          </p>
        </div>
        <div className="agent-welcome-decoration">✦</div>
      </section>

      {/* PAGE HEADING */}
      <div className="agent-section-heading">
        <div>
          <span className="agent-eyebrow">WORKSPACE OVERVIEW</span>
          <h2>My Assigned Tickets</h2>
          <p>Here's an overview of your current support workload.</p>
        </div>

        <button
          className="agent-refresh-button"
          onClick={loadTickets}
        >
          ↻ Refresh
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={`agent-message ${messageType}`} role="status">
          <span>{messageType === "success" ? "✓" : "!"}</span>
          {message}
        </div>
      )}

      {/* STATISTICS */}
      <section className="agent-stat-grid">
        <div className="agent-stat-card purple">
          <div className="agent-stat-top">
            <span>Total Assigned</span>
            <span className="agent-stat-icon">▤</span>
          </div>
          <strong>{stats.total}</strong>
          <small>Tickets assigned to you</small>
        </div>

        <div className="agent-stat-card blue">
          <div className="agent-stat-top">
            <span>Open Tickets</span>
            <span className="agent-stat-icon">◷</span>
          </div>
          <strong>{stats.open}</strong>
          <small>Waiting to be started</small>
        </div>

        <div className="agent-stat-card orange">
          <div className="agent-stat-top">
            <span>In Progress</span>
            <span className="agent-stat-icon">↻</span>
          </div>
          <strong>{stats.inProgress}</strong>
          <small>Currently being handled</small>
        </div>

        <div className="agent-stat-card green">
          <div className="agent-stat-top">
            <span>Resolved</span>
            <span className="agent-stat-icon">✓</span>
          </div>
          <strong>{stats.resolved}</strong>
          <small>Successfully completed</small>
        </div>
      </section>

      {/* SUPPORT REQUESTS */}
      <section className="agent-ticket-section">
        <div className="agent-ticket-heading">
          <div>
            <span className="agent-eyebrow">TICKET MANAGEMENT</span>
            <h2>Support Requests</h2>
            <p>Search, filter and manage your assigned tickets.</p>
          </div>

          <span className="agent-ticket-count">
            {filteredTickets.length} of {tickets.length} tickets
          </span>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="agent-toolbar">
          <div className="agent-search-box">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search by subject, customer or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="All">All priorities</option>
            <option value="Low">Low priority</option>
            <option value="Medium">Medium priority</option>
            <option value="High">High priority</option>
          </select>

          <button
            className="agent-clear-button"
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
              setPriorityFilter("All");
            }}
          >
            Clear filters
          </button>
        </div>

        {/* TICKET LIST */}
        <div className="agent-ticket-list">
          {filteredTickets.length === 0 ? (
            <div className="agent-empty-state">
              <div>▤</div>
              <h3>No tickets found</h3>
              <p>Try changing your search or filters.</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <article className="agent-ticket-card" key={ticket.id}>
                <div className="agent-ticket-card-header">
                  <div>
                    <span className="agent-ticket-id">
                      TICKET #{ticket.id}
                    </span>
                    <h3>{ticket.subject}</h3>
                  </div>

                  <span
                    className={`agent-status-badge ${
                      (ticket.status || "Open")
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                    }`}
                  >
                    {ticket.status || "Open"}
                  </span>
                </div>

                <p className="agent-ticket-description">
                  {ticket.description}
                </p>

                <div className="agent-ticket-meta">
                  <span>
                    Customer:
                    <strong>{ticket.customer_name || "Unknown"}</strong>
                  </span>

                  <span
                    className={`agent-priority-badge ${
                      (ticket.priority || "Medium").toLowerCase()
                    }`}
                  >
                    {ticket.priority || "Medium"} Priority
                  </span>
                </div>

                <div className="agent-ticket-actions">
                  {ticket.status === "Open" && (
                    <button
                      className="agent-primary-button"
                      disabled={updatingId === ticket.id}
                      onClick={() => updateStatus(ticket.id, "In Progress")}
                    >
                      {updatingId === ticket.id
                        ? "Updating..."
                        : "Start Working →"}
                    </button>
                  )}

                  {ticket.status === "In Progress" && (
                    <button
                      className="agent-resolve-button"
                      disabled={updatingId === ticket.id}
                      onClick={() => updateStatus(ticket.id, "Resolved")}
                    >
                      {updatingId === ticket.id
                        ? "Updating..."
                        : "✓ Mark Resolved"}
                    </button>
                  )}

                  {ticket.status === "Resolved" && (
                    <span className="agent-resolved-label">
                      ✓ Ticket completed
                    </span>
                  )}
                </div>

                <div className="agent-ticket-details">
                  <TicketComments ticketId={ticket.id} />
                  <TicketHistory ticketId={ticket.id} />
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default AgentDashboard;
