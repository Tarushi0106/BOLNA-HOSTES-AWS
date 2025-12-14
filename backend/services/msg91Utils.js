function extractMsg91Error(err) {
  if (!err) return 'Unknown MSG91 error';

  const data = err.response?.data;

  if (data?.errors) return data.errors;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (typeof err.message === 'string') return err.message;

  try {
    return JSON.stringify(data);
  } catch {
    return 'Unparseable MSG91 error';
  }
}

module.exports = { extractMsg91Error };
