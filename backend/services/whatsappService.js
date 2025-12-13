// const axios = require('axios');
// require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// const MSG91_API_KEY = process.env.MSG91_API_KEY;
// const MSG91_TEMPLATE_NAME = 'kyc_ivr';
// const MSG91_NUMBER = process.env.MSG91_NUMBER;

// async function sendWhatsAppMessage(phoneNumber, data) {
//   let cleanNumber = String(phoneNumber).replace(/\D/g, '');
//   if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

//   const name = data?.name || 'Customer';

//   const response = await axios.post(
//     'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
//     {
//       integrated_number: MSG91_NUMBER,
//       content_type: 'template',
//       payload: {
//         messaging_product: 'whatsapp',
//         type: 'template',
//         template: {
//           name: MSG91_TEMPLATE_NAME,
//           language: { code: 'en' },
//           to_and_components: [
//             {
//               to: [cleanNumber],
//               components: {
//                 body_1: {
//                   type: 'text',
//                   value: name
//                 }
//               }
//             }
//           ]
//         }
//       }
//     },
//     {
//       headers: {
//         authkey: MSG91_API_KEY,
//         'Content-Type': 'application/json'
//       }
//     }
//   );

//   return {
//     success: true,
//     messageId: response.data?.request_id || null
//   };
// }

// /* ✅ EXPORT MUST LOOK EXACTLY LIKE THIS */
// module.exports = {
//   sendWhatsAppMessage
// };


const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MSG91_API_KEY = process.env.MSG91_API_KEY;
const MSG91_TEMPLATE_NAME = 'kyc_ivr';
const MSG91_NUMBER = process.env.MSG91_NUMBER;

/**
 * ✅ DO NOT CREATE NEW FILES
 * ✅ JUST PASS callId WHEN SENDING WHATSAPP
 */
async function sendWhatsAppMessage(phoneNumber, name, callId) {
   console.log('📤 sendWhatsAppMessage called with:', { phoneNumber, name, callId });

   let cleanNumber = String(phoneNumber).replace(/\D/g, '');
   if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;

   console.log('🧹 Cleaned number:', cleanNumber);

   const payload = {
     integrated_number: MSG91_NUMBER,
     content_type: 'template',
     payload: {
       messaging_product: 'whatsapp',
       type: 'template',
       template: {
         name: MSG91_TEMPLATE_NAME,
         language: { code: 'en' },
         to_and_components: [
           {
             to: [cleanNumber],
             components: {
               body_1: {
                 type: 'text',
                 value: name || 'Customer'
               },
               button_1: {
                 type: 'text',
                 value: callId ? callId.toString() : 'N/A' // ✅ THIS fills {{1}}
               }
             }
           }
         ]
       }
     }
   };

   console.log('📦 Payload to MSG91:', JSON.stringify(payload, null, 2));

   try {
     const response = await axios.post(
       'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
       payload,
       {
         headers: {
           authkey: MSG91_API_KEY,
           'Content-Type': 'application/json'
         }
       }
     );

     console.log('✅ MSG91 API response:', response.data);

     return {
       success: true,
       messageId: response.data?.request_id || null
     };
   } catch (error) {
     console.error('❌ MSG91 API error:', error.response?.data || error.message);
     throw error;
   }
 }

module.exports = { sendWhatsAppMessage };
