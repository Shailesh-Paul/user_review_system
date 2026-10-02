import { env } from './config/env.js';
import app from './app.js';
import pool from './config/db.js';

const PORT = process.env.port || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
  });
  
  try {
    await pool.end();
    console.log('Database connection pool closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error closing database connection pool.');
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
