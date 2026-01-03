const axios = require("axios");

const API_URL = "https://core.shaurryatele.com/api/cp_online_leads_api.php";
const API_KEY = process.env.SHAURRYA_API_KEY;

async function pushOnlineLead(lead) {
const payload = {
  company_name: lead.company_name,
  contact_person: lead.contact_person,
  contact_no: lead.contact_no,
  company_email: lead.company_email,
  area: lead.address,
  state: lead.lead_state,
  visit_date: lead.date,
  product_pitched: lead.product_interested,
  remark: lead.remark,
  products: lead.products || []
};


  try {
    const response = await axios.post(API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
      },
      timeout: 30000
    });

    return response.data;
  } catch (err) {
    console.error("❌ Online Lead API Error:", err.response?.data || err.message);
    throw new Error("Online lead push failed");
  }
}

module.exports = { pushOnlineLead };
