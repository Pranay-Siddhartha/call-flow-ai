function sendDatabaseError(res, error) {
  console.error('Database operation failed:', error?.code || 'unknown');
  return res.status(500).json({ error: 'Database operation failed' });
}

module.exports = { sendDatabaseError };
