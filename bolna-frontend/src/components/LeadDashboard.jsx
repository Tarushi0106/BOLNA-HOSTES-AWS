import React, { useState, useEffect, useRef } from "react";
import "./form.css";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

/* ================= API BASE ================= */
// const API_BASE =
//   window.location.hostname === "localhost" ||
//   window.location.hostname === "127.0.0.1"
//     ? "http://localhost:5001"
  
//    : "http://13.53.90.157:5001";





const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001"
     : "";









const Form = () => {


  const { callId } = useParams();


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitted, setSubmitted] = useState(false);


  const didPrefill = useRef(false);

const [formData, setFormData] = useState({
  // 🔹 PERSONAL
  personName: "",
  personPhone: "",
  personEmail: "",
  callerPhone: "",

  // 🔹 BUSINESS ENTITY (existing)
  businessEntityName: "",
  state: "",

  // 🔹 LEAD DETAILS (ADD THESE ✅)
  company_name: "",
  contact_person: "",
  contact_no: "",
  company_email: "",
  address: "",
  lead_state: "",       // 👈 renamed to avoid collision
  date: "",
  product_interested: "",
  remark: "",

  // keep rest as-is if you want
});


  /* ================= PREFILL ================= */
useEffect(() => {
  if (!callId || didPrefill.current) return;        
  


// if (!callId || callId === "new" || didPrefill.current) {
//   setLoading(false); // allow empty form
//   return;
// }




 didPrefill.current = true;
  const prefill = async () => {
    try {
  


      console.log("📡 Fetching form for callId:", callId);
      console.log("🌐 API:", `${API_BASE}/api/forms/prefill/${callId}`);

      const res = await axios.get(
        `${API_BASE}/api/forms/prefill/${callId}`
      );

      const f = res.data?.data || {};
setFormData(prev => ({
  ...prev,

  // PERSONAL (from call)
  personName: f.personName || "",
  personPhone: f.personPhone || "",
  callerPhone: f.callerPhone || "",
  personEmail: f.personEmail || "",

  // LEAD DETAILS (from form if exists)
  company_name: f.company_name || "",
  contact_person: f.contact_person || "",
  contact_no: f.contact_no || "",
  company_email: f.company_email || "",
  address: f.address || "",
  lead_state: f.lead_state || "",
  date: f.date || "",
  product_interested: f.product_interested || "",
  remark: f.remark || ""
}));



    } catch (err) {
      console.error("❌ Prefill failed:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  prefill();
}, [callId]);



  /* ================= INPUT HANDLER ================= */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split(".");

    setFormData(prev => {
      const updated = { ...prev };
      let ref = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        ref[keys[i]] = { ...ref[keys[i]] };
        ref = ref[keys[i]];
      }

      ref[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  /* ================= SUBMIT ================= */
  const navigate = useNavigate();

  // const handleChange = (e) => {
    
  //   setFormData({
  //     ...formData,
  //     [e.target.name]: e.target.value,
  //   });
  // };
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!callId) return;

  setIsSubmitting(true);

  try {
    // ✅ 1. Existing backend call (KEEP AS-IS)
    await axios.post(`${API_BASE}/api/forms/${callId}`, formData, {
      headers: { "Content-Type": "application/json" }
    });

    // ✅ 2. NEW: Push to Shaurrya Core
    const shaurryaPayload = {
      company_name: formData.company_name,
      contact_person: formData.contact_person,
      contact_no: formData.contact_no,
      company_email: formData.company_email,
      area: formData.address,
      state: formData.lead_state,
      visit_date: formData.date,
      product_pitched: formData.product_interested,
      remark: formData.remark,
      products: []
    };

    await axios.post(
      "https://core.shaurryatele.com/api/cp_online_leads_api.php",
      shaurryaPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "ad61394ea837cea3131cbcadc7973dbc60cd3657b29463d3bf6536cd11078e16"
        }
      }
    );

    // ✅ Redirect
    navigate("/thank-you", { replace: true });

  } catch (err) {
    console.error("❌ Submit failed:", err.response?.data || err.message);
    alert("Submission failed. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};






 return (
  <div className="form-container">
    {loading && (
      <p style={{ textAlign: "center", color: "#666" }}>
        Loading form data...
      </p>
    )}

    {error && (
      <div
        style={{
          background: "#fff3cd",
          color: "#856404",
          padding: "12px",
          borderRadius: "6px",
          marginBottom: "20px",
          textAlign: "center",
        }}
      >
        ⚠️ {error}
      </div>
    )}

   {!loading && !error && !submitted && (
  <form onSubmit={handleSubmit}>

      

        {/* Header */}
        <div className="form-header">
          <h2>FORM TO BE FILLED OUT FOR VALIDATION OF THE LEAD</h2>
          <p className="subtitle">The Data on the Form should be Also Stored on CORE SHAURRYATELE.COM</p>
        </div>

        {/* 🔹 PERSONAL INFORMATION SECTION (NEW) */}
        <div className="form-section">
          <div className="section-title">Personal Information</div>

          <div className="grid-row">
            <div className="input-group">
              <label>Name:</label>
              <input 
                type="text"
                name="personName"
                value={formData.personName}
                onChange={handleInputChange}
                required
              />
            </div>

         <div className="input-group">
  <label> Whatsapp Phone Number:</label>
  <input
    type="tel"
    name="personPhone"
    value={formData.personPhone}
    readOnly
    className="readonly-field"
  />
</div>
<div className="input-group">
    <label>Caller Phone Number:</label>
    <input
      type="tel"
      name="callerPhone"
      value={formData.callerPhone}
      readOnly
      className="readonly-field"
    />
  </div>

            <div className="input-group">
              <label>Email:</label>
              <input 
                type="email"
                name="personEmail"
                value={formData.personEmail}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

     {/* 
      Details */}
<div className="form-section">
  <div className="section-title">Lead Details</div>

  <div className="grid-row">
    <div className="input-group">
      <label>Company Name:</label>
      <input
        type="text"
        name="company_name"
        value={formData.company_name || ""}
        onChange={handleInputChange}
        required
      />
    </div>

    <div className="input-group">
      <label>Contact Person:</label>
      <input
        type="text"
        name="contact_person"
        value={formData.contact_person || ""}
        onChange={handleInputChange}
        required
      />
    </div>

    <div className="input-group">
      <label>Contact No:</label>
      <input
        type="tel"
        name="contact_no"
        value={formData.contact_no || ""}
        onChange={handleInputChange}
      />
    </div>
  </div>

  <div className="grid-row">
    <div className="input-group">
      <label>Company Email:</label>
      <input
        type="email"
        name="company_email"
        value={formData.company_email || ""}
        onChange={handleInputChange}
      />
    </div>

    <div className="input-group">
      <label>Address:</label>
      <input
        type="text"
        name="address"
        value={formData.address || ""}
        onChange={handleInputChange}
      />
    </div>

    <div className="input-group">
      <label>State:</label>
    <input
  type="text"
  name="lead_state"
  value={formData.lead_state || ""}
  onChange={handleInputChange}
/>

    </div>
  </div>

  <div className="grid-row">
    <div className="input-group">
      <label>Date of Visit:</label>
      <input
        type="date"
        name="date"
        value={formData.date || ""}
        onChange={handleInputChange}
      />
    </div>

    <div className="input-group">
      <label>Product Interested:</label>
      <input
        type="text"
        name="product_interested"
        value={formData.product_interested || ""}
        onChange={handleInputChange}
        placeholder="WiFi, CCTV, SD-WAN"
      />
    </div>
  </div>

  <div className="grid-row">
    <div className="input-group full-width">
      <label>Remark:</label>
      <textarea
        name="remark"
        value={formData.remark || ""}
        onChange={handleInputChange}
        rows={4}
        placeholder="Additional notes or remarks"
      />
    </div>
  </div>
</div>
<div style={{ margin: "40px 0", textAlign: "center" }}>
  <button
    type="submit"
    style={{
      backgroundColor: "#c92b23",
      color: "#fff",
      padding: "14px 36px",
      fontSize: "16px",
      fontWeight: "600",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer"
    }}
    disabled={isSubmitting}
  >
    {isSubmitting ? "Saving..." : "Submit Form"}
  </button>
</div>


      </form>
    )}
  </div>
);
};
   

export default Form;