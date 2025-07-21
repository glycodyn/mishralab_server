import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/authCOntext.js';
import '../styles/auth.css';

export default function LoginSignup() {
  const { login,  error, loading, token,user, setError, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  



  const handleSubmit = async (e) => {
    e.preventDefault();
      await login(username, password);
    }

  useEffect(() => {
     if (user && user.newPassword) {
      setShowChangePassword(true);
    }
  }, [user]);
 
  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');
    if (!newPassword || newPassword.length < 6) {
      setChangePasswordError('Password must be at least 6 characters.');
      return;
    }
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/user/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setChangePasswordSuccess('Password changed successfully! Please log in again.');
      setShowChangePassword(false);
      setError('');
      logout()
    } catch (err) {
      setChangePasswordError(err.message);
    }
  };

  return (
    <div className="login-container" style={{ maxWidth: 320, margin: '40px auto', padding: 16, border: '1px solid #ccc', borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: 'auto', display: 'block' }}>
      <h2 style={{ color: '#0000cd', textAlign: 'center', marginBottom: 20 }}>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          required
          onChange={e => setUsername(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={e => setPassword(e.target.value)}
          className="auth-input"
        />
        <button
          type="submit"
          disabled={loading}
          className="auth-btn"
        >
          Login
        </button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>{error}</div>}
      <div style={{ marginTop: 24, color: '#333', fontSize: 15, background: '#f7f7ff', padding: 12, borderRadius: 6 }}>
        <strong>Need an account?</strong><br />
        Please email <a href="mailto:sushil@olemiss.edu">sushil@olemiss.edu</a> with your name, ID number, department, and affiliation.<br />
        Your account will be created for you.
      </div>

      {/* Password Change Modal */}
      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Change Password</h3>
            <form onSubmit={handleChangePassword}>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                required
                onChange={e => setNewPassword(e.target.value)}
                className="auth-input"
              />
              <button type="submit" className="auth-btn">Change Password</button>
            </form>
            {changePasswordError && <div style={{ color: 'red', marginTop: 8 }}>{changePasswordError}</div>}
            {changePasswordSuccess && <div style={{ color: 'green', marginTop: 8 }}>{changePasswordSuccess}</div>}
          </div>
        </div>
      )}
    </div>
  );
}