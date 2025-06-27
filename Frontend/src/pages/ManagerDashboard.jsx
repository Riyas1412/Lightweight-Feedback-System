import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import Select from "react-select";
import axios from "axios";
import { getIdToken } from "firebase/auth";
import { auth } from "../firebase/firebaseconfig";
import FeedbackHistory from "../components/FeedbackHistory";
import "animate.css";
import { toast } from "react-hot-toast";


Chart.register(ArcElement, Tooltip, Legend);

const tagOptions = [
  { value: "communication", label: "Communication" },
  { value: "leadership", label: "Leadership" },
  { value: "technical", label: "Technical Skills" },
  { value: "collaboration", label: "Collaboration" },
];

export default function ManagerDashboard() {
  const [currentPage, setPage] = useState("dashboard");
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [form, setForm] = useState({ strengths: "", improvements: "", sentiment: "", tags: [] });
  const [feedbacks, setFeedbacks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await getIdToken(user, true);
          const headers = { Authorization: `Bearer ${token}` };

          const [empRes, profRes] = await Promise.all([
            axios.get("http://localhost:8000/employees", { headers }),
            axios.get("http://localhost:8000/profile", { headers }),
          ]);

          const profileData = profRes.data;

          if (!profileData.uid) {
            console.error("❌ Profile UID missing.");
            return;
          }

          const fbRes = await axios.get(
            `http://localhost:8000/api/feedbacks/from/${profileData.uid}`,
            { headers }
          );

          setProfile(profileData);
          setEmployees(
            empRes.data.map((emp) => ({
              value: emp.uid,
              label: `${emp.name} (${emp.designation || "Employee"})`,
            }))
          );

          setFeedbacks(fbRes.data.map((f) => ({ ...f, _id: f._id?.$oid || f._id })));
        } catch (err) {
          console.error("Error fetching dashboard data:", err);
        }
      } else {
        console.warn("No authenticated user found");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmitFeedback = async () => {
  if (!selectedEmp || !form.strengths || !form.improvements || !form.sentiment) {
    toast.error("⚠️ Please fill all required fields.");
    return;
  }

  if (!profile?.uid) {
    toast.error("❌ Profile not loaded.");
    return;
  }

  const feedbackPayload = {
    to: selectedEmp.value,
    strengths: form.strengths,
    improvements: form.improvements,
    sentiment: form.sentiment,
    tags: form.tags.map((t) => t.value),
  };

  try {
    const token = await getIdToken(auth.currentUser);
    const headers = { Authorization: `Bearer ${token}` };

    await axios.post("http://localhost:8000/feedback", feedbackPayload, { headers });

    toast.success("✅ Feedback submitted!");
    setForm({ strengths: "", improvements: "", sentiment: "", tags: [] });
    setSelectedEmp(null);

    const fbRes = await axios.get(
      `http://localhost:8000/api/feedbacks/from/${profile.uid}`,
      { headers }
    );
    setFeedbacks(fbRes.data.map((f) => ({ ...f, _id: f._id?.$oid || f._id })));
  } catch (err) {
    console.error("Error submitting feedback:", err);
    toast.error("❌ Failed to submit feedback");
  }
};

const [notifications, setNotifications] = useState([]);

useEffect(() => {
  const fetchNotifications = async () => {
    const token = await getIdToken(auth.currentUser);
    const headers = { Authorization: `Bearer ${token}` };
    const res = await axios.get("http://localhost:8000/notifications", { headers });
    setNotifications(res.data);
  };

  fetchNotifications();
}, []);


  // Get list of team member UIDs
const teamMemberUIDs = employees.map(emp => emp.value);

// Filter feedbacks to only those for manager's team members
const teamFeedbacks = feedbacks.filter(fb => teamMemberUIDs.includes(fb.to));

// Chart data based on filtered feedbacks
const sentimentData = {
  labels: ["Positive", "Neutral", "Negative"],
  datasets: [
    {
      data: [
        teamFeedbacks.filter(f => f.sentiment === "Positive").length,
        teamFeedbacks.filter(f => f.sentiment === "Neutral").length,
        teamFeedbacks.filter(f => f.sentiment === "Negative").length,
      ],
      backgroundColor: ["#198754", "#ffc107", "#dc3545"],
      borderWidth: 1,
    },
  ],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxWidth: 16,
        font: { size: 13 },
      },
    },
  },
};


  return (
    <>
      <Topbar
  role="Manager"
  notifications={notifications}
  setNotifications={setNotifications}
/>


      <div className="d-flex">
        <Sidebar role="manager" onNavigate={setPage} currentPage={currentPage} />
        <div className="container-fluid p-4 animate__animated animate__fadeInUp">
{currentPage === "dashboard" && (
  <>
    {/* Welcome Header */}
    <div className="mb-4">
      <h3 className="fw-bold text-primary">👋 Welcome back, Manager</h3>
      <p className="text-muted mb-0">Here’s a snapshot of your team’s performance and feedback trends.</p>
    </div>

    {/* Dashboard Cards Grid */}
    <div className="row g-4">
      
      {/* Sentiment Overview Chart */}
      <div className="col-xl-4 col-lg-6 col-md-12">
        <div className="card border-0 rounded-4 shadow-sm h-100">
          <div className="card-body">
            <h5 className="fw-semibold mb-3 text-dark">📊 Sentiment Overview</h5>
            <div style={{ height: "260px" }}>
              <Pie data={sentimentData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Team Feedback Summary */}
      <div className="col-xl-4 col-lg-6 col-md-12">
        <div className="card border-0 rounded-4 shadow-sm h-100">
          <div className="card-body">
            <h5 className="fw-semibold mb-3 text-dark">📋 Team Summary</h5>
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Total Feedbacks</span>
                <span className="badge bg-primary fs-6">{teamFeedbacks.length}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Positive</span>
                <span className="badge bg-success fs-6">
                  {teamFeedbacks.filter(f => f.sentiment === "Positive").length}
                </span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Neutral</span>
                <span className="badge bg-warning text-dark fs-6">
                  {teamFeedbacks.filter(f => f.sentiment === "Neutral").length}
                </span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Negative</span>
                <span className="badge bg-danger fs-6">
                  {teamFeedbacks.filter(f => f.sentiment === "Negative").length}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Team Members Summary */}
      <div className="col-xl-4 col-lg-12">
        <div className="card border-0 rounded-4 shadow-sm h-100">
          <div className="card-body">
            <h5 className="fw-semibold mb-3 text-dark">👥 Team Members</h5>
            <div className="scrollable-container" style={{ maxHeight: "270px", overflowY: "auto" }}>
              {employees.length === 0 ? (
                <p className="text-muted">No team members found.</p>
              ) : (
                <div className="row row-cols-1 g-3">
                  {employees.map((emp, idx) => {
                    const memberFeedbacks = feedbacks.filter(fb => fb.to === emp.value);
                    const positive = memberFeedbacks.filter(fb => fb.sentiment === "Positive").length;
                    const neutral = memberFeedbacks.filter(fb => fb.sentiment === "Neutral").length;
                    const negative = memberFeedbacks.filter(fb => fb.sentiment === "Negative").length;

                    const dominant =
                      positive >= neutral && positive >= negative
                        ? "success"
                        : neutral >= negative
                        ? "warning"
                        : "danger";

                    return (
                      <div className="col" key={idx}>
                        <div className="rounded-3 border bg-light p-3 shadow-sm h-100">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="fw-semibold mb-0">{emp.label}</h6>
                              <small className="text-muted">Feedbacks: {memberFeedbacks.length}</small>
                            </div>
                            <span className={`badge bg-${dominant} rounded-pill`}>
                              {dominant === "success"
                                ? "Positive"
                                : dominant === "warning"
                                ? "Mixed"
                                : "Needs Attention"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">👍 {positive} 😐 {neutral} 👎 {negative}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
)}

          {currentPage === "feedback" && (
            <div className="card p-4 shadow-sm">
              <h5 className="mb-3">✍️ Submit Feedback</h5>
              <div className="mb-3">
                <label>Select Employee</label>
                <Select options={employees} value={selectedEmp} onChange={setSelectedEmp} />
              </div>
              <div className="mb-3">
                <label>Strengths</label>
                <textarea className="form-control" rows={2} value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} />
              </div>
              <div className="mb-3">
                <label>Improvements</label>
                <textarea className="form-control" rows={2} value={form.improvements} onChange={(e) => setForm({ ...form, improvements: e.target.value })} />
              </div>
              <div className="mb-3">
                <label>Sentiment</label>
                <select className="form-select" value={form.sentiment} onChange={(e) => setForm({ ...form, sentiment: e.target.value })}>
                  <option value="">Select</option>
                  <option value="Positive">Positive</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Negative">Negative</option>
                </select>
              </div>
              <div className="mb-3">
                <label>Tags</label>
                <Select isMulti options={tagOptions} value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
              </div>
              <button className="btn btn-primary" onClick={handleSubmitFeedback}>Submit Feedback</button>
            </div>
          )}

          {currentPage === "history" && (
            <FeedbackHistory feedbacks={feedbacks} employees={employees} setFeedbacks={setFeedbacks} />
          )}

          {currentPage === "profile" && profile && (
            <div className="card p-4 shadow-sm">
              <h5 className="mb-3">👤 Your Profile</h5>
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Role:</strong> {profile.role}</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
