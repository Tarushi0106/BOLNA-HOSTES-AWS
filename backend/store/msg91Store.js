// In-memory store (lives as long as server runs)
const msg91Store = new Map();

/**
 * Structure:
 * key   = requestId
 * value = { status, errorCode, reason, time }
 */

module.exports = msg91Store;
