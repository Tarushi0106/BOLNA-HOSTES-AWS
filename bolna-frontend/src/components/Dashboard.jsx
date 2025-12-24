import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import shaurrya_logo from "../assets/shaurrya_logo.png";

/* ---------------- API BASE ---------------- */
// const API_BASE =
//   window.location.hostname === "localhost" ||
//   window.location.hostname === "127.0.0.1"
//     ? "http://localhost:5001"
//      : "";
//     // : "http://13.53.90.157:5001";




const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
     : "http://13.53.90.157:5001";












/* ---------------- DATE FORMATTER ---------------- */
const formatDateTime = (iso) => {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", // 🔥 THIS FIXES WRONG TIME
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};


const Dashboard = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchCalls();
  }, []);
// 🔄 Auto refresh every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchCalls();
  }, 30000);

  return () => clearInterval(interval);
}, []);

  /* ---------------- NORMALIZE DATA ---------------- */
const normalizeCalls = (data) => {
  const arr = Array.isArray(data) ? data : [];
  return arr.map((c) => ({
    _id: c._id,
    name: c.name || "N/A",

    // ✅ USER FILLED NUMBER (lead form)
    phone_number: c.phone_number || "N/A",

    // ✅ BOLNA FROM NUMBER
    bolna_from_number:
      c.fromNumber ||
      c.user_number ||   // fallback if backend sends old field
      "N/A",

    // email: c.email || "N/A",
    // best_time_to_call: c.best_time_to_call || "N/A",
    whatsapp_status: c.whatsapp_status || "pending",
    summary: c.summary || "—",
  timestamp: b.createdAt,

  }));
};


  /* ---------------- FETCH CALLS ---------------- */
const fetchCalls = async () => {
  try {
    setLoading(true);
    setError(null);

    const [callsRes, bolnaRes] = await Promise.all([
      axios.get(`${API_BASE}/api/calls`),
      axios.get(`${API_BASE}/api/bolna/calls`),
    ]);

    const callsData = Array.isArray(callsRes.data) ? callsRes.data : [];
    const bolnaData = Array.isArray(bolnaRes.data?.data)
      ? bolnaRes.data.data
      : [];

    // Map bolna by executionId
    const bolnaMap = {};
    bolnaData.forEach((b) => {
      bolnaMap[b.executionId] = b;
    });

    // 1️⃣ Calls coming from /api/calls
    const mergedFromCalls = callsData.map((c) => {
      const execId = c.bolna_call_id || c.executionId;
      const bolna = bolnaMap[execId];

      return {
        _id: c._id,
        name: c.name || "N/A",
        phone_number: c.phone_number || "N/A",
        bolna_from_number: bolna?.fromNumber || c.from_number || "N/A",
        // email: c.email || "N/A",
        // best_time_to_call: c.best_time_to_call || "N/A",
        whatsapp_status: c.whatsapp_status || "failed",
        summary: c.summary || "—",
     timestamp: c.whatsapp_sent_at || c.call_timestamp || c.createdAt,
      };
    });

    // 2️⃣ Bolna-only FAILED calls (not present in calls collection)
    const bolnaOnlyFailed = bolnaData
      .filter(
        (b) =>
          !callsData.some(
            (c) =>
              c.bolna_call_id === b.executionId ||
              c.executionId === b.executionId
          )
      )
      .map((b) => ({
        _id: b._id,
        name: "N/A",
        phone_number: "N/A",
        bolna_from_number: b.fromNumber || "N/A",
        // email: "N/A",
        // best_time_to_call: "N/A",
        whatsapp_status: "failed",
        summary: "Call failed before lead capture",
       timestamp: b.createdAt,
      }));

    // 3️⃣ Combine both
 const finalData = [...mergedFromCalls, ...bolnaOnlyFailed]
  .filter(
    (c) => c.whatsapp_status === "sent" || c.whatsapp_status === "failed"
  )
.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));


    setCalls(finalData);
  } catch (err) {
    console.error("❌ Failed to load calls:", err);
    setError("Failed to load calls");
  } finally {
    setLoading(false);
  }
};




  /* ---------------- LOGOUT ---------------- */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  /* ---------------- LOADING ---------------- */
  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading calls…</p>
      </div>
    );

  return (
    <div className="dashboard-layout">
      {/* ---------------- NAVBAR ---------------- */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <img src={shaurrya_logo} alt="logo" className="navbar-logo" />
          </div>

          <div className="navbar-center">
            <h3>Calls Management System</h3>
          </div>

          <div className="navbar-user">
            <div className="avatar">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <span>{user?.email}</span>
            <button className="logout-btn" onClick={handleLogout}>
              🚪
            </button>
          </div>
        </div>
      </nav>

      {/* ---------------- CONTENT ---------------- */}
      <main className="content">
        <header className="page-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome to your calls management system</p>
          </div>

          <div className="header-actions">
            <button className="btn-primary" onClick={fetchCalls}>
              🔄 Refresh
            </button>

            <button
              className="btn-primary"
              onClick={() => navigate("/dashboard/leads")}
            >
              📄 Lead Dashboard
            </button>

            {/* <button
              className="btn-message-logs"
              onClick={() => navigate("/dashboard/messageLogs")}
            >
              🧾 Message Logs
            </button> */}
          </div>
        </header>

        {error && <div className="error-box">⚠️ {error}</div>}

        {/* ---------------- KPI CARDS ---------------- */}
        <section className="stats-grid">
          <div className="stat-card">
            <h4>Total Calls</h4>
            <p>{calls.length}</p>
          </div>

          <div className="stat-card">
            <h4>With Contact</h4>
            <p>{calls.filter((c) => c.phone_number !== "N/A").length}</p>
          </div>

          {/* <div className="stat-card">
            <h4>With Email</h4>
            <p>{calls.filter((c) => c.email !== "N/A").length}</p>
          </div> */}

          <div className="stat-card">
            <h4>Status</h4>
            <p className="green">Active</p>
          </div>
        </section>

        {/* ---------------- TABLE ---------------- */}
        <section className="table-section">
          <h2>Recent Calls ({calls.length})</h2>

          <table className="calls-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Bolna Phone no.</th>
                <th>User Phone no.</th>
                {/* <th>Email</th>
                <th>Best Time</th> */}
                <th>Date & Time</th> {/* 🔥 NEW */}
                <th>Status</th>
                <th>Summary</th>
              </tr>
            </thead>

            <tbody>
              {calls.map((c, i) => (
                <tr key={c._id || i}>
                  <td>{i + 1}</td>
                  <td>{c.name}</td>
               <td>{c.bolna_from_number}</td>
<td>{c.phone_number}</td>
{/* 
                  <td>{c.email}</td>
 <td>
  {c.best_time_to_call
    ? c.best_time_to_call.match(
        /\b(1[0-2]|0?[1-9])(:[0-5][0-9])?\s?(AM|PM)\b/i
      )?.[0] || "N/A"
    : "N/A"}
</td> */}



                  {/* 🔥 MongoDB Date */}
        <td>{formatDateTime(c.timestamp)}</td>


                  <td>
                    {c.whatsapp_status === "sent"
                      ? "✅ Sent"
                      : c.whatsapp_status === "failed"
                      ? "❌ Failed"
                      : "⏳ Pending"}
                  </td>

                 <td className="summary-cell">
  {c.summary}
</td>

                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
