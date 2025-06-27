import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseconfig";
import "animate.css";
import axios from "axios";

export default function Topbar({ role = "Manager", notifications = [], setNotifications }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
      alert("Something went wrong during logout!");
    }
  };

  const handleNotificationClick = async () => {
    if (!showDropdown) {
      try {
        const token = await auth.currentUser.getIdToken(true);
        await axios.put("http://localhost:8000/notifications/mark-read", null, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setShowDropdown(true);
      } catch (err) {
        console.error("Failed to mark notifications as read:", err);
      }
    } else {
      setShowDropdown(false);
      if (typeof setNotifications === "function") {
        setNotifications([]);
      }
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow animate__animated animate__fadeInDown" style={{ zIndex: 1000 }}>
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Brand */}
        <div className="navbar-brand d-flex align-items-center gap-2">
          <i className="bi bi-chat-square-text fs-3"></i>
          <span className="fs-5 fw-bold">Feedback Flow</span>
        </div>

        {/* Right Side Controls */}
        <div className="d-flex align-items-center position-relative text-white gap-3">
          
          {/* Notification Bell */}
          <div className="position-relative">
            <i
              className="bi bi-bell-fill fs-5"
              style={{ cursor: "pointer" }}
              onClick={handleNotificationClick}
            ></i>

            {notifications.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {notifications.length}
              </span>
            )}

{showDropdown && (
  <div
    className="position-absolute end-0 mt-3 me-2 p-3 rounded-4 shadow-lg animate__animated animate__fadeIn"
    style={{
      width: "360px",
      maxHeight: "400px",
      overflowY: "auto",
      background: "#ffffff",
      border: "1px solid #e6e6e6",
      zIndex: 1100,
      boxShadow: "0 20px 30px rgba(0,0,0,0.08)",
    }}
  >
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h6 className="fw-bold text-dark mb-0">
        <i className="bi bi-bell me-2 text-primary" /> Notifications
      </h6>
      <span className="badge bg-primary-subtle text-primary rounded-pill px-2">
        {notifications.length}
      </span>
    </div>

    {notifications.length > 0 ? (
      notifications.map((note, index) => (
        <div
          key={note.id || index}
          className="d-flex gap-3 align-items-start p-3 rounded-3 mb-2 notification-card"
          style={{
            background: "#f9f9f9",
            transition: "all 0.3s ease",
            cursor: "pointer",
            borderLeft: "4px solid #0d6efd",
          }}
        >
          <div className="fs-5 text-primary pt-1">
            <i className="bi bi-info-circle-fill"></i>
          </div>
          <div className="flex-grow-1">
            <div className="text-dark fw-semibold mb-1" style={{ fontSize: "0.9rem" }}>
              {note.message}
            </div>
            <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
              {note.timestamp ? new Date(note.timestamp).toLocaleTimeString() : "Just now"}
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="text-muted text-center py-4">
        <i className="bi bi-check-circle fs-4 mb-2 d-block" />
        You're all caught up!
      </div>
    )}
  </div>
)}

          </div>

          {/* Role Badge */}
          <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
            {role}
          </span>

          {/* Logout Button */}
          <button
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
