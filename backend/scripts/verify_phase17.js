import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const run = async () => {
  const [tablesRows] = await conn.query('SHOW TABLES');
  const tables = tablesRows.map((row) => Object.values(row)[0]);
  console.log('TABLES:', tables.join(', '));

  const q = async (label, sql, params = []) => {
    const [rows] = await conn.query(sql, params);
    console.log(label, JSON.stringify(rows));
    return rows;
  };

  console.log('\n--- COUNTS ---');
  await q('users_by_role', 'SELECT role, COUNT(*) AS total FROM users GROUP BY role ORDER BY role');
  await q('stores', 'SELECT COUNT(*) AS total FROM stores');
  await q('products', 'SELECT COUNT(*) AS total FROM products');
  await q('ratings', 'SELECT COUNT(*) AS total FROM ratings');
  await q('reviews_with_text', "SELECT COUNT(*) AS total FROM ratings WHERE review IS NOT NULL AND TRIM(review) <> ''");
  await q('rating_aspects', 'SELECT COUNT(*) AS total FROM rating_aspects');
  await q('rating_media', 'SELECT COUNT(*) AS total FROM rating_media');
  await q('notifications', 'SELECT COUNT(*) AS total FROM notifications');
  await q('notifications_by_type', 'SELECT type, COUNT(*) AS total FROM notifications GROUP BY type ORDER BY type');

  console.log('\n--- ORPHAN CHECKS (each must be 0) ---');
  await q('orphan_ratings_no_store', 'SELECT COUNT(*) AS total FROM ratings r LEFT JOIN stores s ON s.id = r.store_id WHERE s.id IS NULL');
  await q('orphan_ratings_no_user', 'SELECT COUNT(*) AS total FROM ratings r LEFT JOIN users u ON u.id = r.user_id WHERE u.id IS NULL');
  await q('orphan_products_no_store', 'SELECT COUNT(*) AS total FROM products p LEFT JOIN stores s ON s.id = p.store_id WHERE s.id IS NULL');
  await q('orphan_notifications_no_user', 'SELECT COUNT(*) AS total FROM notifications n LEFT JOIN users u ON u.id = n.user_id WHERE u.id IS NULL');
  await q('orphan_stores_no_owner', 'SELECT COUNT(*) AS total FROM stores s LEFT JOIN users u ON u.id = s.owner_id WHERE u.id IS NULL');

  console.log('\n--- INDEXES ON RATINGS / NOTIFICATIONS ---');
  await q('ratings_indexes', "SHOW INDEX FROM ratings");
  await q('notifications_indexes', "SHOW INDEX FROM notifications");

  console.log('\n--- SAMPLE NOTIFICATIONS ---');
  await q('sample_notifications', 'SELECT id, user_id, type, title, LEFT(message, 80) AS message, is_read, created_at FROM notifications ORDER BY id DESC LIMIT 5');

  await conn.end();
};

run().catch((error) => {
  console.error('verification failed:', error.message);
  process.exit(1);
});
