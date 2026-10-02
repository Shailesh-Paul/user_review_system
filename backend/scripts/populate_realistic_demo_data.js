import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const ensureUser = async ({ name, email, password, role, address, mustChangePassword }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);

  if (existing.length > 0) {
    return { id: existing[0].id, created: false };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await conn.execute(
    'INSERT INTO users (name, email, password_hash, address, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)',
    [name, normalizedEmail, passwordHash, address || null, role, mustChangePassword ? 1 : 0]
  );

  return { id: result.insertId, created: true };
};

const ensureStore = async ({ name, email, address, ownerId }) => {
  const [existing] = await conn.execute('SELECT id FROM stores WHERE email = ? OR name = ?', [email, name]);

  if (existing.length > 0) {
    return { id: existing[0].id, created: false };
  }

  const [result] = await conn.execute(
    'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
    [name, email, address, ownerId]
  );

  return { id: result.insertId, created: true };
};

const ensureProduct = async ({ storeId, name, category, description, price, imageUrl, status }) => {
  const [existing] = await conn.execute('SELECT id FROM products WHERE store_id = ? AND name = ?', [storeId, name]);

  if (existing.length > 0) {
    return { id: existing[0].id, created: false };
  }

  const [result] = await conn.execute(
    'INSERT INTO products (store_id, name, category, description, price, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [storeId, name, category, description, price, imageUrl || null, status || 'IN_STOCK']
  );

  return { id: result.insertId, created: true };
};

const defaultPasswords = {
  owner: 'Owner@Demo123',
  user: 'User@Demo123',
};

const ownerProfiles = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@roxiler.test', address: '12 MP Nagar Zone-II, Bhopal, Madhya Pradesh - 462011' },
  { name: 'Priya Verma', email: 'priya.verma@roxiler.test', address: '45 Vijay Nagar, Indore, Madhya Pradesh - 452010' },
  { name: 'Rahul Mehta', email: 'rahul.mehta@roxiler.test', address: '24 Baner Road, Pune, Maharashtra - 411007' },
  { name: 'Ananya Patel', email: 'ananya.patel@roxiler.test', address: '18 Koramangala, Bengaluru, Karnataka - 560034' },
  { name: 'Vikram Singh', email: 'vikram.singh@roxiler.test', address: '7 Banjara Hills, Hyderabad, Telangana - 500034' },
  { name: 'Neha Joshi', email: 'neha.joshi@roxiler.test', address: '39 Vaishali Nagar, Jaipur, Rajasthan - 302021' },
  { name: 'Rohan Gupta', email: 'rohan.gupta@roxiler.test', address: '15 Dwarka Sector 9, New Delhi, Delhi - 110077' },
  { name: 'Sneha Iyer', email: 'sneha.iyer@roxiler.test', address: '8 Adyar, Chennai, Tamil Nadu - 600020' },
  { name: 'Aditya Nair', email: 'aditya.nair@roxiler.test', address: '42 Navrangpura, Ahmedabad, Gujarat - 380009' },
  { name: 'Kavya Reddy', email: 'kavya.reddy@roxiler.test', address: '20 Salt Lake, Kolkata, West Bengal - 700064' },
  { name: 'Arjun Malhotra', email: 'arjun.malhotra@roxiler.test', address: '9 Hazratganj, Lucknow, Uttar Pradesh - 226001' },
  { name: 'Meera Kulkarni', email: 'meera.kulkarni@roxiler.test', address: '11 Kalyan Nagar, Bengaluru, Karnataka - 560043' },
];

