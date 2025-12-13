import React, { useState, useEffect } from 'react';
import './form.css';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const Form = () => {
  const { id } = useParams(); // 🔥 objectId from URL

  const [formData, setFormData] = useState({

    // 🔹 PERSONAL INFORMATION
    personName: "",
    personPhone: "",
    personEmail: "",

    // Business Entity Section
    businessEntityName: '',
    state: '',
    accountManager: '',
    hoAddress: '',
    ceoName: '',
    ceoEmail: '',
    circleContactNo: '',
    panIndiaLocations: '',
    totalEmployees: '',
    annualTurnover: '',
    currentTelecomSpend: '',
    currentDataSpend: '',
    
    // Decision Makers
    keyPerson1: { name: '', title: '', role: '', contactNo: '', email: '' },
    keyPerson2: { name: '', title: '', role: '', contactNo: '', email: '' },
    keyPerson3: { name: '', title: '', role: '', contactNo: '', email: '' },
    
    // Products/Services
    services: {
      internet: { site1: '', site2: '', site3: '', existingBandwidth: '' },
      smartCCTV: { site1: '', site2: '', site3: '' },
      wifiAsService: { site1: '', site2: '', site3: '' },
      sdWAN: { site1: '', site2: '', site3: '' },
      cyberSecurity: { site1: '', site2: '', site3: '' },
      ispName: '',
      existingPlans: '',
      currentJioEngagement: '',
      jioSubscribers: { cocpNos: '', ioipNos: '', jiofi: '' }
    },
    
    // Infrastructure
    infrastructure: {
      totalLocations: '',
      fibre: { discussionInitiated: '', permissionReceived: '', wvp: '', completed: '' },
      ibs: { discussionInitiated: '', permissionReceived: '', wvp: '', completed: '' },
      wifi: { discussionInitiated: '', permissionReceived: '', wvp: '', completed: '' }
    },
    
    // Current Discussion Thread
    currentDiscussion: ''
  });

  // 🔥 PREFILL PERSONAL INFO FROM OBJECT ID
  useEffect(() => {
    if (!id) return;

    async function loadPersonalInfo() {
      try {
        const res = await axios.get(`http://13.53.90.157:5001/api/forms/${id}`);

        if (res.data?.success && res.data?.data) {
          const d = res.data.data;

          setFormData(prev => ({
            ...prev,
            personName: d.personName || d.name || "",
            personPhone: d.personPhone || d.phone_number || "",
            personEmail: d.personEmail || d.email || ""
          }));
        }
      } catch (err) {
        console.error("Failed to prefill personal info", err);
      }
    }

    loadPersonalInfo();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split('.');

    if (keys.length === 1) {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (keys.length === 2) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: { ...prev[keys[0]], [keys[1]]: value }
      }));
    } else if (keys.length === 3) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    alert('Form submitted! Check console for data.');
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>

        {/* 🔹 PERSONAL INFORMATION SECTION — HTML UNCHANGED */}
        <div className="form-section">
          <div className="section-title">Personal Information</div>

          <div className="grid-row">
            <div className="input-group">
              <label>Name:</label>
              <input type="text" name="personName" value={formData.personName} onChange={handleInputChange} required />
            </div>

            <div className="input-group">
              <label>Phone Number:</label>
              <input type="tel" name="personPhone" value={formData.personPhone} onChange={handleInputChange} required />
            </div>

            <div className="input-group">
              <label>Email:</label>
              <input type="email" name="personEmail" value={formData.personEmail} onChange={handleInputChange} required />
            </div>
          </div>
        </div>

        {/* 🔻 REST OF YOUR FORM — 100% UNCHANGED */}
        {/* (Business Entity, Services, Infrastructure, Discussion, Submit Button) */}

        <div className="form-footer">
          <button type="submit" className="submit-btn">Submit Form</button>
        </div>

      </form>
    </div>
  );
};

export default Form;
