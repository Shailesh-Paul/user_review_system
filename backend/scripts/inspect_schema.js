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

const [tablesRows] = await conn.query('SHOW TABLES');
const tables = tablesRows.map((row) => Object.values(row)[0]);
console.log('TABLES:', tables);

for (const table of tables) {
  const [cols] = await conn.query(`DESCRIBE \`${table}\``);
  console.log(`\nTABLE: ${table}`);
  console.log(JSON.stringify(cols, null, 2));
}

await conn.end();
