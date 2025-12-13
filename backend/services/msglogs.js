/**
 * Extracts a clean, human-readable error message from MSG91 response
 * Matches MSG91 "Reason" shown on dashboard
 * @param {any} err - axios error object
 * @returns {string}
 */
function extractMsg91Error(err) {
  if (!err) return 'Unknown MSG91 error';

  const data = err.response?.data;

  // 1️⃣ MSG91 auth / immediate failures (most common)
  if (data?.errors && typeof data.errors === 'string') {
    return data.errors;
  }

  // 2️⃣ MSG91 sometimes sends message instead of errors
  if (data?.message && typeof data.message === 'string') {
    return data.message;
  }

  // 3️⃣ MSG91 async response text (rare but exists)
  if (data?.data && typeof data.data === 'string') {
    return data.data;
  }

  // 4️⃣ Array-based errors (edge cases)
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.join(', ');
  }

  // 5️⃣ Axios-level error fallback
  if (typeof err.message === 'string') {
    return err.message;
  }

  // 6️⃣ Absolute fallback (never crashes)
  try {
    return JSON.stringify(data);
  } catch {
    return 'MSG91 error (unparseable)';
  }
}

module.exports = { extractMsg91Error };
