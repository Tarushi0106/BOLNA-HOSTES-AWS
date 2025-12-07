import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // We'll try these backend bases in order (env override first if present)
  const ENV_BASE = import.meta.env.VITE_API_BASE ? import.meta.env.VITE_API_BASE.replace(/\/$/, '') : null;
  const POSSIBLE_BASES = [
    ENV_BASE,
    'http://localhost:5000',
    'http://localhost:4000'
  ].filter(Boolean).map(b => `${b}/api`);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchCalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeCallsPayload = (payload) => {
    // payload may be: [] or { calls: [] } or { data: [] } or { executions: [] } or single object
    let arr = [];
    if (Array.isArray(payload)) arr = payload;
    else if (Array.isArray(payload.calls)) arr = payload.calls;
    else if (Array.isArray(payload.data)) arr = payload.data;
    else if (Array.isArray(payload.executions)) arr = payload.executions;
    else if (payload && typeof payload === 'object') {
      // If payload is an object that looks like a single call, wrap it
      // Or if it's an object keyed by ids, convert to values
      const maybeValues = Object.values(payload);
      if (maybeValues.every(v => v && (v.phone_number || v.transcript || v.email || v.name))) {
        arr = maybeValues;
      } else if (payload && (payload.phone_number || payload.transcript || payload.email || payload.name)) {
        arr = [payload];
      } else {
        arr = [];
      }
    } else {
      arr = [];
    }

    // Map to a consistent shape used by the UI
    const normalized = arr.map((c) => ({
      _id: c._id || c.id || (c._id && c._id.$oid) || null,
      name: c.name || c.Name || c.Name?.trim?.() || 'N/A',
      phone_number:
        c.phone_number ||
        c.Phone ||
        c.phone ||
        c.phoneNumber ||
        c['phone number'] ||
        'N/A',
      email: c.email || c.Email || 'N/A',
      best_time_to_call:
        c.best_time_to_call ||
        c.bestTimeToCall ||
        c['Best Time to Call'] ||
        c.best_time ||
        'N/A',
      whatsapp_status:
        c.whatsapp_status || c.whatsappStatus || c.whatsapp?.status || 'pending',
      summary: c.summary || c.Summary || c.transcript_summary || 'N/A',
      createdAt: c.createdAt || c.call_timestamp || c.created_at || null
    }));

    return normalized;
  };

  const fetchCalls = async () => {
    setLoading(true);
    setError(null);
    let lastError = null;

    for (const base of POSSIBLE_BASES) {
      try {
        // try calls endpoint
        const res = await axios.get(`${base}/calls`, { timeout: 8000 });
        console.log(`Calls API response from ${base}:`, res.data);

        const payload = res.data.calls || res.data || [];
        setCalls(normalizeCallsPayload(payload));

        // best-effort stats
        try {
          const statsRes = await axios.get(`${base}/dashboard/stats`, { timeout: 5000 });
          setStats(statsRes.data?.stats || null);
        } catch (sErr) {
          console.warn(`Could not fetch stats from ${base}:`, sErr?.message || sErr);
          setStats(null);
        }

        setLoading(false);
        return; // success
      } catch (err) {
        lastError = err;
        console.warn(`Request to ${base}/calls failed:`, err?.response?.status || err.message);
        // try next base
      }
    }

    // none succeeded
    const status = lastError?.response?.status;
    const body = lastError?.response?.data;
    const detail = body ? ` Response: ${JSON.stringify(body)}` : ` Error: ${lastError?.message || 'unknown'}`;
    setError(`Failed to fetch calls from backend. ${status ? `Last status: ${status}.` : ''}${detail} Tried: ${POSSIBLE_BASES.join(', ')}.`);
    console.error('Error fetching calls (all bases tried):', lastError);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading">Loading Calls...</div>
      </div>
    );
  }

  // Defensive: ensure calls is always an array for rendering
  const safeCalls = Array.isArray(calls) ? calls : [];

  return (
    <div className="dashboard-layout">
      {/* Top Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <h2>📞 BolnaCall</h2>
          </div>
          <div className="navbar-center">
            <span className="nav-title">Calls Management System</span>
          </div>
          <div className="navbar-user">
            <div className="user-info">
              <div className="user-avatar">
                <span>{user?.email?.[0]?.toUpperCase() || 'U'}</span>
              </div>
              <div className="user-details">
                <p className="user-name">{user?.email || 'User'}</p>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              🚪
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-main">
        <main className="content">
          <div className="page-header">
            <div className="header-left">
              <h1>Dashboard</h1>
              <p className="header-subtitle">Welcome to your calls management system</p>
            </div>
            <button onClick={fetchCalls} className="btn-primary">
              🔄 Refresh Data
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-box">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button onClick={fetchCalls} className="btn-small">Retry</button>
            </div>
          )}

          {/* Stats Section */}
          <section className="stats-section">
            <h2 className="section-title">Quick Stats</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">📊</div>
                  <span className="stat-label">Total Calls</span>
                </div>
                <div className="stat-value">{stats?.total_calls || safeCalls.length}</div>
                <div className="stat-footer">All time records</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">✅</div>
                  <span className="stat-label">Status</span>
                </div>
                <div className="stat-value" style={{ color: '#10b981' }}>Active</div>
                <div className="stat-footer">System operational</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">📱</div>
                  <span className="stat-label">With Contact</span>
                </div>
                <div className="stat-value">
                  {safeCalls.filter(c => c.phone_number && c.phone_number !== 'N/A').length}
                </div>
                <div className="stat-footer">Phone numbers</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div className="stat-icon">📧</div>
                  <span className="stat-label">With Email</span>
                </div>
                <div className="stat-value">
                  {safeCalls.filter(c => c.email && c.email !== 'N/A').length}
                </div>
                <div className="stat-footer">Email addresses</div>
              </div>
            </div>
          </section>

          {/* Calls Table Section */}
          <section className="table-section">
            <div className="section-header">
              <h2 className="section-title">Recent Calls</h2>
              <span className="record-count">{safeCalls.length} records</span>
            </div>

            {safeCalls.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Best Time to Call</th>
                      <th>WhatsApp Status</th>
                      <th>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeCalls.map((call, index) => (
                      <tr key={call._id || index}>
                        <td className="index-cell">{index + 1}</td>

                        <td className="name-cell">
                          <strong>{call.name && call.name !== 'N/A' ? call.name : 'N/A'}</strong>
                        </td>

                        <td>
                          {call.phone_number && call.phone_number !== 'N/A' ? (
                            <a href={`tel:${call.phone_number}`} className="action-link phone-link">
                              {call.phone_number}
                            </a>
                          ) : (
                            <span className="na-text">—</span>
                          )}
                        </td>

                        <td>
                          {call.email && call.email !== 'N/A' ? (
                            <a href={`mailto:${call.email}`} className="action-link email-link">
                              {call.email}
                            </a>
                          ) : (
                            <span className="na-text">—</span>
                          )}
                        </td>

                        <td>
                          {call.best_time_to_call && call.best_time_to_call !== 'N/A' ? (
                            <span className="badge">{call.best_time_to_call}</span>
                          ) : (
                            <span className="na-text">—</span>
                          )}
                        </td>

                        <td>
                          {call.whatsapp_status === 'sent' ? (
                            <span className="status-badge status-sent">✅ Sent</span>
                          ) : call.whatsapp_status === 'failed' ? (
                            <span className="status-badge status-failed">❌ Failed</span>
                          ) : call.whatsapp_status === 'pending' ? (
                            <span className="status-badge status-pending">⏳ Pending</span>
                          ) : (
                            <span className="status-badge status-unsent">⭕ Not Sent</span>
                          )}
                        </td>

                        <td>
                          {call.summary && call.summary !== 'N/A' ? (
                            <div className="summary-text">
                              {call.summary.length > 50 ? `${call.summary.substring(0, 50)}...` : call.summary}
                            </div>
                          ) : (
                            <span className="na-text">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No calls found</p>
                <button onClick={fetchCalls} className="btn-secondary">Try Again</button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;