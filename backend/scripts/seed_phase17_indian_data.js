import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Phase 17 — Indian demo data enrichment (idempotent).
 *
 * The Phase 2 seed created two placeholder stores ("Alice First/Second Store")
 * with no location metadata, and the Phase 15 demo stores had no city/state/
 * PIN/category. This script fills realistic fictional Indian business details
 * without deleting any data and without changing rating/product relationships.
 */

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const stores = [
  { id: 1, name: 'Bhopal Gadget Bazaar', category: 'Consumer Electronics', city: 'Bhopal', state: 'Madhya Pradesh', pin: '462016', phone: '+91 755 400 1120', description: 'Trusted neighbourhood destination for smartphones, laptops and daily-use electronics in MP Nagar.' },
  { id: 2, name: 'Bhopal Home Needs', category: 'Home & Living', city: 'Bhopal', state: 'Madhya Pradesh', pin: '462001', phone: '+91 755 400 2231', description: 'Curated home, kitchen and living essentials for families across old Bhopal.' },
  { id: 3, name: 'Bhopal Electronics Hub', category: 'Consumer Electronics', city: 'Bhopal', state: 'Madhya Pradesh', pin: '462016', phone: '+91 755 411 4477', description: 'Multi-brand electronics showroom offering televisions, audio and accessories with in-store support.' },
  { id: 4, name: 'Indore Mobile World', category: 'Mobile & Wearables', city: 'Indore', state: 'Madhya Pradesh', pin: '452001', phone: '+91 731 402 8890', description: 'Smartphone and wearable specialist near Rajwada with genuine-warranty stock.' },
  { id: 5, name: 'Pune Digital Studio', category: 'Consumer Electronics', city: 'Pune', state: 'Maharashtra', pin: '411001', phone: '+91 20 4012 5566', description: 'Laptop, audio and creator-gear studio serving Pune professionals and students.' },
  { id: 6, name: 'Bengaluru Smart Devices', category: 'Home Appliances', city: 'Bengaluru', state: 'Karnataka', pin: '560034', phone: '+91 80 4012 7788', description: 'Home appliance and smart-device store covering Koramangala and nearby neighbourhoods.' },
  { id: 7, name: 'Hyderabad Gadget House', category: 'Mobile & Wearables', city: 'Hyderabad', state: 'Telangana', pin: '500034', phone: '+91 40 4012 9911', description: 'Gadgets, networking and mobile accessories retailer in Banjara Hills.' },
  { id: 8, name: 'Jaipur Lifestyle Mart', category: 'Home & Living', city: 'Jaipur', state: 'Rajasthan', pin: '302021', phone: '+91 141 4012 3344', description: 'Home and kitchen lifestyle store with curated decor for Jaipur households.' },
  { id: 9, name: 'Delhi Tech Square', category: 'Consumer Electronics', city: 'New Delhi', state: 'Delhi', pin: '110077', phone: '+91 11 4012 6677', description: 'Electronics and accessory outlet in Dwarka serving west Delhi.' },
  { id: 10, name: 'Chennai Digital Plaza', category: 'Consumer Electronics', city: 'Chennai', state: 'Tamil Nadu', pin: '600020', phone: '+91 44 4012 8822', description: 'Digital devices, laptops and audio showroom in Adyar.' },
  { id: 11, name: 'Ahmedabad Tech Avenue', category: 'Consumer Electronics', city: 'Ahmedabad', state: 'Gujarat', pin: '380009', phone: '+91 79 4012 4455', description: 'Electronics and home-appliance retailer in Navrangpura.' },
  { id: 12, name: 'Kolkata Smart Store', category: 'Home Appliances', city: 'Kolkata', state: 'West Bengal', pin: '700064', phone: '+91 33 4012 7766', description: 'Kitchen and home appliance store serving Salt Lake and Bidhannagar.' },
  { id: 13, name: 'Lucknow Electronics Hub', category: 'Consumer Electronics', city: 'Lucknow', state: 'Uttar Pradesh', pin: '226010', phone: '+91 522 4012 1199', description: 'Electronics and home-automation store in Gomti Nagar.' },
  { id: 14, name: 'Bengaluru Home Essentials', category: 'Home & Living', city: 'Bengaluru', state: 'Karnataka', pin: '560095', phone: '+91 80 4012 3311', description: 'Everyday home, office and living essentials for Bengaluru residents.' },
];

const ownerRenames = [
  { id: 2, from: 'Alice Owner', to: 'Devansh Kapoor' }
];

const run = async () => {
  let updatedStores = 0;
  for (const store of stores) {
    const [result] = await conn.execute(
      `UPDATE stores
         SET name = ?, category = ?, city = ?, state = ?, pin_code = ?, contact_phone = ?, description = ?
       WHERE id = ?`,
      [store.name, store.category, store.city, store.state, store.pin, store.phone, store.description, store.id]
    );
    updatedStores += result.affectedRows;
  }

  let updatedOwners = 0;
  for (const owner of ownerRenames) {
    const [result] = await conn.execute(
      'UPDATE users SET name = ? WHERE id = ? AND name = ?',
      [owner.to, owner.id, owner.from]
    );
    updatedOwners += result.affectedRows;
  }

  const [rows] = await conn.query(`
    SELECT s.id, s.name, s.category, s.city, s.state, s.pin_code
    FROM stores s ORDER BY s.id ASC
  `);

  console.log(`Updated stores: ${updatedStores}; renamed owners: ${updatedOwners}`);
  console.log('Current store locations:');
  for (const row of rows) {
    console.log(`  #${row.id} ${row.name} | ${row.category} | ${row.city}, ${row.state} ${row.pin_code}`);
  }

  await conn.end();
};

run().catch((error) => {
  console.error('Indian demo data enrichment failed:', error.message);
  process.exit(1);
});
