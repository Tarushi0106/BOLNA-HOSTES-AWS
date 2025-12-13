import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MessageLogs.css";

const API_BASE =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001'
    : 'http://13.53.90.157:5001';



export default function MessageLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/msg-logs`);
      setLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load message logs");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="msg-loading">Loading message logs…</p>;
  if (error) return <p className="msg-error">{error}</p>;

  return (
    <div className="msglogs-container">
      <h2>WhatsApp Message Logs</h2>

      <table className="msglogs-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer No.</th>
            <th>Template</th>
            <th>Status</th>
            <th>Failure Reason</th>
            <th>Time</th>
          </tr>
        </thead>

        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan="6" className="empty">
                No message logs found
              </td>
            </tr>
          ) : (
            logs.map((log, i) => (
              <tr key={log._id}>
                <td>{i + 1}</td>
                <td>{log.customer_number || "—"}</td>
                <td>{log.template_name || "—"}</td>
                <td>
                  <span className={`status ${log.status}`}>
                    {log.status}
                  </span>
                </td>
                <td className="reason">
                  {log.failure_reason || "—"}
                </td>
                <td>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
