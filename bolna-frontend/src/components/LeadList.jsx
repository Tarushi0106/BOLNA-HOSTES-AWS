import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/shaurrya_logo.png";

// const API_BASE =
//   window.location.hostname === "localhost" ||
//   window.location.hostname === "127.0.0.1"
//     ? "http://localhost:5001"
//     : "";




const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
    : "";





const formatDateTime = (iso) => {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};



export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
const user = JSON.parse(localStorage.getItem("user"));

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/", { replace: true });
};
  // ✅ LOAD LEADS
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

  // ✅ SEARCH FILTER
  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(
      leads.filter(
        (l) =>
        (l.personName || l.displayName || "").toLowerCase().includes(s) ||
(l.personPhone || l.phone || "").toLowerCase().includes(s)||

          (l.businessEntityName || "").toLowerCase().includes(s) ||
          (l.currentDiscussion || "").toLowerCase().includes(s) ||
          (l.state || "").toLowerCase().includes(s) ||
          String(l.totalEmployees || "").includes(s)
      )
    );
  }, [search, leads]);

  const totalLeads = leads.length;
  const withBusiness = leads.filter(
    (l) => l.businessEntityName && l.businessEntityName !== "—"
  ).length;
  const withDiscussion = leads.filter(
    (l) => l.currentDiscussion && l.currentDiscussion !== "—"
  ).length;
  return (
    <div style={styles.page}>
      
      {/* NAVBAR */}
   <div style={styles.navbar}>
  <img src={Logo} alt="logo" style={styles.logo} />

  {/* RIGHT SIDE USER + LOGOUT */}
  <div style={styles.navRight}>
    <div style={styles.avatar}>
      {user?.email?.[0]?.toUpperCase() || "U"}
    </div>
    <span style={styles.userEmail}>{user?.email}</span>
    <button onClick={handleLogout} style={styles.logoutBtn}>
      🚪
    </button>
  </div>
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
    <th style={styles.th}>Contact Person name</th>
    <th style={styles.th}>Phone</th>
    <th style={styles.th}>Email</th>
    <th style={styles.th}>Company Name</th>
    <th style={styles.th}>Date of Visit</th>
    <th style={styles.th}>STATE</th>
    <th style={styles.th}>DATE & TIME</th> {/* ✅ NEW */}
    <th style={styles.th}>Remark</th>
    <th style={styles.th}>VIEW</th>
  </tr>
</thead>




           <tbody>
  {filtered.map((lead) => (
<tr key={lead.id} style={styles.row}>
  <td>{lead.contact_person}</td>
  <td>{lead.contact_no}</td>
  <td>{lead.company_email}</td>
  <td>{lead.company_name}</td>
  <td>{lead.date}</td>
  <td>{lead.lead_state}</td>
  <td>{formatDateTime(lead.createdAt)}</td>
  <td>{lead.remark.slice(0, 50)}</td>
  <td>
    <button
      onClick={() => navigate(`/lead-form/${lead.id}`)}
      style={styles.viewBtn}
    >
      View
    </button>
  </td>
</tr>


  ))}
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
  background: "#ffffff"
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
    navRight: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 14,
    paddingRight: 25,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#c92b23",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
  },

  userEmail: {
    fontSize: 14,
    fontWeight: 500,
    color: "#333",
    whiteSpace: "nowrap",
  },

 logoutBtn: {
  border: "none",
  background: "#c92b23",      // 🔴 red background
  color: "#fff",
  fontSize: 18,
  cursor: "pointer",
  width: 34,
  height: 34,
  borderRadius: "50%",        // ⭕ circle
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  lineHeight: 1,
},


};
