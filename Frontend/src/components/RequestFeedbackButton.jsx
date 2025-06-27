import React from "react";
import axios from "axios";
import { getIdToken } from "firebase/auth";
import { auth } from "../firebase/firebaseconfig";
import toast from "react-hot-toast";

export default function RequestFeedbackButton() {
  const handleRequest = async () => {
    try {
      const token = await getIdToken(auth.currentUser);
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post("http://localhost:8000/feedback/request", {}, { headers });

      toast.success("✅ Feedback request sent to your manager!");
    } catch (err) {
      console.error("❌ Failed to request feedback", err);
      toast.error("Something went wrong. Please try again later.");
    }
  };

  return (
    <button
      onClick={handleRequest}
      className="btn btn-primary btn-sm mt-3 px-4 py-2 rounded-pill d-flex align-items-center gap-2 shadow-sm animate__animated animate__fadeIn"
    >
      <i className="bi bi-send-fill"></i>
      Request Feedback
    </button>
  );
}
