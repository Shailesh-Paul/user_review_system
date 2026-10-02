import pool from '../src/config/db.js';

const migrate = async () => {
  console.log('Starting database migration...');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(60) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        address VARCHAR(400),
        role ENUM('ADMIN', 'USER', 'STORE_OWNER') NOT NULL DEFAULT 'USER',
        must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created or verified.');

    try {
      await pool.query('ALTER TABLE users ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE');
      console.log('Added must_change_password column to users table.');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        address VARCHAR(400) NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'General Retail',
        description TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pin_code VARCHAR(10),
        contact_phone VARCHAR(30),
        owner_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Stores table created or verified.');

    const storeColumns = [
      ['category', 'ALTER TABLE stores ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT "General Retail"'],
      ['description', 'ALTER TABLE stores ADD COLUMN description TEXT'],
      ['city', 'ALTER TABLE stores ADD COLUMN city VARCHAR(100)'],
      ['state', 'ALTER TABLE stores ADD COLUMN state VARCHAR(100)'],
      ['pin_code', 'ALTER TABLE stores ADD COLUMN pin_code VARCHAR(10)'],
      ['contact_phone', 'ALTER TABLE stores ADD COLUMN contact_phone VARCHAR(30)']
    ];

    for (const [columnName, alterSql] of storeColumns) {
      try {
        await pool.query(alterSql);
        console.log(`Added ${columnName} column to stores table.`);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') throw e;
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NULL,
        image_url VARCHAR(1000),
        status ENUM('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED') NOT NULL DEFAULT 'IN_STOCK',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        INDEX idx_store_products (store_id, category),
        INDEX idx_store_product_name (store_id, name)
      )
    `);
    console.log('Products table created or verified.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        store_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_store (user_id, store_id)
      )
    `);
    // Add review column to ratings if it doesn't exist (MySQL doesn't support IF NOT EXISTS for columns in older versions, so we use a catch block)
    try {
      await pool.query('ALTER TABLE ratings ADD COLUMN review TEXT');
      console.log('Added review column to ratings table.');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rating_aspects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rating_id INT NOT NULL,
        aspect_name VARCHAR(255) NOT NULL,
        score INT NOT NULL CHECK (score >= 1 AND score <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (rating_id) REFERENCES ratings(id) ON DELETE CASCADE
      )
    `);
    console.log('Rating Aspects table created or verified.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rating_media (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rating_id INT NOT NULL,
        media_url VARCHAR(1000) NOT NULL,
        public_id VARCHAR(255) NOT NULL,
        media_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rating_id) REFERENCES ratings(id) ON DELETE CASCADE
      )
    `);
    console.log('Rating Media table created or verified.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_active_token (user_id, token_hash)
      )
    `);
    console.log('Password reset token table created or verified.');

    console.log('Database migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
