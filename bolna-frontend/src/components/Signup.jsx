import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './AuthForm.css'

const ALLOWED_EMAILS = [
  "tarushi.chaudhary@shaurryatele.com",
  "salil@shaurryatele.com",
  "juhi@shaurryatele.com",
  "akram@shaurryatele.com",
];

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "";

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const normalizedEmail = email.toLowerCase()

    // 🔒 Frontend allowlist (UX only)
    if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
      setError('This email is not authorized to create an account.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: normalizedEmail,
          password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Signup failed')
        return
      }

      setSuccess('Account created successfully ✅')
      setTimeout(() => navigate('/login'), 1200)

    } catch {
      setError('Network error: unable to reach server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Create account</h2>

        <form onSubmit={submit}>
          <label>
            Full name
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <button disabled={loading} type="submit">
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
