import React, { useState, useEffect } from 'react';   // ✅ useEffect added
import './form.css';
import axios from 'axios';                            // ✅ axios added
import { useParams } from 'react-router-dom';         // ✅ useParams added

const Form = () => {
  const { callId } = useParams();


  const [formData, setFormData] = useState({

    // 🔹 PERSONAL INFORMATION (UNCHANGED)
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

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  console.log("PARAMS:", params);

  // 🔥 PREFILL: Load existing LeadForm if available, otherwise prefill personal info from call
  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true);
      setError(null);

      if (!callId) {
        console.log("❌ callId missing");
        setLoading(false);
        return;
      }

      console.log("✅ callId from URL:", callId);

      try {
        // First, try to fetch existing forms by callId
        const formsRes = await axios.get(`http://13.53.90.157:5001/api/forms/by-call/${callId}`);
        const existingForms = formsRes.data.data;

        if (existingForms && existingForms.length > 0) {
          // Load the latest existing form
          const latestForm = existingForms[0];
          console.log("✅ Loading existing form:", latestForm);
          setFormData(prev => ({
            ...prev,
            ...latestForm,
            services: latestForm.services || prev.services,
            infrastructure: latestForm.infrastructure || prev.infrastructure,
            keyPerson1: latestForm.keyPerson1 || prev.keyPerson1,
            keyPerson2: latestForm.keyPerson2 || prev.keyPerson2,
            keyPerson3: latestForm.keyPerson3 || prev.keyPerson3,
          }));
        } else {
          // No existing form, prefill personal info from call
          console.log("✅ No existing form, prefilling personal info");
         try {
  const callRes = await axios.get(
    `http://13.53.90.157:5001/api/forms/by-call/${callId}`
  );

  const forms = callRes.data.data;

  if (!forms || forms.length === 0) {
    console.log("ℹ️ No form yet, nothing to prefill");
    return;
  }

  const c = forms[0];

  setFormData(prev => ({
    ...prev,
    personName: c.personName || "",
    personPhone: c.personPhone || "",
    personEmail: c.personEmail || "",
  }));

} catch (callErr) {
  console.error("❌ Call data fetch failed:", callErr);
  setError("Could not load call data. Please enter details manually.");
}

        }
      } catch (err) {
        console.error("❌ Error loading form data:", err);
        setError("Could not load form data. Proceeding with blank form.");
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    // TODO: POST to backend to save the form
    alert('Form submitted! Check console for data.');
  };

  return (
    <div className="form-container">
    

      {loading && <p style={{ textAlign: 'center', color: '#666' }}>Loading form data...</p>}
      {error && <div style={{ 
        background: '#fff3cd', 
        color: '#856404', 
        padding: '12px', 
        borderRadius: '6px', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>⚠️ {error}</div>}

      {!loading && (
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
              <label>Phone Number:</label>
              <input 
                type="tel"
                name="personPhone"
                value={formData.personPhone}
                onChange={handleInputChange}
                required
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

        {/* Business Entity Section */}
        <div className="form-section">
          <div className="section-title">Business Entity Information</div>
          
          <div className="grid-row">
            <div className="input-group">
              <label>Business Entity Name:</label>
              <input 
                type="text" 
                name="businessEntityName"
                value={formData.businessEntityName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="input-group">
              <label>State:</label>
              <input 
                type="text" 
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="input-group">
              <label>Account Manager:</label>
              <input 
                type="text" 
                name="accountManager"
                value={formData.accountManager}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid-row">
            <div className="input-group">
              <label>HO Address:</label>
              <textarea 
                name="hoAddress"
                value={formData.hoAddress}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
          </div>

          <div className="grid-row">
            <div className="input-group">
              <label>CEO/Executive Director/MD:</label>
              <input 
                type="text" 
                name="ceoName"
                value={formData.ceoName}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="input-group">
              <label>Email:</label>
              <input 
                type="email" 
                name="ceoEmail"
                value={formData.ceoEmail}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="input-group">
              <label>CIRCLE Contact No: <span className="mandatory">MANDATORY FIELD</span></label>
              <input 
                type="tel" 
                name="circleContactNo"
                value={formData.circleContactNo}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid-row-4">
            <div className="input-group">
              <label>Pan India Location[Nos]:</label>
              <input 
                type="number" 
                name="panIndiaLocations"
                value={formData.panIndiaLocations}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="input-group">
              <label>Total No. of Employees:</label>
              <input 
                type="number" 
                name="totalEmployees"
                value={formData.totalEmployees}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="input-group">
              <label>Annual Turnover (Rs. Cr):</label>
              <input 
                type="number" 
                name="annualTurnover"
                value={formData.annualTurnover}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="input-group">
              <label>Current Telecom Spend(PA)(cr):</label>
              <input 
                type="number" 
                name="currentTelecomSpend"
                value={formData.currentTelecomSpend}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid-row">
            <div className="input-group">
              <label>Current Data Spend(PA)(cr):</label>
              <input 
                type="number" 
                name="currentDataSpend"
                value={formData.currentDataSpend}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* REQUIREMENT Synopsis */}
        <div className="form-section">
          <div className="section-title">REQUIREMENT Synopsis</div>
          <div className="section-subtitle">Decision Makers/ Influencers</div>
          
          <div className="table-container">
            <table className="decision-makers-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Key Person 1</th>
                  <th>Key Person 2</th>
                  <th>Key Person 3</th>
                </tr>
              </thead>
              <tbody>
                {['Name', 'Title', 'Role', 'Contact No.', 'email'].map((field) => (
                  <tr key={field}>
                    <td className="field-label">{field}</td>
                    {[1, 2, 3].map((num) => (
                      <td key={num}>
                        <input 
                          type="text"
                          name={`keyPerson${num}.${field.toLowerCase().replace(' ', '').replace('.', '')}`}
                          value={formData[`keyPerson${num}`][field.toLowerCase().replace(' ', '').replace('.', '')]}
                          onChange={handleInputChange}
                          placeholder={field}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products / Services Interested */}
        <div className="form-section">
          <div className="section-title">Products / Services Interested</div>
          
          <div className="services-grid">
            <div className="services-header">
              <div className="service-type">ILI Services</div>
              <div className="service-provider">Service Provider</div>
              <div className="data-services">Data/ Voice/ Data Centre/ WiFi Services</div>
            </div>
            
            {/* Internet Bandwidth */}
            <div className="service-row">
              <div className="service-name">Internet Bandwidth</div>
              <div className="sites-inputs">
                <input 
                  type="text" 
                  placeholder="Site 1" 
                  name="services.internet.site1"
                  value={formData.services.internet.site1}
                  onChange={handleInputChange}
                />
                <input 
                  type="text" 
                  placeholder="Site 2" 
                  name="services.internet.site2"
                  value={formData.services.internet.site2}
                  onChange={handleInputChange}
                />
                <input 
                  type="text" 
                  placeholder="Site 3" 
                  name="services.internet.site3"
                  value={formData.services.internet.site3}
                  onChange={handleInputChange}
                />
              </div>

              <div className="existing-bandwidth">
                <input 
                  type="text" 
                  placeholder="Existing Bandwidth" 
                  name="services.internet.existingBandwidth"
                  value={formData.services.internet.existingBandwidth}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* ISP Name */}
            <div className="service-row">
              <div className="service-name">&lt;Name of ISP/TELCO&gt;</div>
              <div className="isp-name-input">
                <input 
                  type="text" 
                  name="services.ispName"
                  value={formData.services.ispName}
                  onChange={handleInputChange}
                  placeholder="Enter ISP/TELCO name"
                />
              </div>
            </div>

            {/* Location */}
            <div className="service-row">
              <div className="service-name">Location</div>
              <div className="location-inputs">
                {['Site 1', 'Site 2', 'Site 3'].map((site, index) => (
                  <div key={site} className="location-group">
                    <span>{site}</span>
                    <input 
                      type="text" 
                      placeholder="Lat Long" 
                      name={`services.internet.site${index + 1}`}
                      value={formData.services.internet[`site${index + 1}`]}
                      onChange={handleInputChange}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Other Services */}
            {[
              { label: 'Smart CCTV as a Service', key: 'smartCCTV' },
              { label: 'WiFi as a Service', key: 'wifiAsService' },
              { label: 'SD-WAN', key: 'sdWAN' },
              { label: 'Cyber Security Services', key: 'cyberSecurity' }
            ].map(({ label, key }) => (
              <div className="service-row" key={key}>
                <div className="service-name">{label}</div>
                <div className="sites-inputs">
                  <input
                    type="text"
                    placeholder="Site 1"
                    name={`services.${key}.site1`}
                    value={formData.services[key].site1}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    placeholder="Site 2"
                    name={`services.${key}.site2`}
                    value={formData.services[key].site2}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    placeholder="Site 3"
                    name={`services.${key}.site3`}
                    value={formData.services[key].site3}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            ))}

            <div className="service-row">
              <div className="service-name">Existing Plans</div>
              <div className="existing-plans">
                <input 
                  type="text" 
                  name="services.existingPlans"
                  value={formData.services.existingPlans}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="service-row">
              <div className="service-name">Current Jio Engagement</div>
              <div className="jio-engagement">
                <input 
                  type="text" 
                  name="services.currentJioEngagement"
                  value={formData.services.currentJioEngagement}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Jio Subscribers */}
            <div className="service-row">
              <div className="service-name">Jio Subscribers</div>
              <div className="jio-subscribers">
                <div className="subscriber-group">
                  <label>COCP Nos</label>
                  <input 
                    type="text" 
                    name="services.jioSubscribers.cocpNos"
                    value={formData.services.jioSubscribers.cocpNos}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="subscriber-group">
                  <label>IOIP Nos</label>
                  <input 
                    type="text" 
                    name="services.jioSubscribers.ioipNos"
                    value={formData.services.jioSubscribers.ioipNos}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="subscriber-group">
                  <label>JioFi</label>
                  <input 
                    type="text" 
                    name="services.jioSubscribers.jiofi"
                    value={formData.services.jioSubscribers.jiofi}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Infrastructure Engagement */}
        <div className="form-section">
          <div className="section-title">Infrastructure Engagement</div>
          
          <div className="infrastructure-table">
            <table>
              <thead>
                <tr>
                  <th>Infrastructure Status</th>
                  <th>Fibre (FTTx)</th>
                  <th>IBS</th>
                  <th>WiFi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total No. Of Locations</td>
                  <td>
                    <input 
                      type="number" 
                      name="infrastructure.fibre.discussionInitiated"
                      value={formData.infrastructure.fibre.discussionInitiated}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      name="infrastructure.ibs.discussionInitiated"
                      value={formData.infrastructure.ibs.discussionInitiated}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      name="infrastructure.wifi.discussionInitiated"
                      value={formData.infrastructure.wifi.discussionInitiated}
                      onChange={handleInputChange}
                    />
                  </td>
                </tr>

                {['Permission Received', 'WVP', 'Completed'].map((status) => (
                  <tr key={status}>
                    <td>{status}</td>
                    {['fibre', 'ibs', 'wifi'].map((infra) => (
                      <td key={infra}>
                        <input 
                          type="text"
                          name={`infrastructure.${infra}.${status.toLowerCase().replace(' ', '')}`}
                          value={formData.infrastructure[infra][status.toLowerCase().replace(' ', '')]}
                          onChange={handleInputChange}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        </div>

        {/* Current Discussion Thread */}
        <div className="form-section">
          <div className="section-title">Current Discussion Thread</div>
          <div className="discussion-thread">
            <textarea 
              name="currentDiscussion"
              value={formData.currentDiscussion}
              onChange={handleInputChange}
              placeholder="Enter current discussion details..."
              rows="6"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-footer">
          <button type="submit" className="submit-btn">
            Submit Form
          </button>
        </div>

      </form>
      )}
    </div>
  );
};

export default Form;
