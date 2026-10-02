import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const requiredVariables = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const getPasswordFromArgs = () => {
  const args = process.argv.slice(2);
  const passwordIndex = args.findIndex((arg) => arg === '--password' || arg === '-p');

  if (passwordIndex !== -1) {
    return args[passwordIndex + 1];
  }

  const directArg = args.find((arg) => !arg.startsWith('-'));
  return directArg || null;
};

const main = async () => {
  const password = getPasswordFromArgs();

  if (!password) {
    console.error('Usage: node scripts/reset-admin-password.js --password "NewDevPassword123!"');
    process.exit(1);
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  try {
    const [rows] = await pool.query(
      'SELECT id, email, role FROM users WHERE email IN (?, ?) LIMIT 1',
      ['admin@roxiler.test', 'admin@roxiler.com']
    );

    if (rows.length === 0) {
      console.error('Admin account not found. Seed the database first or create the ADMIN account.');
      process.exit(1);
    }

    const admin = rows[0];

    if (admin.role !== 'ADMIN') {
      console.error('The matched account is not an ADMIN user. Refusing to update a non-admin account.');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'must_change_password'");

    if (columns.length > 0) {
      await pool.query('UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?', [hashedPassword, admin.id]);
    } else {
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, admin.id]);
    }

    console.log('Admin password updated successfully.');
    console.log(`Admin email: ${admin.email}`);
    console.log('Role preserved: ADMIN');
  } catch (error) {
    console.error('Failed to update admin password:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
