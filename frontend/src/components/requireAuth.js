import React from 'react';
import { useAuth } from '../context/authCOntext.js';
import LoginSignup from '../utils/authentication.js'; // see below

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginSignup />; // Show login/signup form if not authenticated

  return children;
}