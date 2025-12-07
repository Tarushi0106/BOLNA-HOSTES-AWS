// frontend/bolna-frontend/src/pages/Signup.jsx

import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

// ✅ IMPORT LOGO FROM ASSETS
import shauryaLogo from '../assets/shaurya-logo.png';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Inline theme styles (red & white)
  const pageStyle = {
    background: 'linear-gradient(180deg, #fff 0%, #fff 100%)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: 480,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    padding: '2rem',
    boxSizing: 'border-box',
  };

  const logoWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '1rem',
  };

  const logoStyle = {
    height: 72,
    width: 'auto',
    objectFit: 'contain',
    background: '#fff',
    padding: '8px',
    borderRadius: 8,
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  };

  const primaryButtonStyle = {
    background: 'linear-gradient(135deg,#E74C3C 0%,#C0392B 100%)',
    color: '#fff',
    border: 'none',
    padding: '0.85rem 1rem',
    borderRadius: 10,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  };

  const linkStyle = {
    color: '#E74C3C',
    fontWeight: 700,
    textDecoration: 'none',
  };

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
      await axios.post('/api/auth/signup', {
        name,
        email,
        password,
      });

      setSuccess(
        'Signup successful! Please check your email for verification instructions.'
      );

      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.message);
      } else {
        setError('Server error. Please try again later.');
      }
    }
  };

  return (
    <div className="auth-page" style={pageStyle}>
      <div style={cardStyle}>
        <div style={logoWrapperStyle}>
          <img
            src={shauryaLogo}
            alt="Shaurya Teleservices"
            className="auth-logo"
            style={logoStyle}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div>
            <h1
              style={{
                margin: 0,
                color: '#222',
                fontSize: '1.25rem',
              }}
            >
              Shaurya Teleservices
            </h1>
            <div style={{ fontSize: 13, color: '#666' }}>
              Create your account
            </div>
          </div>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSignup}
          style={{ display: 'grid', gap: '0.9rem' }}
        >
          <h2 style={{ margin: 0, marginBottom: 4 }}>Create Account</h2>

          {error && (
            <div
              className="error-message"
              style={{ display: 'block' }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="success-message"
              style={{ display: 'block' }}
            >
              {success}
            </div>
          )}

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

          <button
            type="submit"
            className="auth-button"
            style={primaryButtonStyle}
          >
            Sign Up
          </button>

          <p className="auth-footer" style={{ marginTop: 8 }}>
            Already have an account?{' '}
            <a href="/login" style={linkStyle}>
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
