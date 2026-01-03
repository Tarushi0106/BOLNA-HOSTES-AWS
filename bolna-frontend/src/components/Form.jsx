import React, { useState, useEffect } from 'react';   // ✅ useEffect added
import './form.css';
import axios from 'axios';                            // ✅ axios added
import { useParams } from 'react-router-dom';         // ✅ useParams added

const Form = () => {
  const { callId } = useParams();

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

const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);


  // 🔥 PREFILL: Load existing LeadForm if available, otherwise prefill personal info from call
useEffect(() => {
  if (!callId) return;

  const loadFormData = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://13.53.90.157/api/forms/prefill/${callId}`
      );

      const f = res.data?.data || {};
setFormData(prev => ({
  ...prev,

  // ✅ ONLY CALL / PERSONAL PREFILL
  personPhone:
    f.personPhone ||
    f.phone_number ||
    prev.personPhone,

  callerPhone:
    f.callerPhone ||
    f.from_number ||
    f.fromNumber ||
    prev.callerPhone,

  personName: f.personName || f.name || "",
  personEmail: f.personEmail || f.email || "",

  // ❌ FORCE LEAD DETAILS EMPTY
  company_name: "",
  contact_person: "",
  contact_no: "",
  company_email: "",
  address: "",
  lead_state: "",
  date: "",
  product_interested: "",
  remark: ""
}));


      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not load form data");
    } finally {
      setLoading(false);
    }
  };

  loadFormData();
}, [callId]);





  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split('.');
    
    if (keys.length === 1) {
      setFormData(prev => ({ ...prev, [name]: value }));
    } 
    else if (keys.length === 2) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: { ...prev[keys[0]], [keys[1]]: value }
      }));
    } 
    else if (keys.length === 3) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: {
            ...prev[keys[0]][keys[1]],
            [keys[2]]: value
          }
        }
      }));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await axios.post(
      `http://13.53.90.157/api/forms/${callId}`,
      {
        // 🔑 fields dashboard expects
        personName: formData.contact_person,
        personPhone: formData.contact_no,
        personEmail: formData.company_email,
        businessEntityName: formData.company_name,
        state: formData.lead_state,
        currentDiscussion: formData.remark,

        // 🧾 keep full form as well
        ...formData,
      }
    );

    alert("Form submitted successfully");
    setSubmitted(true);

  } catch (err) {
    console.error(err);
    alert("Failed to submit form");
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

     {/* Lead Details */}
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



      </form>
    )}
  </div>
);
};
   

export default Form;