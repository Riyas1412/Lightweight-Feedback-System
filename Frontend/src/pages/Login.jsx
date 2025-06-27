import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "../firebase/firebaseconfig";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log("🔐 Signing in with Firebase...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Firebase login successful");

      const token = await userCredential.user.getIdToken(true);
      const res = await fetch("http://localhost:8000/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch user profile');

      const data = await res.json();
      console.log("✅ Role fetched:", data.role);

      if (data.role === 'manager') {
        navigate('/manager');
      } else if (data.role === 'employee') {
        navigate('/employee');
      } else {
        throw new Error('Unknown user role');
      }

    } catch (err) {
      console.error("❌ Login failed:", err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card p-4 shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="alert alert-danger py-1">{error}</div>}

          <button type="submit" className="btn btn-success w-100" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-3">
          <small>Don’t have an account? <a href="/register">Register</a></small>
        </div>
      </div>
    </div>
  );
}
