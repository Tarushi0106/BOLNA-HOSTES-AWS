import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const API_BASE = "http://13.53.90.157:5001";

const sectionStyle = {
  background: "#fff",
  borderRadius: 8,
  padding: 18,
  marginBottom: 20,
  boxShadow: "0 1px 4px rgba(20,20,30,0.04)"
};

const labelStyle = { display: "block", fontWeight: 600, marginBottom: 6, color: "#333" };
const smallLabel = { display: "block", fontWeight: 600, marginBottom: 6, color: "#666", fontSize: 13 };
const valueStyle = { padding: "8px 10px", borderRadius: 6, border: "1px solid #e6e6e6", background: "#fafafa" };
const gridCols = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" };
const tripleCols = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" };

export default function LeadDashboard() {

  // ⭐ GET ID FROM URL
  const { id } = useParams();

  const [forms, setForms] = useState([]);
  const [selectedId, setSelectedId] = useState(id || "");
  const [form, setForm] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState("");

  // ⭐ Load list ONLY for dropdown
  useEffect(() => {
    async function loadList() {
      try {
        setLoadingList(true);
        const res = await axios.get(`${API_BASE}/api/forms/list-names`);

        if (res?.data?.success) {
          setForms(res.data.data || []);

          // ⭐ if URL has id → use it
          if (id) {
            setSelectedId(id);
          } else if (res.data.data.length) {
            setSelectedId(res.data.data[0].id);
          }

        } else {
          setError("Failed to load leads list");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load leads list");
      } finally {
        setLoadingList(false);
      }
    }

    loadList();
  }, [id]);

  // ⭐ Load form based on selectedId
  useEffect(() => {
    if (!selectedId) return;

    async function loadSingle() {
      try {
        setLoadingForm(true);
        const res = await axios.get(`${API_BASE}/api/forms/${selectedId}`);

        if (res?.data?.success) {
          setForm(res.data.data || {});
        } else {
          setForm(null);
          setError("Form not found");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading form");
      } finally {
        setLoadingForm(false);
      }
    }

    loadSingle();
  }, [selectedId]);

  // SAFE VALUE READER
  const v = (path, fallback = "—") => {
    if (!form) return fallback;
    const parts = path.split(".");
    let cur = form;
    for (const p of parts) {
      if (cur == null) return fallback;
      cur = cur[p];
    }
    return cur ?? fallback;
  };

  return (
    <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto", fontFamily: "Inter, Arial, sans-serif" }}>
      <h1 style={{ marginBottom: 16 }}>Lead Dashboard</h1>

      {/* DROPDOWN — UNTOUCHED HTML */}
      <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ fontWeight: 700 }}>Select Lead:</label>

        {loadingList ? (
          <div>Loading leads…</div>
        ) : (
          <>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{
                padding: "10px 12px",
                minWidth: 520,
                borderRadius: 6,
                border: "1px solid #ccc"
              }}
            >
              {forms.length === 0 && <option value="">(No leads found)</option>}
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.displayName}
                </option>
              ))}
            </select>

            <span style={{ marginLeft: "auto", color: "#777" }}>{forms.length} lead(s)</span>
          </>
        )}
      </div>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
      {loadingForm && <div style={{ marginBottom: 12 }}>Loading form data…</div>}

      {/* PERSONAL INFORMATION */}
      <div style={sectionStyle}>
        <h3 style={{ color: "#d32", marginTop: 0 }}>Personal Information</h3>
        <div style={gridCols}>
          <div>
            <div style={labelStyle}>Name</div>
            <div style={valueStyle}>{v("personName", v("meta.displayName", "—"))}</div>
          </div>
          <div>
            <div style={labelStyle}>Phone</div>
            <div style={valueStyle}>{v("personPhone", v("meta.phone", "—"))}</div>
          </div>
          <div>
            <div style={labelStyle}>Email</div>
            <div style={valueStyle}>{v("personEmail", v("meta.email", "—"))}</div>
          </div>
          <div>
            <div style={labelStyle}>Created At</div>
            <div style={valueStyle}>{v("createdAt", "—")}</div>
          </div>
        </div>
      </div>

      {/* BUSINESS ENTITY */}
      <div style={sectionStyle}>
        <h3 style={{ color: "#d32", marginTop: 0 }}>Business Entity Info</h3>
        <div style={gridCols}>
          <div>
            <div style={labelStyle}>Business Entity</div>
            <div style={valueStyle}>{v("businessEntityName")}</div>
          </div>
          <div>
            <div style={labelStyle}>State</div>
            <div style={valueStyle}>{v("state")}</div>
          </div>
          <div>
            <div style={labelStyle}>Account Manager</div>
            <div style={valueStyle}>{v("accountManager")}</div>
          </div>
          <div>
            <div style={labelStyle}>HO Address</div>
            <div style={valueStyle}>{v("hoAddress")}</div>
          </div>

          <div>
            <div style={labelStyle}>CEO / Executive</div>
            <div style={valueStyle}>{v("ceoName")}</div>
          </div>
          <div>
            <div style={labelStyle}>CEO Email</div>
            <div style={valueStyle}>{v("ceoEmail")}</div>
          </div>

          <div>
            <div style={labelStyle}>CIRCLE Contact No</div>
            <div style={valueStyle}>{v("circleContactNo")}</div>
          </div>
          <div>
            <div style={labelStyle}>PAN India Locations</div>
            <div style={valueStyle}>{v("panIndiaLocations")}</div>
          </div>

          <div>
            <div style={labelStyle}>Total Employees</div>
            <div style={valueStyle}>{v("totalEmployees")}</div>
          </div>

          <div>
            <div style={labelStyle}>Annual Turnover</div>
            <div style={valueStyle}>{v("annualTurnover")}</div>
          </div>

          <div>
            <div style={labelStyle}>Current Telecom Spend (PA)</div>
            <div style={valueStyle}>{v("currentTelecomSpend")}</div>
          </div>

          <div>
            <div style={labelStyle}>Current Data Spend (PA)</div>
            <div style={valueStyle}>{v("currentDataSpend")}</div>
          </div>
        </div>
      </div>

      {/* KEY PERSONS */}
      <div style={sectionStyle}>
        <h3 style={{ color: "#d32", marginTop: 0 }}>Decision Makers / Key Persons</h3>

        <div style={tripleCols}>
          {/* Key person 1 */}
          <div>
            <small style={smallLabel}>Key Person 1</small>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Name</div>
              <div style={valueStyle}>{v("keyPerson1.name")}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Title</div>
              <div style={valueStyle}>{v("keyPerson1.title")}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Role</div>
              <div style={valueStyle}>{v("keyPerson1.role")}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Contact No</div>
              <div style={valueStyle}>{v("keyPerson1.contactNo")}</div>
            </div>
            <div>
              <div style={labelStyle}>Email</div>
              <div style={valueStyle}>{v("keyPerson1.email")}</div>
            </div>
          </div>

          {/* Key person 2 */}
          <div>
            <small style={smallLabel}>Key Person 2</small>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Name</div>
              <div style={valueStyle}>{v("keyPerson2.name")}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Title</div>
              <div style={valueStyle}>{v("keyPerson2.title")}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Role</div>
              <div style={valueStyle}>{v("keyPerson2.role")}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Contact No</div>
              <div style={valueStyle}>{v("keyPerson2.contactNo")}</div>
            </div>
            <div>
              <div style={labelStyle}>Email</div>
              <div style={valueStyle}>{v("keyPerson2.email")}</div>
            </div>
          </div>

          {/* Key person 3 */}
          <div>
            <small style={smallLabel}>Key Person 3</small>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Name</div>
              <div style={valueStyle}>{v("keyPerson3.name")}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Title</div>
              <div style={valueStyle}>{v("keyPerson3.title")}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Role</div>
              <div style={valueStyle}>{v("keyPerson3.role")}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Contact No</div>
              <div style={valueStyle}>{v("keyPerson3.contactNo")}</div>
            </div>
            <div>
              <div style={labelStyle}>Email</div>
              <div style={valueStyle}>{v("keyPerson3.email")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS / SERVICES */}
      <div style={sectionStyle}>
        <h3 style={{ color: "#d32", marginTop: 0 }}>Products / Services Interested</h3>

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Internet Bandwidth (Site 1 / Site 2 / Site 3 / Existing)</div>
          <div style={tripleCols}>
            <div style={valueStyle}>{v("products.internetBandwidthSite1")}</div>
            <div style={valueStyle}>{v("products.internetBandwidthSite2")}</div>
            <div style={valueStyle}>{v("products.internetBandwidthSite3")}</div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={labelStyle}>Existing Bandwidth</div>
            <div style={valueStyle}>{v("products.existingBandwidth")}</div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>&lt;Name of ISP / TELCO&gt;</div>
          <div style={valueStyle}>{v("products.ispName")}</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Location (lat/long placeholders)</div>
          <div style={tripleCols}>
            <div style={valueStyle}>{v("products.location.site1")}</div>
            <div style={valueStyle}>{v("products.location.site2")}</div>
            <div style={valueStyle}>{v("products.location.site3")}</div>
          </div>
        </div>

        <div style={gridCols}>
          <div>
            <div style={labelStyle}>Smart CCTV as a Service (site-level)</div>
            <div style={valueStyle}>{v("products.smartCCTVSite1")}</div>
          </div>
          <div>
            <div style={labelStyle}>WiFi as a Service (site-level)</div>
            <div style={valueStyle}>{v("products.wifiSite1")}</div>
          </div>

          <div>
            <div style={labelStyle}>SD-WAN</div>
            <div style={valueStyle}>{v("products.sdwan")}</div>
          </div>

          <div>
            <div style={labelStyle}>Cyber Security Services</div>
            <div style={valueStyle}>{v("products.cyberSecurity")}</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={labelStyle}>Existing Plans</div>
          <div style={valueStyle}>{v("products.existingPlans")}</div>
        </div>
      </div>

      {/* JIO / CURRENT ENGAGEMENT */}
      <div style={sectionStyle}>
        <h3 style={{ color: "#d32", marginTop: 0 }}>Current Jio / Engagement</h3>

        <div style={gridCols}>
          <div>
            <div style={labelStyle}>COCP Nos</div>
            <div style={valueStyle}>{v("jio.cocpNos")}</div>
          </div>
          <div>
            <div style={labelStyle}>IOIP Nos</div>
            <div style={valueStyle}>{v("jio.ioipNos")}</div>
          </div>
          <div>
            <div style={labelStyle}>JioFi</div>
            <div style={valueStyle}>{v("jio.jiofi")}</div>
          </div>
        </div>
      </div>

      {/* INFRASTRUCTURE */}
      <div style={sectionStyle}>
        <h3 style={{ color: "#d32", marginTop: 0 }}>Infrastructure Engagement</h3>

        <div style={gridCols}>
          <div>
            <div style={labelStyle}>Total No. of Locations</div>
            <div style={valueStyle}>{v("infrastructure.totalLocations")}</div>
          </div>

          <div>
            <div style={labelStyle}>Permission Received</div>
            <div style={valueStyle}>{v("infrastructure.permissionReceived")}</div>
          </div>

          <div>
            <div style={labelStyle}>WVP</div>
            <div style={valueStyle}>{v("infrastructure.wvp")}</div>
          </div>

          <div>
            <div style={labelStyle}>Completed</div>
            <div style={valueStyle}>{v("infrastructure.completed")}</div>
          </div>
        </div>
      </div>

      {/* CURRENT DISCUSSION */}
      <div style={sectionStyle}>
        <h3 style={{ color: "#d32", marginTop: 0 }}>Current Discussion Thread</h3>
        <div style={{ ...valueStyle, minHeight: 120, whiteSpace: "pre-wrap" }}>
          {v("currentDiscussion", "—")}
        </div>
      </div>

      {/* Raw JSON debug (optional toggle) */}
      <div style={{ color: "#999", fontSize: 12 }}>
        <strong>Note:</strong> If any field is missing, ensure your backend returns the corresponding key in the form object.
      </div>
    </div>
  );
}
