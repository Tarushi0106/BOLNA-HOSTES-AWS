const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function extractNameAndSummary(transcript = '') {
  if (!transcript.trim()) {
    return { name: null, summary: '' };
  }

  const prompt = `
You are a STRICT CRM extraction AI.

Rules for NAME:
- Extract a person's name ONLY if the speaker clearly introduces themselves.
- Valid examples:
  "I am Akram"
  "Akram speaking"
  "My name is Tarushi"
  "This is Akram"
- DO NOT extract:
  - company names
  - services
  - products
  - certifications
  - topics
- If NOT explicitly stated → name must be null.

Now analyze this transcript:

"${transcript}"

Return JSON ONLY in this format:
{
  "name": string | null,
  "summary": string
}

Summary:
- 1 short, business-ready paragraph
`;

  try {
    const r = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });

    return JSON.parse(r.choices[0].message.content);
  } catch (e) {
    console.error('❌ Groq error:', e.message);
    return { name: null, summary: '' };
  }
}

module.exports = { extractNameAndSummary };
