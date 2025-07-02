import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/authCOntext.js';
import '../styles/auth.css';

export default function LoginSignup() {
  const { login, signup, googleAuth, error, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const googleBtn = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignup) {
      await signup(email, password);
    } else {
      await login(email, password);
    }
  };

  useEffect(() => {
    if (window.google && googleBtn.current) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          if (response.credential) {
            await googleAuth(response.credential);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtn.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
      });
    }
  }, [googleAuth]);

  return (
    <div
      className="login-container"
      style={{
        maxWidth: 320,
        margin: '40px auto',
        padding: 16,
        border: '1px solid #ccc',
        borderRadius: 8,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        height: 'auto',              
        display: 'block'
      }}
    >
      <h2 style={{ color: '#0000cd', textAlign: 'center', marginBottom: 20 }}>
        {isSignup ? 'Sign Up' : 'Login'}
      </h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={e => setEmail(e.target.value)}
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
          {isSignup ? 'Sign Up' : 'Login'}
        </button>
      </form>
      <button
        onClick={() => setIsSignup(s => !s)}
        className="auth-link"
      >
        {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
      </button>
      <div style={{ margin: '16px 0', textAlign: 'center', color: '#888' }}>or</div>
      <div ref={googleBtn} style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }} />
      {error && <div style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>{error}</div>}
    </div>
  );
}