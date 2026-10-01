import pool from '../src/config/db.js';

const seed = async () => {
  console.log('Starting database seeding...');

  try {
    // Insert Admin
    await pool.query(`
      INSERT IGNORE INTO users (id, name, email, password_hash, address, role) 
      VALUES (1, 'System Admin', 'admin@roxiler.com', 'placeholder_hash_Admin1!', 'Admin HQ', 'ADMIN')
    `);
    console.log('Admin user seeded.');

    // Insert Store Owner
    await pool.query(`
      INSERT IGNORE INTO users (id, name, email, password_hash, address, role) 
      VALUES (2, 'Alice Owner', 'alice@owner.com', 'placeholder_hash_Owner1!', '123 Market St', 'STORE_OWNER')
    `);
    console.log('Store Owner user seeded.');

    // Insert Normal User
    await pool.query(`
      INSERT IGNORE INTO users (id, name, email, password_hash, address, role) 
      VALUES (3, 'Bob Reviewer', 'bob@user.com', 'placeholder_hash_User1!', '456 Review Ln', 'USER')
    `);
    console.log('Normal user seeded.');

    // Insert Stores
    await pool.query(`
      INSERT IGNORE INTO stores (id, name, email, address, owner_id) 
      VALUES 
      (1, 'Alice First Store', 'contact@alicefirst.com', '123 Market St', 2),
      (2, 'Alice Second Store', 'hello@alicesecond.com', '124 Market St', 2)
    `);
    console.log('Stores seeded.');

    // Insert Ratings
    await pool.query(`
      INSERT IGNORE INTO ratings (id, user_id, store_id, rating) 
      VALUES 
      (1, 3, 1, 5),
      (2, 3, 2, 4)
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
