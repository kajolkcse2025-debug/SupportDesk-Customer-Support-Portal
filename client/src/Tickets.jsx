
import { useEffect, useState } from "react";
import TicketComments from "./TicketComments";
import TicketHistory from "./TicketHistory";
import "./Tickets.css";

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadTickets() {
    try {
      const response = await fetch(
        "http://localhost:5000/api/tickets",
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load tickets.");
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

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    try {
      setSubmitting(true);

      const response = await fetch(
        "http://localhost:5000/api/tickets",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            subject,
            description,
            priority,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ticket creation failed.");
      }

      setMessage("Your support ticket has been created successfully!");
      setMessageType("success");
      setSubject("");
      setDescription("");
      setPriority("Medium");

      await loadTickets();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="customer-loading">
        <div className="loading-spinner"></div>
        <p>Loading your support center...</p>
      </div>
    );
  }

  const openCount = tickets.filter(
    (ticket) => (ticket.status || "Open") === "Open"
  ).length;

  const progressCount = tickets.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;

  return (
    <div className="customer-workspace">

      {/* WELCOME */}
      <section className="customer-welcome">
        <div>
          <span className="customer-eyebrow">CUSTOMER PORTAL</span>
          <h1>Your support center</h1>
          <p>
            Manage your requests, track progress, and stay connected
            with our support team.
          </p>
        </div>
        <div className="welcome-decoration">✦</div>
      </section>

      {/* STATISTICS */}
      <section className="customer-stats">
        <div className="customer-stat-card">
          <div className="stat-icon purple">▤</div>
          <div>
            <span>Total tickets</span>
            <h2>{tickets.length}</h2>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-icon orange">◷</div>
          <div>
            <span>Open</span>
            <h2>{openCount}</h2>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-icon blue">↻</div>
          <div>
            <span>In progress</span>
            <h2>{progressCount}</h2>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-icon green">✓</div>
          <div>
            <span>Resolved</span>
            <h2>{resolvedCount}</h2>
          </div>
        </div>
      </section>

      {/* CREATE TICKET */}
      <section className="customer-create-section">
        <div className="customer-section-heading">
          <div>
            <span className="customer-eyebrow">NEED ASSISTANCE?</span>
            <h2>Create a support ticket</h2>
            <p>
              Describe your issue and our team will get back to you.
            </p>
          </div>
          <div className="customer-heading-icon">＋</div>
        </div>

        <form className="customer-ticket-form" onSubmit={handleSubmit}>
          <div className="customer-form-group">
            <label htmlFor="ticket-subject">Ticket subject</label>
            <input
              id="ticket-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Example: Unable to access my account"
              required
              maxLength={150}
            />
          </div>

          <div className="customer-form-group">
            <label htmlFor="ticket-description">Describe your issue</label>
            <textarea
              id="ticket-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explain the issue you're experiencing..."
              rows={4}
              required
              maxLength={2000}
            />
          </div>

          <div className="customer-form-bottom">
            <div className="customer-form-group priority-group">
              <label htmlFor="ticket-priority">Priority level</label>
              <select
                id="ticket-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option value="Low">Low priority</option>
                <option value="Medium">Medium priority</option>
                <option value="High">High priority</option>
              </select>
            </div>

            <button
              className="customer-submit-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit ticket →"}
            </button>
          </div>
        </form>

        {message && (
          <div
            className={`customer-message ${messageType}`}
            role="status"
          >
            {message}
          </div>
        )}
      </section>

      {/* MY TICKETS */}
      <section className="customer-ticket-section">
        <div className="customer-section-heading">
          <div>
            <span className="customer-eyebrow">YOUR ACTIVITY</span>
            <h2>My support tickets</h2>
            <p>Track your requests and communicate with support agents.</p>
          </div>

          <span className="customer-ticket-count">
            {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
          </span>
        </div>

        {tickets.length === 0 ? (
          <div className="customer-empty-state">
            <div className="customer-empty-icon">▤</div>
            <h3>No support tickets yet</h3>
            <p>Create your first ticket using the form above.</p>
          </div>
        ) : (
          <div className="customer-ticket-list">
            {tickets.map((ticket) => (
              <article className="customer-ticket-card" key={ticket.id}>
                <div className="customer-ticket-card-top">
                  <div>
                    <span className="customer-ticket-id">
                      TICKET #{ticket.id}
                    </span>
                    <h3>{ticket.subject}</h3>
                  </div>

                  <span
                    className={`customer-status-badge ${
                      (ticket.status || "Open")
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                    }`}
                  >
                    {ticket.status || "Open"}
                  </span>
                </div>

                <p className="customer-ticket-description">
                  {ticket.description}
                </p>

                <div className="customer-ticket-information">
                  <span>
                    Priority:
                    <strong
                      className={`customer-priority ${
                        (ticket.priority || "Medium").toLowerCase()
                      }`}
                    >
                      {ticket.priority || "Medium"}
                    </strong>
                  </span>

                  <span>
                    Assigned agent:
                    <strong>{ticket.agent_name || "Not assigned"}</strong>
                  </span>
                </div>

                <div className="customer-ticket-tools">
                  <TicketComments ticketId={ticket.id} />
                  <TicketHistory ticketId={ticket.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Tickets;