const userProfiles = [
  { name: 'Aditi Rao', email: 'aditi.rao@roxiler.test', address: 'Bhopal, Madhya Pradesh' },
  { name: 'Saurabh Desai', email: 'saurabh.desai@roxiler.test', address: 'Nagpur, Maharashtra' },
  { name: 'Ishita Kapoor', email: 'ishita.kapoor@roxiler.test', address: 'Delhi, Delhi' },
  { name: 'Manish Tiwari', email: 'manish.tiwari@roxiler.test', address: 'Varanasi, Uttar Pradesh' },
  { name: 'Pooja Sethi', email: 'pooja.sethi@roxiler.test', address: 'Jaipur, Rajasthan' },
  { name: 'Nikhil Pawar', email: 'nikhil.pawar@roxiler.test', address: 'Nashik, Maharashtra' },
  { name: 'Ritika Shah', email: 'ritika.shah@roxiler.test', address: 'Surat, Gujarat' },
  { name: 'Harsh Vyas', email: 'harsh.vyas@roxiler.test', address: 'Ahmedabad, Gujarat' },
  { name: 'Deepa Nair', email: 'deepa.nair@roxiler.test', address: 'Kochi, Kerala' },
  { name: 'Karan Bhatia', email: 'karan.bhatia@roxiler.test', address: 'Chandigarh, Chandigarh' },
  { name: 'Shreya Menon', email: 'shreya.menon@roxiler.test', address: 'Thiruvananthapuram, Kerala' },
  { name: 'Vivek Chawla', email: 'vivek.chawla@roxiler.test', address: 'Noida, Uttar Pradesh' },
  { name: 'Tanvi Mishra', email: 'tanvi.mishra@roxiler.test', address: 'Patna, Bihar' },
  { name: 'Yash Banerjee', email: 'yash.banerjee@roxiler.test', address: 'Kolkata, West Bengal' },
  { name: 'Mitali Das', email: 'mitali.das@roxiler.test', address: 'Guwahati, Assam' },
  { name: 'Raghav Malviya', email: 'raghav.malviya@roxiler.test', address: 'Gwalior, Madhya Pradesh' },
  { name: 'Shivani Kulkarni', email: 'shivani.kulkarni@roxiler.test', address: 'Pune, Maharashtra' },
  { name: 'Naman Arora', email: 'naman.arora@roxiler.test', address: 'Faridabad, Haryana' },
  { name: 'Ayesha Khan', email: 'ayesha.khan@roxiler.test', address: 'Hyderabad, Telangana' },
  { name: 'Krishna Iyer', email: 'krishna.iyer@roxiler.test', address: 'Coimbatore, Tamil Nadu' },
  { name: 'Himanshu Gupta', email: 'himanshu.gupta@roxiler.test', address: 'Lucknow, Uttar Pradesh' },
  { name: 'Bhavna Joshi', email: 'bhavna.joshi@roxiler.test', address: 'Mumbai, Maharashtra' },
  { name: 'Omkar Patil', email: 'omkar.patil@roxiler.test', address: 'Kolhapur, Maharashtra' },
  { name: 'Janhvi Natarajan', email: 'janhvi.natarajan@roxiler.test', address: 'Madurai, Tamil Nadu' },
  { name: 'Aman Khanna', email: 'aman.khanna@roxiler.test', address: 'Amritsar, Punjab' },
  { name: 'Rhea Dutta', email: 'rhea.dutta@roxiler.test', address: 'Agartala, Tripura' },
  { name: 'Siddharth Jain', email: 'siddharth.jain@roxiler.test', address: 'Indore, Madhya Pradesh' },
  { name: 'Ankita Mehta', email: 'ankita.mehta@roxiler.test', address: 'Rajkot, Gujarat' },
  { name: 'Prateek Solanki', email: 'prateek.solanki@roxiler.test', address: 'Vadodara, Gujarat' },
  { name: 'Diya Sen', email: 'diya.sen@roxiler.test', address: 'Bhubaneswar, Odisha' },
  { name: 'Ashwin Pillai', email: 'ashwin.pillai@roxiler.test', address: 'Ernakulam, Kerala' },
  { name: 'Kavita Singh', email: 'kavita.singh@roxiler.test', address: 'Ranchi, Jharkhand' },
  { name: 'Mrunal Shah', email: 'mrunal.shah@roxiler.test', address: 'Ahmedabad, Gujarat' },
  { name: 'Dev Kapoor', email: 'dev.kapoor@roxiler.test', address: 'Jalandhar, Punjab' },
  { name: 'Nisha Bansal', email: 'nisha.bansal@roxiler.test', address: 'Shimla, Himachal Pradesh' },
  { name: 'Kabir Sharma', email: 'kabir.sharma@roxiler.test', address: 'Bengaluru, Karnataka' },
  { name: 'Gayatri Reddy', email: 'gayatri.reddy@roxiler.test', address: 'Warangal, Telangana' },
  { name: 'Tejas Verma', email: 'tejas.verma@roxiler.test', address: 'Gurugram, Haryana' },
  { name: 'Falguni Nair', email: 'falguni.nair@roxiler.test', address: 'Kozhikode, Kerala' },
  { name: 'Parth Sinha', email: 'parth.sinha@roxiler.test', address: 'Raipur, Chhattisgarh' },
  { name: 'Simran Kaur', email: 'simran.kaur@roxiler.test', address: 'Chennai, Tamil Nadu' },
  { name: 'Rishabh Choudhary', email: 'rishabh.choudhary@roxiler.test', address: 'Udaipur, Rajasthan' },
  { name: 'Sonal Bhandari', email: 'sonal.bhandari@roxiler.test', address: 'Dehradun, Uttarakhand' },
  { name: 'Vatsal Joshi', email: 'vatsal.joshi@roxiler.test', address: 'Bhopal, Madhya Pradesh' },
  { name: 'Madhav Garg', email: 'madhav.garg@roxiler.test', address: 'Kanpur, Uttar Pradesh' },
];

