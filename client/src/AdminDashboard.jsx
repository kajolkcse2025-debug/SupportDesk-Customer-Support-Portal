
import { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "./api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPassword, setAgentPassword] = useState("");
  const [creatingAgent, setCreatingAgent] = useState(false);

  async function loadData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);

    try {
      const [ticketResponse, agentResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tickets/all`, {
          credentials: "include",
        }),
        fetch(`${API_BASE_URL}/api/tickets/agents`, {
          credentials: "include",
        }),
      ]);

      const ticketData = await ticketResponse.json();
      const agentData = await agentResponse.json();

      if (!ticketResponse.ok) {
        throw new Error(ticketData.message || "Could not load tickets.");
      }

      if (!agentResponse.ok) {
        throw new Error(agentData.message || "Could not load agents.");
      }

      setTickets(ticketData.tickets || []);
      setAgents(agentData.agents || []);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createAgent(event) {
    event.preventDefault();

    if (!agentName.trim() || !agentEmail.trim() || !agentPassword) {
      setMessage("Please fill in all agent details.");
      setMessageType("error");
      return;
    }

    if (agentPassword.length < 8) {
      setMessage("Agent password must contain at least 8 characters.");
      setMessageType("error");
      return;
    }

    try {
      setCreatingAgent(true);
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/tickets/agents`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: agentName.trim(),
            email: agentEmail.trim(),
            password: agentPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not create agent.");
      }

      setAgentName("");
      setAgentEmail("");
      setAgentPassword("");

      await loadData();

      setMessage("Support agent created successfully!");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setCreatingAgent(false);
    }
  }

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "Open").length,
    inProgress: tickets.filter((ticket) => ticket.status === "In Progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
    closed: tickets.filter((ticket) => ticket.status === "Closed").length,
    highPriority: tickets.filter((ticket) => ticket.priority === "High").length,
    unassigned: tickets.filter((ticket) => !ticket.assigned_agent_id).length,
  }), [tickets]);

  const workload = useMemo(() => {
    return agents.map((agent) => ({
      ...agent,
      assigned: tickets.filter(
        (ticket) => Number(ticket.assigned_agent_id) === Number(agent.id)
      ).length,
    }));
  }, [agents, tickets]);

  const filteredTickets = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        String(ticket.id).includes(searchText) ||
        (ticket.subject || "").toLowerCase().includes(searchText) ||
        (ticket.customer_name || "").toLowerCase().includes(searchText) ||
        (ticket.agent_name || "").toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  async function assignAgent(ticketId) {
    const agentId = selectedAgents[ticketId];

    if (!agentId) {
      setMessage("Please select an agent before assigning this ticket.");
      setMessageType("error");
      return;
    }

    try {
      setAssigningTicket(ticketId);
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/tickets/${ticketId}/assign`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agentId: Number(agentId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Assignment failed.");
      }

      setMessage("Ticket assigned successfully.");
      setMessageType("success");

      setSelectedAgents((previous) => {
        const updated = { ...previous };
        delete updated[ticketId];
        return updated;
      });

      await loadData();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setAssigningTicket(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
  }

  const statusItems = [
    { label: "Open", value: stats.open, color: "open" },
    { label: "In progress", value: stats.inProgress, color: "progress" },
    { label: "Resolved", value: stats.resolved, color: "resolved" },
    { label: "Closed", value: stats.closed, color: "closed" },
  ];

  const maxWorkload = Math.max(
    1,
    ...workload.map((agent) => agent.assigned)
  );

  if (loading) {
    return (
      <div className="admin-v2-loading">
        <div className="admin-v2-spinner" />
        <h3>Loading administration workspace</h3>
        <p>Collecting ticket and team information...</p>
      </div>
    );
  }

  return (
    <div className="admin-v2">
      <section className="admin-v2-intro">
        <div>
          <span className="admin-v2-eyebrow">ADMINISTRATION / OVERVIEW</span>
          <h2>Operations dashboard</h2>
          <p>
            Monitor support activity, manage your team and keep customer
            requests moving.
          </p>
        </div>

        <button
          className="admin-v2-refresh"
          onClick={() => loadData(true)}
          disabled={refreshing}
        >
          <span>{refreshing ? "↻" : "⟳"}</span>
          {refreshing ? "Refreshing..." : "Refresh data"}
        </button>
      </section>

      {message && (
        <div className={`admin-v2-message ${messageType}`}>
          <span>{messageType === "success" ? "✓" : "!"}</span>
          <p>{message}</p>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <section className="admin-v2-metrics">
        <article className="admin-v2-metric metric-purple">
          <div className="admin-v2-metric-heading">
            <span>Total tickets</span>
            <span className="admin-v2-metric-icon">▤</span>
          </div>
          <strong>{stats.total}</strong>
          <small>All customer requests</small>
          <div className="admin-v2-metric-bottom">
            <span>Overall volume</span>
          </div>
        </article>

        <article className="admin-v2-metric metric-blue">
          <div className="admin-v2-metric-heading">
            <span>Open tickets</span>
            <span className="admin-v2-metric-icon">◷</span>
          </div>
          <strong>{stats.open}</strong>
          <small>Waiting for support</small>
          <div className="admin-v2-metric-bottom">
            <span>Needs attention</span>
          </div>
        </article>

        <article className="admin-v2-metric metric-orange">
          <div className="admin-v2-metric-heading">
            <span>In progress</span>
            <span className="admin-v2-metric-icon">↻</span>
          </div>
          <strong>{stats.inProgress}</strong>
          <small>Currently being handled</small>
          <div className="admin-v2-metric-bottom">
            <span>Active requests</span>
          </div>
        </article>

        <article className="admin-v2-metric metric-green">
          <div className="admin-v2-metric-heading">
            <span>Resolved</span>
            <span className="admin-v2-metric-icon">✓</span>
          </div>
          <strong>{stats.resolved}</strong>
          <small>Successfully completed</small>
          <div className="admin-v2-metric-bottom">
            <span>Completed requests</span>
          </div>
        </article>
      </section>

      <section className="admin-v2-analytics">
        <article className="admin-v2-panel">
          <div className="admin-v2-panel-header">
            <div>
              <span className="admin-v2-eyebrow">REPORTING</span>
              <h3>Ticket status</h3>
              <p>Current distribution of support requests</p>
            </div>
            <span className="admin-v2-live">LIVE DATA</span>
          </div>

          <div className="admin-v2-status-content">
            <div className="admin-v2-donut">
              <div className="admin-v2-donut-center">
                <strong>{stats.total}</strong>
                <span>Total tickets</span>
              </div>

              {stats.total > 0 && (
                <div
                  className="admin-v2-donut-chart"
                  style={{
                    background: `conic-gradient(
                      #8b78ff 0% ${(stats.open / stats.total) * 100}%,
                      #4298ed ${(stats.open / stats.total) * 100}% ${((stats.open + stats.inProgress) / stats.total) * 100}%,
                      #31bb88 ${((stats.open + stats.inProgress) / stats.total) * 100}% ${((stats.open + stats.inProgress + stats.resolved) / stats.total) * 100}%,
                      #64748b ${((stats.open + stats.inProgress + stats.resolved) / stats.total) * 100}% 100%
                    )`,
                  }}
                />
              )}
            </div>

            <div className="admin-v2-status-legend">
              {statusItems.map((item) => (
                <div className="admin-v2-legend-row" key={item.label}>
                  <span className={`admin-v2-legend-dot ${item.color}`} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="admin-v2-panel">
          <div className="admin-v2-panel-header">
            <div>
              <span className="admin-v2-eyebrow">TEAM PERFORMANCE</span>
              <h3>Agent workload</h3>
              <p>Tickets currently assigned to each agent</p>
            </div>
            <span className="admin-v2-agent-count">
              {agents.length} agents
            </span>
          </div>

          {workload.length === 0 ? (
            <div className="admin-v2-empty-state">
              <span>◎</span>
              <strong>No agents available</strong>
              <p>Support agents will appear here when added.</p>
            </div>
          ) : (
            <div className="admin-v2-workload-list">
              {workload.map((agent) => (
                <div className="admin-v2-workload-item" key={agent.id}>
                  <div className="admin-v2-workload-top">
                    <div className="admin-v2-agent-identity">
                      <div className="admin-v2-agent-avatar">
                        {(agent.name || "A").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{agent.name}</strong>
                        <small>{agent.email}</small>
                      </div>
                    </div>
                    <strong className="admin-v2-workload-number">
                      {agent.assigned}
                    </strong>
                  </div>

                  <div className="admin-v2-progress-track">
                    <div
                      className="admin-v2-progress-fill"
                      style={{
                        width: `${(agent.assigned / maxWorkload) * 100}%`,
                      }}
                    />
                  </div>

                  <small className="admin-v2-assigned-caption">
                    {agent.assigned} assigned{" "}
                    {agent.assigned === 1 ? "ticket" : "tickets"}
                  </small>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="admin-v2-create-agent">
        <div className="admin-v2-create-agent-heading">
          <span className="admin-v2-eyebrow">TEAM MANAGEMENT</span>
          <h3>Create a support agent</h3>
          <p>
            Add a new member to your support team. They can log in using
            the email and password you provide.
          </p>
        </div>

        <form className="admin-v2-agent-form" onSubmit={createAgent}>
          <div className="admin-v2-agent-form-field">
            <label htmlFor="new-agent-name">Full name</label>
            <input
              id="new-agent-name"
              type="text"
              placeholder="Enter agent name"
              value={agentName}
              onChange={(event) => setAgentName(event.target.value)}
              required
            />
          </div>

          <div className="admin-v2-agent-form-field">
            <label htmlFor="new-agent-email">Email address</label>
            <input
              id="new-agent-email"
              type="email"
              placeholder="agent@example.com"
              value={agentEmail}
              onChange={(event) => setAgentEmail(event.target.value)}
              required
            />
          </div>

          <div className="admin-v2-agent-form-field">
            <label htmlFor="new-agent-password">Temporary password</label>
            <input
              id="new-agent-password"
              type="password"
              placeholder="At least 8 characters"
              value={agentPassword}
              onChange={(event) => setAgentPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          <button type="submit" disabled={creatingAgent}>
            {creatingAgent ? "Creating..." : "+ Create agent"}
          </button>
        </form>
      </section>

      <section className="admin-v2-attention">
        <div className="admin-v2-attention-intro">
          <div className="admin-v2-attention-symbol">!</div>
          <div>
            <h3>Needs your attention</h3>
            <p>Review requests that may need administrator action.</p>
          </div>
        </div>

        <div className="admin-v2-attention-item">
          <strong>{stats.highPriority}</strong>
          <span>High-priority tickets</span>
        </div>

        <div className="admin-v2-attention-item">
          <strong>{stats.unassigned}</strong>
          <span>Unassigned tickets</span>
        </div>
      </section>

      <section className="admin-v2-tickets">
        <div className="admin-v2-ticket-heading">
          <div>
            <span className="admin-v2-eyebrow">SUPPORT OPERATIONS</span>
            <h3>All support tickets</h3>
            <p>Search, review and assign customer requests.</p>
          </div>

          <span className="admin-v2-result-count">
            {filteredTickets.length} of {tickets.length} tickets
          </span>
        </div>

        <div className="admin-v2-filters">
          <div className="admin-v2-search">
            <span>⌕</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by ticket, customer or agent..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label="Filter by priority"
          >
            <option value="All">All priorities</option>
            <option value="High">High priority</option>
            <option value="Medium">Medium priority</option>
            <option value="Low">Low priority</option>
          </select>

          <button
            className="admin-v2-clear"
            onClick={clearFilters}
            type="button"
          >
            Clear filters
          </button>
        </div>

        <div className="admin-v2-table-wrap">
          <table className="admin-v2-table">
            <thead>
              <tr>
                <th>Ticket details</th>
                <th>Customer</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned agent</th>
                <th>Assignment</th>
              </tr>
            </thead>

            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="admin-v2-no-results">
                      <strong>No tickets found</strong>
                      <span>Try changing your search or filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <div className="admin-v2-ticket-details">
                        <strong>
                          #{ticket.id} · {ticket.subject}
                        </strong>
                        <small>{ticket.description}</small>
                      </div>
                    </td>

                    <td>
                      <span className="admin-v2-customer">
                        {ticket.customer_name || "Customer"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-v2-badge priority-${(
                          ticket.priority || "Medium"
                        ).toLowerCase()}`}
                      >
                        {ticket.priority || "Medium"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-v2-badge status-${(
                          ticket.status || "Open"
                        ).toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {ticket.status || "Open"}
                      </span>
                    </td>

                    <td>
                      <span className="admin-v2-agent-name">
                        {ticket.agent_name || "Not assigned"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-v2-assign-controls">
                        <select
                          value={
                            selectedAgents[ticket.id] ??
                            ticket.assigned_agent_id?.toString() ??
                            ""
                          }
                          onChange={(event) =>
                            setSelectedAgents((previous) => ({
                              ...previous,
                              [ticket.id]: event.target.value,
                            }))
                          }
                          aria-label={`Select agent for ticket ${ticket.id}`}
                        >
                          <option value="">Select agent</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={assigningTicket === ticket.id}
                          onClick={() => assignAgent(ticket.id)}
                        >
                          {assigningTicket === ticket.id ? "..." : "Assign"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="admin-v2-footer">
        <span>SUPPORTDESK</span>
        <span>ADMINISTRATION WORKSPACE</span>
      </footer>
    </div>
  );
}

export default AdminDashboard;
