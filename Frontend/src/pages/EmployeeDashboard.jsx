import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "animate.css";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { getIdToken } from "firebase/auth";
import { auth } from "../firebase/firebaseconfig";
import RequestFeedbackButton from "../components/RequestFeedbackButton";

export default function EmployeeDashboard() {
  const [currentPage, setPage] = useState("dashboard");
  const [comments, setComments] = useState({});
  const [feedbacks, setFeedbacks] = useState([]);
  const [profileData, setProfileData] = useState(null);

  // Fetch profile and feedback data
  const fetchEmployeeData = async () => {
    try {
      const token = await getIdToken(auth.currentUser);
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, feedbacksRes] = await Promise.all([
        axios.get("http://localhost:8000/profile", { headers }),
        axios.get("http://localhost:8000/feedbacks", { headers }),
      ]);

      setProfileData(profileRes.data);
      setFeedbacks(feedbacksRes.data);
    } catch (err) {
      console.error("❌ Failed to fetch employee data", err);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const handleAcknowledge = async (id) => {
    try {
      const token = await getIdToken(auth.currentUser);
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`http://localhost:8000/feedback/${id}/acknowledge`, {}, { headers });

      alert("✅ Feedback acknowledged!");
      await fetchEmployeeData(); // Re-fetch to get updated feedback status
    } catch (err) {
      console.error("Error acknowledging feedback", err);
      alert("❌ Failed to acknowledge");
    }
  };

  const handleCommentChange = (id, value) => {
    setComments((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmitComment = async (id) => {
    const comment = comments[id]?.trim();
    if (!comment) return alert("⚠️ Please write a comment before submitting.");

    try {
      const token = await getIdToken(auth.currentUser);
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`http://localhost:8000/feedback/${id}/comment`, { text: comment }, { headers });
alert("📝 Comment submitted!");
setComments(prev => ({ ...prev, [id]: "" }));
await fetchEmployeeData();  // re-fetch to include comment

    } catch (err) {
      console.error("Error submitting comment", err);
      alert("❌ Failed to submit comment");
    }
  };

  const renderFeedbackCards = (data) => (
    <div className="row g-4">
      {data.map((item, idx) => (
        <div key={idx} className="col-lg-6 col-md-12">
          <div className="card border-0 shadow-sm h-100 animate__animated animate__fadeInUp">
            <div className="card-body">
              <h5 className="card-title d-flex justify-content-between align-items-center">
                Feedback from {item.fromName}
                {item.acknowledged && (
                  <span className="badge bg-info">Acknowledged</span>
                )}
              </h5>
              <small className="text-muted mb-2 d-block">
                📅 Received on {item.date}
              </small>
              <hr />
              <p><strong>✅ Strengths:</strong> {item.strengths}</p>
              <p><strong>🛠️ Areas to Improve:</strong> {item.improvements}</p>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span
                  className={`badge px-3 py-2 ${
                    item.sentiment === "Positive"
                      ? "bg-success"
                      : item.sentiment === "Neutral"
                      ? "bg-warning text-dark"
                      : "bg-danger"
                  }`}
                >
                  {item.sentiment}
                </span>
                <button
                  className="btn btn-outline-primary btn-sm"
                  disabled={item.acknowledged}
                  onClick={() => handleAcknowledge(item._id)}
                >
                  Acknowledge
                </button>
              </div>
              <textarea
                className="form-control mb-2"
                rows="2"
                placeholder="Write your comment in markdown..."
                value={comments[item._id] || ""}
                onChange={(e) => handleCommentChange(item._id, e.target.value)}
              ></textarea>
              <button
                className="btn btn-outline-success btn-sm mb-3"
                onClick={() => handleSubmitComment(item._id)}
              >
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
        </div>
      ))}
    </div>
  );

return (
    <>
      <Topbar role="Employee" />
      <div className="d-flex">
        <Sidebar role="employee" onNavigate={setPage} currentPage={currentPage} />
        <div className="container-fluid p-4 animate__animated animate__fadeInUp">
          {/* Dashboard View */}
          {currentPage === "dashboard" && (
            <>
              <div className="mb-4 p-4 bg-white rounded-4 shadow-sm">
                <h3 className="fw-semibold text-primary mb-1">👋 Welcome, Employee</h3>
                <p className="text-muted mb-3">Here’s your most recent feedback.</p>
                <RequestFeedbackButton />
              </div>

              <div className="row">
                {renderFeedbackCards(
                  [...feedbacks].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2)
                )}
              </div>
            </>
          )}

          {/* Feedback History View */}
          {currentPage === "feedback" && (
            <div className="bg-white p-4 rounded-4 shadow-sm">
              <h4 className="fw-bold text-primary mb-4">📜 Feedback History</h4>
              <div className="row">
                {renderFeedbackCards(
                  [...feedbacks].sort((a, b) => new Date(b.date) - new Date(a.date))
                )}
              </div>
            </div>
          )}

          {/* Profile View */}
          {currentPage === "profile" && profileData && (
            <div className="bg-white p-4 rounded-4 shadow-sm">
              <h4 className="fw-bold text-primary mb-4">👤 Profile</h4>
              <div className="row row-cols-1 row-cols-md-2 g-3">
                <div className="col">
                  <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div className="card-body">
                      <p className="mb-3"><strong>Name:</strong> {profileData.name}</p>
                      <p className="mb-3"><strong>Role:</strong> {profileData.role}</p>
                      <p className="mb-0"><strong>Email:</strong> {profileData.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
