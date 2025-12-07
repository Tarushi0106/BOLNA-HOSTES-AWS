// frontend/bolna-frontend/src/pages/Signup.jsx

import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !password) {
      return setError('All fields are required');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      const response = await axios.post('/api/auth/signup', { name, email, password });
      setSuccess('Signup successful! Please check your email for verification instructions.');
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError(err.response.data.message);
      } else {
        setError('Server error. Please try again later.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-header">
        <img
          src="/shaurya-logo.png"
          alt="Shaurya Teleservices"
          className="auth-logo"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h1 className="auth-title">Shaurya Teleservices</h1>
      </div>
      <form className="auth-form" onSubmit={handleSignup}>
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-button">Sign Up</button>
        <p className="auth-footer">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </form>
    </div>
  );
};

export default Signup;