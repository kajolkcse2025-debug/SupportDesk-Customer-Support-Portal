
import { useEffect, useState } from "react";

function TicketComments({ ticketId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Load comments
  async function loadComments() {
    try {
      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticketId}/comments`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load comments");
      }

      setComments(data.comments);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, [ticketId]);

  // Add a comment
  async function handleSubmit(event) {
    event.preventDefault();

    if (!newComment.trim()) {
      setMessage("Please enter a comment.");
      return;
    }

    try {
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticketId}/comments`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: newComment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add comment");
      }

      setNewComment("");
      setMessage("Comment added successfully!");

      await loadComments();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (loading) {
    return <p>Loading comments...</p>;
  }

  return (
    <div className="comments-section">
      <h3>Ticket Discussion</h3>

      {message && <p>{message}</p>}

      <div className="comments-list">
        {comments.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-card">
              <strong>{comment.author_name}</strong>

              <small> ({comment.author_role})</small>

              <p>{comment.body}</p>

              <small>{comment.created_at}</small>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={newComment}
          onChange={(event) => setNewComment(event.target.value)}
          placeholder="Write your comment..."
          rows="3"
          maxLength="2000"
        />

        <button type="submit" disabled={!newComment.trim()}>
          Add Comment
        </button>
      </form>
    </div>
  );
}

export default TicketComments;
