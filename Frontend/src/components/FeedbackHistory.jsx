import React, { useState } from "react";
import { getIdToken } from "firebase/auth";
import { auth } from "../firebase/firebaseconfig";
import axios from "axios";

export default function FeedbackHistory({ feedbacks, employees, setFeedbacks }) {
  const [showComments, setShowComments] = useState({});

  const handleUpdate = async (f, index) => {
    try {
      const token = await getIdToken(auth.currentUser);
      const headers = { Authorization: `Bearer ${token}` };
      const updatedFeedback = {
        strengths: f.strengths,
        improvements: f.improvements,
        sentiment: f.sentiment,
      };
      const id = typeof f._id === "string" ? f._id : f._id?.$oid;

      await axios.put(`http://localhost:8000/feedback/${id}`, updatedFeedback, { headers });
      alert("✅ Feedback updated");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update feedback");
    }
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...feedbacks];
    updated[index] = { ...updated[index], [field]: value };
    setFeedbacks(updated);
  };

  const toggleComments = (id) => {
    setShowComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="p-4 rounded shadow-sm bg-white">
      <h5 className="fw-bold text-primary mb-4 d-flex align-items-center gap-2">
        <i className="bi bi-clock-history"></i> Feedback History
      </h5>

      {feedbacks.map((f, i) => (
        <div
          key={f._id}
          className="bg-light rounded-4 p-4 mb-4 shadow-sm border border-1 border-light-subtle"
        >
          <p className="mb-3 fw-medium text-secondary">
            <i className="bi bi-person-circle me-2"></i>
            <strong>To:</strong> {employees.find((e) => e.value === f.to)?.label || f.to}
          </p>

          <textarea
            className="form-control mb-3"
            value={f.strengths}
            placeholder="Strengths"
            onChange={(e) => handleFieldChange(i, "strengths", e.target.value)}
            style={{ minHeight: "60px" }}
          />

          <textarea
            className="form-control mb-3"
            value={f.improvements}
            placeholder="Improvements"
            onChange={(e) => handleFieldChange(i, "improvements", e.target.value)}
            style={{ minHeight: "60px" }}
          />

          <select
            className="form-select mb-3"
            value={f.sentiment}
            onChange={(e) => handleFieldChange(i, "sentiment", e.target.value)}
          >
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <button
              className="btn btn-success btn-sm px-3"
              onClick={() => handleUpdate(f, i)}
            >
              <i className="bi bi-check-circle me-1"></i> Update
            </button>

            {f.comments?.length > 0 && (
              <button
                className="btn btn-outline-primary btn-sm px-3"
                onClick={() => toggleComments(f._id)}
              >
                <i className="bi bi-chat-left-text me-1"></i>
                {showComments[f._id] ? "Hide Comments" : "View Comments"}
              </button>
            )}
          </div>

          {/* Render Comments */}
          {showComments[f._id] && f.comments && (
            <div className="mt-4 bg-white rounded-3 p-3 border border-1 border-light-subtle">
              <strong className="d-block mb-2 text-primary">💬 Comments:</strong>
              {f.comments.map((c, idx) => (
                <div key={idx} className="border-bottom pb-2 mb-2">
                  <p className="mb-1 fw-semibold">
                    {c.byName}
                    <span className="text-muted ms-2 small">
                      {new Date(c.date).toLocaleString()}
                    </span>
                  </p>
                  <p className="mb-0 text-dark">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