const storeProfiles = [
  { name: 'Bhopal Electronics Hub', email: 'hello@bhopal-electronics.test', address: '12 MP Nagar Zone-II, Bhopal, Madhya Pradesh - 462011', ownerName: 'Aarav Sharma' },
  { name: 'Indore Mobile World', email: 'support@indore-mobile.test', address: '56 Vijay Nagar, Indore, Madhya Pradesh - 452010', ownerName: 'Priya Verma' },
  { name: 'Pune Digital Studio', email: 'care@pune-digital.test', address: '24 Baner Road, Pune, Maharashtra - 411007', ownerName: 'Rahul Mehta' },
  { name: 'Bengaluru Smart Devices', email: 'hello@bengaluru-smart.test', address: '18 Koramangala, Bengaluru, Karnataka - 560034', ownerName: 'Ananya Patel' },
  { name: 'Hyderabad Gadget House', email: 'service@hyderabad-gadget.test', address: '7 Banjara Hills, Hyderabad, Telangana - 500034', ownerName: 'Vikram Singh' },
  { name: 'Jaipur Lifestyle Mart', email: 'contact@jaipur-lifestyle.test', address: '39 Vaishali Nagar, Jaipur, Rajasthan - 302021', ownerName: 'Neha Joshi' },
  { name: 'Delhi Tech Square', email: 'sales@delhi-tech.test', address: '15 Dwarka Sector 9, New Delhi, Delhi - 110077', ownerName: 'Rohan Gupta' },
  { name: 'Chennai Digital Plaza', email: 'support@chennai-digital.test', address: '8 Adyar, Chennai, Tamil Nadu - 600020', ownerName: 'Sneha Iyer' },
  { name: 'Ahmedabad Tech Avenue', email: 'hello@ahmedabad-tech.test', address: '42 Navrangpura, Ahmedabad, Gujarat - 380009', ownerName: 'Aditya Nair' },
  { name: 'Kolkata Smart Store', email: 'connect@kolkata-smart.test', address: '20 Salt Lake, Kolkata, West Bengal - 700064', ownerName: 'Kavya Reddy' },
  { name: 'Lucknow Electronics Hub', email: 'support@lucknow-electronics.test', address: '9 Hazratganj, Lucknow, Uttar Pradesh - 226001', ownerName: 'Arjun Malhotra' },
  { name: 'Bengaluru Home Essentials', email: 'buy@bengaluru-home.test', address: '11 Kalyan Nagar, Bengaluru, Karnataka - 560043', ownerName: 'Meera Kulkarni' },
];

const reviewTexts = [
  'The service was quick and the quality was better than expected. Delivery was on time and the staff were helpful.',
  'Very polite support and the product feels durable. I would definitely visit again for future needs.',
  'The overall experience was smooth, though a little more pricing transparency would help. Still a good purchase.',
  'The product matched the description and the staff explained the features clearly. Very satisfied with the service.',
  'I liked the setup assistance and the build quality. It feels premium and worth the price.',
  'The store offers good value and the experience was pleasant. The team was knowledgeable and responsive.',
  'Good quality and easy to use. I appreciated the quick response from the team and the clean presentation.',
  'Affordable and reliable. It performed well for daily use and the support experience was friendly.',
  'The product arrived in good condition and works efficiently. The store staff made the purchase easy.',
  'A balanced experience overall with strong customer support and decent performance for regular use.',
  'The ordering process was simple and the product quality matches the promise. I would recommend it.',
  'Very helpful staff and good product variety. The buying experience was comfortable and efficient.',
  'Excellent value for money. The product design is clean and the performance is consistent.',
  'I had a good experience with the purchase and the after-sales guidance was useful.',
  'The store is well managed and the product quality is consistent. I would return for future purchases.',
  'Convenient location and good customer service. The product worked as expected from day one.',
  'The quality is reliable, and the staff made the decision easy with clear explanations.',
  'I was impressed by the product finish and the pricing value. The experience was overall positive.',
  'Strong product quality and good service. I appreciate how smoothly the entire process went.',
  'The store had a good selection and the team was attentive. I found the product worthwhile.',
];

