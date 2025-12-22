function extractEmail(text = '') {
  const m = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0] : '';
}

function extractPhone(text = '') {
  const m = text.match(/(\+91[-\s]?)?[6-9]\d{9}/);
  return m ? m[0].replace(/\D/g, '') : '';
}

function extractBestTime(text = "") {
  if (!text || typeof text !== "string") return null;

  const normalized = text
    .toLowerCase()
    .replace(/\b(one)\b/, "1")
    .replace(/\b(two)\b/, "2")
    .replace(/\b(three)\b/, "3")
    .replace(/\b(four)\b/, "4")
    .replace(/\b(five)\b/, "5")
    .replace(/\b(six)\b/, "6")
    .replace(/\b(seven)\b/, "7")
    .replace(/\b(eight)\b/, "8")
    .replace(/\b(nine)\b/, "9")
    .replace(/\b(ten)\b/, "10")
    .replace(/\b(eleven)\b/, "11")
    .replace(/\b(twelve)\b/, "12");

  const match = normalized.match(
    /\b(1[0-2]|0?[1-9])(:[0-5][0-9])?\s?(am|pm)\b/
  );

  return match ? match[0].toUpperCase() : null;
}





module.exports = {
  extractEmail,
  extractPhone,
  extractBestTime,
};
