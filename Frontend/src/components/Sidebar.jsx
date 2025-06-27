import React from "react";

export default function Sidebar({ role, onNavigate, currentPage }) {
  const navItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "feedback", label: "Feedback" },
    { key: "history", label: "History", showFor: "manager" },
    { key: "profile", label: "Profile" },
  ];

  return (
  <div
    className="text-white p-4 shadow-lg"
    style={{
      minHeight: "100vh",
      width: "260px",
      background: "linear-gradient(160deg, #1e293b, #334155)", // deep slate gradient
      backdropFilter: "blur(4px)", // frosted effect
      borderRight: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "5px 0 15px rgba(0,0,0,0.2)",
    }}
  >
    <h6 className="fw-bold text-uppercase mb-4" style={{ letterSpacing: "1px", fontSize: "0.95rem", color: "#93c5fd" }}>
      {role === "employee" ? "Employee Panel" : "Manager Panel"}
    </h6>

    <ul className="nav flex-column gap-3">
      {navItems
        .filter((item) => !item.showFor || item.showFor === role)
        .map((item) => (
          <li className="nav-item" key={item.key}>
            <button
              className={`btn text-start w-100 px-4 py-2 rounded-4 ${
                currentPage === item.key
                  ? "bg-white text-dark shadow-sm fw-semibold"
                  : "text-white bg-transparent"
              }`}
              onClick={() => onNavigate(item.key)}
              style={{
                fontSize: "0.95rem",
                transition: "all 0.3s ease",
                border: "1px solid transparent",
                backdropFilter: currentPage === item.key ? "blur(4px)" : "none",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = currentPage === item.key ? "" : "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.key) e.target.style.backgroundColor = "transparent";
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
    </ul>
  </div>
);


}
