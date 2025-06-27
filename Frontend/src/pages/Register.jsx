// src/components/Register.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from "../firebase/firebaseconfig";
import axios from 'axios';
import { getIdToken } from "firebase/auth";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
    manager: '',       // ← new field
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [managers, setManagers] = useState([]); // list of { uid, name }

  // Fetch list of managers for the dropdown
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        // If you have a public endpoint for managers, call it here:
        // e.g. GET /api/managers
        const res = await axios.get('http://localhost:8000/api/managers');
        setManagers(res.data); // expect [{ uid, name }, ...]
      } catch (err) {
        console.error('Failed to load managers list', err);
      }
    };
    fetchManagers();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1️⃣ Create user in Firebase Auth
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 2️⃣ Save profile (including manager if employee) in your backend
      const payload = {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      if (formData.role === 'employee') {
        payload.manager = formData.manager;
      }

      const res = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Backend registration failed');
      }

      // 3️⃣ Redirect to login
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card p-4 shadow-sm" style={{ maxWidth: 400, width: '100%' }}>
        <h2 className="text-center mb-4">Register</h2>
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              type="text"
              className="form-control"
              required
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Role */}
          <div className="mb-3">
            <label htmlFor="role" className="form-label">Role</label>
            <select
              id="role"
              className="form-select"
              required
              value={formData.role}
              onChange={handleChange}
            >
              <option value="">Select your role</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          {/* Manager selector—only when employee */}
          {formData.role === 'employee' && (
            <div className="mb-3">
              <label htmlFor="manager" className="form-label">Select Your Manager</label>
              <select
                id="manager"
                className="form-select"
                required
                value={formData.manager}
                onChange={handleChange}
              >
                <option value="">-- Choose Manager --</option>
                {managers.map((mgr) => (
                  <option key={mgr.uid} value={mgr.uid}>
                    {mgr.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Error */}
          {error && <div className="alert alert-danger py-1">{error}</div>}

          {/* Submit */}
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-3">
          <small>
            Already have an account? <a href="/login">Login</a>
          </small>
        </div>
      </div>
    </div>
  );
}
