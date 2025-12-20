import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/shaurrya_logo.png";

const API_BASE = "http://13.53.90.157:5001";

export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    try {
      const res = await axios.get(`${API_BASE}/api/forms/list-names`);
      if (res.data.success) {
        setLeads(res.data.data);
        setFiltered(res.data.data);
      }
    } catch (err) {
      console.error("Lead fetch error:", err);
    }
  }

  // Search filter
useEffect(() => {
  const s = search.toLowerCase();
  setFiltered(
    leads.filter((l) =>
      (l.displayName || "").toLowerCase().includes(s) ||
      (l.phone || "").toLowerCase().includes(s) ||
      (l.businessEntityName || "").toLowerCase().includes(s) ||
      (l.currentDiscussion || "").toLowerCase().includes(s) ||
      (l.state || "").toLowerCase().includes(s) ||
      String(l.totalEmployees || "").includes(s)
    )
  );
}, [search, leads]);


  const totalLeads = leads.length;
  const withBusiness = leads.filter((l) => l.businessEntityName && l.businessEntityName !== "—").length;
  const withDiscussion = leads.filter((l) => l.currentDiscussion && l.currentDiscussion !== "—").length;

  return (
    <div style={styles.page}>
      
      {/* NAVBAR */}
      <div style={styles.navbar}>
        <img src={Logo} alt="logo" style={styles.logo} />
      </div>

      <div style={styles.container}>
        <h1 style={styles.heading}>Leads Dashboard</h1>

        {/* KPI CARDS */}
        <div style={styles.kpiWrapper}>
          <KPI title="Total Leads" value={totalLeads} />
          <KPI title="Business Entity" value={withBusiness} />
          <KPI title="With Discussion" value={withDiscussion} />
          <KPI title="Status" value="Active" />
        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search by name, phone, business entity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchBox}
        />

        {/* TABLE */}
        <div style={styles.tableBox}>
          <table style={styles.table}>
       <thead>
  <tr>
    <th style={styles.th}>NAME</th>
    <th style={styles.th}>PHONE</th>
    <th style={styles.th}>BUSINESS ENTITY</th>
    <th style={styles.th}>STATE</th>
    <th style={styles.th}>TOTAL EMPLOYEES</th>
    <th style={styles.th}>DISCUSSION</th>
    <th style={styles.th}>VIEW</th>
  </tr>
</thead>

<tbody>
  {filtered.map((lead) => (
    <tr key={lead.id} style={styles.row}>
      <td style={styles.td}>{lead.displayName || "—"}</td>
      <td style={styles.td}>{lead.phone || "—"}</td>
      <td style={styles.td}>{lead.businessEntityName || "—"}</td>
      <td style={styles.td}>{lead.state || "—"}</td>
      <td style={styles.td}>{lead.totalEmployees || "—"}</td>
      <td style={styles.td}>
        {(lead.currentDiscussion || "—").slice(0, 50)}...
      </td>
      <td style={styles.td}>
        <button
          onClick={() => navigate(`/dashboard/lead/${lead.id}`)}
          style={styles.viewBtn}
        >
          View
        </button>
      </td>
    </tr>
  ))}

  {filtered.length === 0 && (
    <tr>
      <td colSpan="7" style={styles.noData}>
        No leads found
      </td>
    </tr>
  )}
</tbody>

          </table>
        </div>

      </div>
    </div>
  );
}


/* ================= KPI ================= */

function KPI({ title, value }) {
  return (
    <div style={kpiStyles.card}>
      <div style={kpiStyles.leftBar}></div>
      <div style={kpiStyles.content}>
        <div style={kpiStyles.title}>{title}</div>
        <div style={kpiStyles.value}>{value}</div>
      </div>
    </div>
  );
}

const kpiStyles = {
  card: {
    position: "relative",
    width: 260,
    height: 120,
    background: "white",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    paddingLeft: 18,
    boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },

  leftBar: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 10,
    height: "100%",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    background: "linear-gradient(180deg, #ff5b4d, #c92b23)",
  },

  content: {
    marginLeft: 25,
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1a1a1a",
    marginBottom: 6,
  },

  value: {
    fontSize: 22,
    fontWeight: 600,
    color: "#333",
  },
};


/* ================= PAGE STYLES ================= */

const styles = {
  page: {
    background: "#f5f7fa",
    minHeight: "100vh",
  },

  navbar: {
    height: 75,
    background: "white",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    display: "flex",
    alignItems: "center",
    paddingLeft: 25,
    marginBottom: 20,
  },

  logo: {
    height: 60,
    objectFit: "contain",
  },

  container: {
    width: "90%",
    maxWidth: 1300,
    margin: "0 auto",
  },

  heading: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 30,
  },

  kpiWrapper: {
    display: "flex",
    justifyContent: "center",
    gap: 30,
    marginBottom: 40,
    flexWrap: "wrap",
  },

  searchBox: {
    width: 350,
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid #ccc",
    marginBottom: 25,
    fontSize: 15,
  },

  tableBox: {
    background: "white",
    borderRadius: 14,
    boxShadow: "0 3px 20px rgba(0,0,0,0.1)",
    padding: 10,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    padding: "15px",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "left",
    borderBottom: "2px solid #eee",
    color: "#444",
  },

  td: {
    padding: "14px",
    fontSize: 14,
    color: "#333",
  },

  row: {
    borderBottom: "1px solid #f0f0f0",
  },

  viewBtn: {
    padding: "7px 14px",
    background: "#c92b23",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },

  noData: {
    padding: 20,
    textAlign: "center",
    color: "#777",
  },
};
