
import { useEffect, useState } from "react";

function TicketHistory({ ticketId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadHistory() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticketId}/history`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      console.log("History API status:", response.status);
      console.log("History API response:", data);

      if (!response.ok) {
        throw new Error(
          `Error ${response.status}: ${data.message || "Could not load history"}`
        );
      }

      setHistory(data.history || []);
    } catch (error) {
      console.error("History loading error:", error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, [ticketId]);

  if (loading) {
    return <p>Loading ticket history...</p>;
  }

  return (
    <div className="ticket-history">
      <h3>Ticket History</h3>

      {message && <p>{message}</p>}

      {history.length === 0 && !message ? (
        <p>No status changes recorded yet.</p>
      ) : (
        history.map((event) => (
          <div
            key={event.id}
            style={{
              borderLeft: "3px solid #4a90e2",
              padding: "10px 15px",
              marginBottom: "10px",
            }}
          >
            <p>
              <strong>
                {event.old_status} → {event.new_status}
              </strong>
            </p>

            <p>
              Updated by: {event.actor_name} ({event.actor_role})
            </p>

            <small>{event.created_at}</small>
          </div>
        ))
      )}

      <button onClick={loadHistory}>Refresh History</button>
    </div>
  );
}

export default TicketHistory;
