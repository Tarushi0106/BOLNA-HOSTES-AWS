// function extractName(text = '') {
//   if (!text) return '';

//   const userLines = text
//     .split('\n')
//     .filter(l => l.toLowerCase().startsWith('user:'))
//     .map(l => l.replace(/^user:\s*/i, '').trim());

//   for (let line of userLines) {
//     // Stop at common breakers
//     line = line.split(/\b(and|my|is|email|phone|number|request)\b/i)[0].trim();

//     // Ignore junk
//     if (/^(hi|hello|yes|okay|ok|sure)$/i.test(line)) continue;

//     // Match 1–3 word proper names
//     const m = line.match(/^[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}$/);
//     if (m) return m[0];
//   }

//   return '';
// }
function extractEmail(text = '') {
  const m = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0] : '';
}

function extractPhone(text = '') {
  const m = text.match(/(\+91[-\s]?)?[6-9]\d{9}/);
  return m ? m[0].replace(/\D/g, '') : '';
}

function extractBestTime(text = '') {
  if (!text) return null;

  const patterns = [
    // today at 8 pm / tomorrow at 11:30 am
    /\b(today|tomorrow|tonight)\b\s*(at)?\s*\b(\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?))\b/i,

    // at 8 pm today
    /\b(\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?))\b\s*(today|tomorrow|tonight)\b/i,

    // call me at 8 pm
    /\b(call|callback|reach|contact)\b.*?\b(\d{1,2}(:\d{2})?\s?(a\.?m\.?|p\.?m\.?))\b/i
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0].trim();
  }

  return null;
}


module.exports = {
  extractEmail,
  extractPhone,
  extractBestTime,
};