const aspectsByStore = {
  electronics: ['Battery Backup', 'Sound Quality', 'Build Quality', 'Value for Money'],
  home: ['Performance', 'Noise', 'Energy Efficiency', 'Ease of Use'],
  lifestyle: ['Comfort', 'Fit', 'Fabric Quality', 'Value for Money'],
  default: ['Build Quality', 'Service', 'Value for Money'],
};

const determineCategory = (storeName) => {
  const lower = storeName.toLowerCase();
  if (lower.includes('mobile') || lower.includes('digital') || lower.includes('tech') || lower.includes('gadget') || lower.includes('electronics')) return 'electronics';
  if (lower.includes('home') || lower.includes('essentials')) return 'home';
  if (lower.includes('lifestyle') || lower.includes('mart')) return 'lifestyle';
  return 'default';
};

const buildAspectRows = (ratingId, storeName) => {
  const category = determineCategory(storeName);
  const aspectList = aspectsByStore[category] ?? aspectsByStore.default;
  const rows = [];
  for (const name of aspectList) {
    const score = [3, 4, 5, 2, 4, 3, 5][Math.abs((ratingId + name.length) % 7)];
    rows.push([ratingId, name, score]);
  }
  return rows;
};

const productCatalogByStore = {
  'Bhopal Electronics Hub': [
    { name: 'Noise Cancelling Headphones', category: 'Electronics', description: 'Wireless over-ear headphones with rich bass and 35-hour battery life.', price: 3899, imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: '4K Smart LED TV', category: 'Electronics', description: 'Ultra-HD smart television with voice assistant support and crisp colour output.', price: 49999, imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Power Bank 20000mAh', category: 'Accessories', description: 'Compact mobile power bank with USB-C fast charging support and multiple ports.', price: 1899, imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80', status: 'LOW_STOCK' }
  ],
  'Indore Mobile World': [
    { name: 'OnePlus Nord 5G', category: 'Smartphones', description: 'Premium mid-range smartphone with AMOLED display and reliable all-day battery.', price: 28999, imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Amazfit Smartwatch', category: 'Wearables', description: 'Fitness tracking watch with AMOLED screen, sleep insights and GPS support.', price: 6499, imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'USB-C Fast Charger', category: 'Accessories', description: 'Compact 65W charger designed for modern phones and laptops.', price: 1599, imageUrl: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' }
  ],
  'Pune Digital Studio': [
    { name: 'Dell Inspiron Laptop', category: 'Laptops', description: 'Slim laptop for work and media with SSD storage and comfortable keyboard.', price: 57999, imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Bluetooth Speaker Mini', category: 'Audio', description: 'Portable wireless speaker with clear sound and IPX5 splash resistance.', price: 2499, imageUrl: 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=900&q=80', status: 'LOW_STOCK' },
    { name: 'Webcam HD Pro', category: 'Accessories', description: 'USB webcam with autofocus and crisp HD video for meetings and streaming.', price: 4299, imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' }
  ],
  'Bengaluru Smart Devices': [
    { name: 'Air Fryer Deluxe', category: 'Home Appliances', description: 'Fast-cooking air fryer with digital controls and non-stick basket.', price: 8999, imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Smart Air Purifier', category: 'Home Appliances', description: 'Compact purifier with HEPA filtration for bedrooms and small offices.', price: 12999, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Portable SSD 1TB', category: 'Electronics', description: 'Durable SSD for creators, students and professionals on the move.', price: 6999, imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=900&q=80', status: 'LOW_STOCK' }
  ],
  'Hyderabad Gadget House': [
    { name: 'iPhone 15 Replica', category: 'Smartphones', description: 'Feature-rich flagship style smartphone with premium display and camera system.', price: 35999, imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Wireless Earbuds Pro', category: 'Audio', description: 'Pocket-friendly earbuds with active noise cancellation and deep bass.', price: 5499, imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Smart WiFi Router', category: 'Networking', description: 'High-speed dual-band router built for smooth streaming and work-from-home use.', price: 4999, imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' }
  ],
  'Jaipur Lifestyle Mart': [
    { name: 'Cotton Bed Set', category: 'Home & Living', description: 'Soft woven bedding set with breathable cotton finish for family comfort.', price: 3299, imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Aroma Diffuser', category: 'Home & Living', description: 'Minimal diffuser for calming fragrances and elevated home ambience.', price: 1999, imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Ceramic Dinner Set', category: 'Kitchen', description: 'Stylish tableware set for everyday family dining and gifting.', price: 2799, imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80', status: 'LOW_STOCK' }
  ],
  'Delhi Tech Square': [
    { name: 'Mechanical Keyboard', category: 'Accessories', description: 'Full-size keyboard with tactile switches and USB-C connectivity.', price: 4599, imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Gaming Monitor 27 inch', category: 'Electronics', description: 'High refresh gaming monitor with vivid colour and low-latency response.', price: 26999, imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'USB Hub 7-in-1', category: 'Accessories', description: 'Compact port expansion hub for laptops, monitors and charging needs.', price: 1499, imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' }
  ],
  'Chennai Digital Plaza': [
    { name: 'Ultrabook 14 inch', category: 'Laptops', description: 'Lightweight productivity laptop with all-day battery and fast SSD.', price: 65999, imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Noise Cancelling Earbuds', category: 'Audio', description: 'Rechargeable wireless earbuds designed for commuting and focus.', price: 3999, imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80', status: 'LOW_STOCK' },
    { name: 'USB-C Dock', category: 'Accessories', description: 'Multi-port docking station for workstations and home offices.', price: 5999, imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' }
  ],
  'Ahmedabad Tech Avenue': [
    { name: 'Smart Thermostat', category: 'Home Appliances', description: 'Energy-saving thermostat with app controls and scheduling.', price: 7999, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Bluetooth Speaker Max', category: 'Audio', description: 'Room-filling speaker with strong bass and 12-hour battery backup.', price: 4999, imageUrl: 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Portable Projector', category: 'Electronics', description: 'Compact projector for movies, presentations and family entertainment.', price: 29999, imageUrl: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' }
  ],
  'Kolkata Smart Store': [
    { name: 'Classic Mixer Grinder', category: 'Kitchen', description: 'Reliable kitchen appliance that handles daily grinding and blending tasks.', price: 4999, imageUrl: 'https://images.unsplash.com/photo-1585518419759-7fe2e0fbf8a6?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Water Purifier', category: 'Home Appliances', description: 'RO + UV filtration system built for safe and clean drinking water.', price: 14999, imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Non-Stick Cookware Set', category: 'Kitchen', description: 'Three-piece cookware set designed for daily cooking and easy clean-up.', price: 3499, imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80', status: 'LOW_STOCK' }
  ],
  'Lucknow Electronics Hub': [
    { name: 'Smart TV 55 inch', category: 'Electronics', description: 'Large-screen entertainment TV with crisp visuals and app integration.', price: 52999, imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Bluetooth Soundbar', category: 'Audio', description: 'Compact soundbar for a fuller home theatre experience.', price: 8999, imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Smart Plug', category: 'Home Automation', description: 'Simple smart outlet for voice control and app scheduling.', price: 999, imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' }
  ],
  'Bengaluru Home Essentials': [
    { name: 'Premium Reversible Comforter', category: 'Home & Living', description: 'Soft comforter with lightweight warmth and elegant finish.', price: 4999, imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' },
    { name: 'Storage Basket Set', category: 'Home & Living', description: 'Multi-purpose baskets to organize living rooms, shelves and closets.', price: 1699, imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80', status: 'LOW_STOCK' },
    { name: 'Desk Lamp LED', category: 'Home Office', description: 'Adjustable lamp with warm light temperature for focused work sessions.', price: 1499, imageUrl: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80', status: 'IN_STOCK' }
  ]
};

const main = async () => {
  const before = await conn.execute('SELECT COUNT(*) AS totalUsers FROM users');
  const beforeStores = await conn.execute('SELECT COUNT(*) AS totalStores FROM stores');
  const beforeRatings = await conn.execute('SELECT COUNT(*) AS totalRatings FROM ratings');
  console.log('Before seeding -> users:', before[0][0].totalUsers, 'stores:', beforeStores[0][0].totalStores, 'ratings:', beforeRatings[0][0].totalRatings);

  const ownerMap = new Map();
  for (const profile of ownerProfiles) {
    const user = await ensureUser({
      ...profile,
      password: defaultPasswords.owner,
      role: 'STORE_OWNER',
      mustChangePassword: true,
    });
    ownerMap.set(profile.name, user.id);
  }

  const storeNameById = new Map();
  for (const store of storeProfiles) {
    const ownerId = ownerMap.get(store.ownerName);
    if (!ownerId) continue;
    const record = await ensureStore({
      name: store.name,
      email: store.email,
      address: store.address,
      ownerId,
    });
    storeNameById.set(record.id, store.name);
  }

  for (const profile of userProfiles) {
    await ensureUser({
      name: profile.name,
      email: profile.email,
      password: defaultPasswords.user,
      role: 'USER',
      address: profile.address,
      mustChangePassword: false,
    });
  }

  const [userRows] = await conn.execute('SELECT id FROM users WHERE role = ? ORDER BY id ASC', ['USER']);
  const validUserIds = userRows.map((row) => row.id).filter((id) => id !== 1);
  const storeIdList = [...storeNameById.keys()];
  const pairSet = new Set();
  let createdRatingCount = 0;
  const targetRatingCount = 130;

  for (let index = 0; index < 5000 && createdRatingCount < targetRatingCount; index++) {
    const storeId = storeIdList[index % storeIdList.length];
    const userId = validUserIds[(index * 7) % validUserIds.length];
    const pairKey = `${userId}:${storeId}`;

    if (pairSet.has(pairKey)) continue;
    pairSet.add(pairKey);

    const ratingValue = [5, 5, 4, 4, 4, 3, 3, 2, 1][index % 9];
    const reviewText = reviewTexts[index % reviewTexts.length];
    const dateOffsetDays = (index % 180) + 3;
    const createdAt = new Date(Date.now() - (dateOffsetDays * 24 * 60 * 60 * 1000));

    const [existingRating] = await conn.execute('SELECT id FROM ratings WHERE user_id = ? AND store_id = ?', [userId, storeId]);
    if (existingRating.length > 0) continue;

    const [result] = await conn.execute(
      'INSERT INTO ratings (user_id, store_id, rating, review, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, storeId, ratingValue, reviewText, createdAt, createdAt]
    );

    const ratingId = result.insertId;
    const aspectRows = buildAspectRows(ratingId, storeNameById.get(storeId) || 'Default Store');
    await conn.query('INSERT INTO rating_aspects (rating_id, aspect_name, score) VALUES ?', [aspectRows]);
    createdRatingCount += 1;
  }

  const [storeRows] = await conn.execute('SELECT id, name FROM stores ORDER BY id ASC');
  const storeProducts = new Map();

  for (const storeRow of storeRows) {
    const seedProducts = productCatalogByStore[storeRow.name] ?? [];
    if (!seedProducts.length) continue;

    storeProducts.set(storeRow.id, seedProducts);
    for (const product of seedProducts) {
      await ensureProduct({
        storeId: storeRow.id,
        name: product.name,
        category: product.category,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        status: product.status
      });
    }
  }

  const finalUserCount = (await conn.execute('SELECT COUNT(*) AS totalUsers FROM users'))[0][0].totalUsers;
  const finalStoreCount = (await conn.execute('SELECT COUNT(*) AS totalStores FROM stores'))[0][0].totalStores;
  const finalRatingCount = (await conn.execute('SELECT COUNT(*) AS totalRatings FROM ratings'))[0][0].totalRatings;
  const finalAspectCount = (await conn.execute('SELECT COUNT(*) AS totalAspectRows FROM rating_aspects'))[0][0].totalAspectRows;
  const finalProductCount = (await conn.execute('SELECT COUNT(*) AS totalProducts FROM products'))[0][0].totalProducts;

  console.log('Final counts -> users:', finalUserCount, 'stores:', finalStoreCount, 'ratings:', finalRatingCount, 'aspect_rows:', finalAspectCount, 'products:', finalProductCount);
  console.log('Seeded realistic product catalog data for store-owner inventory views.');

  await conn.end();
};

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
