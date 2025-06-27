import React from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { getIdToken } from "firebase/auth";
import { auth } from "../firebase/firebaseconfig";

export default function FeedbackCard({ item, acknowledged, comments, setAcknowledged, setComments }) {
  const handleAcknowledge = async () => {
    try {
      const token = await getIdToken(auth.currentUser);
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`http://localhost:8000/feedback/${item._id}/acknowledge`, {}, { headers });
      setAcknowledged((prev) => ({ ...prev, [item._id]: true }));
      alert("✅ Feedback acknowledged!");
    } catch (err) {
      console.error("Error acknowledging feedback", err);
      alert("❌ Failed to acknowledge");
    }
  };

  const handleSubmitComment = async () => {
    const comment = comments[item._id]?.trim();
    if (!comment) return alert("⚠️ Please write a comment before submitting.");

    try {
      const token = await getIdToken(auth.currentUser);
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`http://localhost:8000/feedback/${item._id}/comment`, { text: comment }, { headers });
      alert(`📝 Comment submitted for feedback`);
      setComments((prev) => ({ ...prev, [item._id]: "" }));
    } catch (err) {
      console.error("Error submitting comment", err);
      alert("❌ Failed to submit comment");
    }
  };

  return (
    <div className="card border-0 shadow-sm h-100 animate__animated animate__fadeInUp mb-4">
      <div className="card-body">
        <h5 className="card-title d-flex justify-content-between align-items-center">
          Feedback from {item.from}
          {acknowledged[item._id] && <span className="badge bg-info">Acknowledged</span>}
        </h5>
        <small className="text-muted mb-2 d-block">📅 Received on {item.date}</small>
        <hr />
        <p><strong>✅ Strengths:</strong> {item.strengths}</p>
        <p><strong>🛠️ Areas to Improve:</strong> {item.improvements}</p>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className={`badge px-3 py-2 ${item.sentiment === "Positive" ? "bg-success" : item.sentiment === "Neutral" ? "bg-warning text-dark" : "bg-danger"}`}>{item.sentiment}</span>
          <button className="btn btn-outline-primary btn-sm" disabled={acknowledged[item._id]} onClick={handleAcknowledge}>
            Acknowledge
          </button>
        </div>
        <textarea
          className="form-control mb-2"
          rows="2"
          placeholder="Write your comment in markdown..."
          value={comments[item._id] || ""}
          onChange={(e) => setComments((prev) => ({ ...prev, [item._id]: e.target.value }))}
        ></textarea>
        <button className="btn btn-outline-success btn-sm mb-3" onClick={handleSubmitComment}>
          Submit Comment
        </button>
        {comments[item._id] && comments[item._id].trim() && (
          <div className="mt-2">
            <strong>Your Comment:</strong>
            <div className="border p-2 bg-light">
              <ReactMarkdown>{comments[item._id]}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}