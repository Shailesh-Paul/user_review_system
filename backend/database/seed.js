import bcrypt from 'bcrypt';
import pool from '../src/config/db.js';

const seed = async () => {
  console.log('Starting database seeding...');

  try {
    const adminPasswordHash = await bcrypt.hash('Admin@Roxiler123', 10);
    const ownerPasswordHash = await bcrypt.hash('Owner@Bhopal123', 10);
    const userPasswordHash = await bcrypt.hash('User@Roxiler123', 10);
    const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'must_change_password'");
    const includeMustChangePassword = columns.length > 0;

    if (includeMustChangePassword) {
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, address, role, must_change_password)
        VALUES (1, 'System Admin', 'admin@roxiler.test', ?, 'Admin HQ, Bhopal', 'ADMIN', FALSE)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          password_hash = VALUES(password_hash),
          address = VALUES(address),
          role = VALUES(role),
          must_change_password = VALUES(must_change_password)
      `, [adminPasswordHash]);
    } else {
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, address, role)
        VALUES (1, 'System Admin', 'admin@roxiler.test', ?, 'Admin HQ, Bhopal', 'ADMIN')
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          password_hash = VALUES(password_hash),
          address = VALUES(address),
          role = VALUES(role)
      `, [adminPasswordHash]);
    }
    console.log('Admin account seeded.');

    if (includeMustChangePassword) {
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, address, role, must_change_password)
        VALUES (2, 'Bhopal Store Owner', 'owner.bhopal@roxiler.test', ?, 'Bhopal, Madhya Pradesh', 'STORE_OWNER', TRUE)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          password_hash = VALUES(password_hash),
          address = VALUES(address),
          role = VALUES(role),
          must_change_password = VALUES(must_change_password)
      `, [ownerPasswordHash]);
    } else {
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, address, role)
        VALUES (2, 'Bhopal Store Owner', 'owner.bhopal@roxiler.test', ?, 'Bhopal, Madhya Pradesh', 'STORE_OWNER')
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          password_hash = VALUES(password_hash),
          address = VALUES(address),
          role = VALUES(role)
      `, [ownerPasswordHash]);
    }
    console.log('Store owner seeded.');

    if (includeMustChangePassword) {
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, address, role, must_change_password)
        VALUES (3, 'Mumbai Reviewer', 'reviewer.mumbai@roxiler.test', ?, 'Mumbai, Maharashtra', 'USER', FALSE)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          password_hash = VALUES(password_hash),
          address = VALUES(address),
          role = VALUES(role),
          must_change_password = VALUES(must_change_password)
      `, [userPasswordHash]);
    } else {
      await pool.query(`
        INSERT INTO users (id, name, email, password_hash, address, role)
        VALUES (3, 'Mumbai Reviewer', 'reviewer.mumbai@roxiler.test', ?, 'Mumbai, Maharashtra', 'USER')
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          password_hash = VALUES(password_hash),
          address = VALUES(address),
          role = VALUES(role)
      `, [userPasswordHash]);
    }
    console.log('User seeded.');

    await pool.query(`
      INSERT IGNORE INTO stores (id, name, email, address, owner_id)
      VALUES 
      (1, 'Bhopal Electronics', 'hello@bhopal-electronics.test', 'M.P. Nagar, Bhopal', 2),
      (2, 'Indore Mobile Hub', 'support@indore-mobile.test', 'Rajwada, Indore', 2)
    `);
    console.log('Stores seeded.');

    await pool.query(`
      INSERT IGNORE INTO ratings (id, user_id, store_id, rating, review)
      VALUES 
      (1, 3, 1, 5, 'Excellent service and fast support.'),
      (2, 3, 2, 4, 'Good experience overall.')
    `);
    console.log('Ratings seeded.');

    console.log('Database seeding completed successfully.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seed();
