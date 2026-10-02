import app from '../src/app.js';
import pool from '../src/config/db.js';

const server = app.listen(0, async () => {
  const port = server.address().port;
  try {
    const res = await fetch(`http://localhost:${port}/api/health`);
    const data = await res.json();
    console.log('HEALTH STATUS:', res.status);
    console.log('HEALTH BODY:', JSON.stringify(data));
    console.log(res.status === 200 && data.database === 'connected' ? '[PASS] Server starts and connects to Railway MySQL' : '[FAIL] Health check failed');
  } catch (error) {
    console.error('[FAIL] Startup check error:', error.message);
  } finally {
    server.close();
    await pool.end();
    process.exit(0);
  }
});
