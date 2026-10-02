import crypto from 'crypto';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import { validateEmail, validatePassword } from '../utils/validation.js';

const generateTemporaryPassword = () => {
  const randomSegment = crypto.randomBytes(4).toString('hex');
  return `Temp${randomSegment}!A1`;
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ totalStoreOwners }]] = await pool.query("SELECT COUNT(*) as totalStoreOwners FROM users WHERE role = 'STORE_OWNER'");
    const [[{ totalStores }]] = await pool.query('SELECT COUNT(*) as totalStores FROM stores');
    const [[{ totalReviews }]] = await pool.query('SELECT COUNT(*) as totalReviews FROM ratings');
    const [[{ averageRating }]] = await pool.query('SELECT ROUND(COALESCE(AVG(rating), 0), 1) as averageRating FROM ratings');
    const [[{ totalAdmins }]] = await pool.query("SELECT COUNT(*) as totalAdmins FROM users WHERE role = 'ADMIN'");
    const [[{ totalCustomers }]] = await pool.query("SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'USER'");

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAdmins,
        totalCustomers,
        totalStoreOwners,
        totalStores,
        totalReviews,
        averageRating: Number(averageRating || 0)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { name, email, address, role, sort, order, page = 1, limit = 10 } = req.query;
    let whereClause = '1=1';
    const params = [];

    if (name) { whereClause += ' AND name LIKE ?'; params.push(`%${name}%`); }
    if (email) { whereClause += ' AND email LIKE ?'; params.push(`%${email}%`); }
    if (address) { whereClause += ' AND address LIKE ?'; params.push(`%${address}%`); }
    if (role) { whereClause += ' AND role = ?'; params.push(role); }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM users WHERE ${whereClause}`, params);

    const allowedSort = ['name', 'email', 'role', 'created_at'];
    const sField = allowedSort.includes(sort) ? sort : 'created_at';
    const sOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const pPage = Math.max(1, parseInt(page) || 1);
    const pLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pPage - 1) * pLimit;

    const [users] = await pool.query(
      `SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE ${whereClause} ORDER BY ${sField} ${sOrder} LIMIT ? OFFSET ?`,
      [...params, pLimit, offset]
    );

    res.json({
      success: true,
      data: users,
      pagination: {
        page: pPage,
        limit: pLimit,
        total,
        totalPages: Math.ceil(total / pLimit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, address } = req.body;

    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({ success: false, message: 'Name must be between 20 and 60 characters.' });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (!password || !validatePassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be 8-16 characters long, contain at least one uppercase letter, one number, and one special character.' });
    }
    if (address && address.length > 400) {
      return res.status(400).json({ success: false, message: 'Address must not exceed 400 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email is already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = 'USER';
    const includeMustChangePassword = (await pool.query("SHOW COLUMNS FROM users LIKE 'must_change_password'"))[0].length > 0;

    const insertSql = includeMustChangePassword
      ? 'INSERT INTO users (name, email, password_hash, address, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)'
      : 'INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?)';
    const insertValues = includeMustChangePassword
      ? [name, normalizedEmail, passwordHash, address || null, assignedRole, false]
      : [name, normalizedEmail, passwordHash, address || null, assignedRole];

    const [result] = await pool.query(insertSql, insertValues);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: result.insertId, name, email: normalizedEmail, address: address || null, role: assignedRole }
    });
  } catch (err) {
    next(err);
  }
};

export const createStoreOwner = async (req, res, next) => {
  try {
    const { name, email, password, address } = req.body;

    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({ success: false, message: 'Name must be between 20 and 60 characters.' });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (password && !validatePassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be 8-16 characters long, contain at least one uppercase letter, one number, and one special character.' });
    }
    if (address && address.length > 400) {
      return res.status(400).json({ success: false, message: 'Address must not exceed 400 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email is already in use.' });
    }

    const generatedPassword = password || generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(generatedPassword, 10);
    const assignedRole = 'STORE_OWNER';
    const includeMustChangePassword = (await pool.query("SHOW COLUMNS FROM users LIKE 'must_change_password'"))[0].length > 0;

    const insertSql = includeMustChangePassword
      ? 'INSERT INTO users (name, email, password_hash, address, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)'
      : 'INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?)';
    const insertValues = includeMustChangePassword
      ? [name, normalizedEmail, passwordHash, address || null, assignedRole, true]
      : [name, normalizedEmail, passwordHash, address || null, assignedRole];

    const [result] = await pool.query(insertSql, insertValues);

    res.status(201).json({
      success: true,
      message: 'Store Owner created successfully',
      user: { id: result.insertId, name, email: normalizedEmail, address: address || null, role: assignedRole },
      ...(password ? {} : { temporaryPassword: generatedPassword })
    });
  } catch (err) {
    next(err);
  }
};

export const getStoreOwners = async (req, res, next) => {
  try {
    const { name, email, address, sort, order, page = 1, limit = 10 } = req.query;
    let whereClause = 'role = ?';
    const params = ['STORE_OWNER'];

    if (name) { whereClause += ' AND name LIKE ?'; params.push(`%${name}%`); }
    if (email) { whereClause += ' AND email LIKE ?'; params.push(`%${email}%`); }
    if (address) { whereClause += ' AND address LIKE ?'; params.push(`%${address}%`); }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM users WHERE ${whereClause}`, params);

    const allowedSort = ['name', 'email', 'created_at'];
    const sField = allowedSort.includes(sort) ? sort : 'created_at';
    const sOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const pPage = Math.max(1, parseInt(page) || 1);
    const pLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pPage - 1) * pLimit;

    const [owners] = await pool.query(
      `SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE ${whereClause} ORDER BY ${sField} ${sOrder} LIMIT ? OFFSET ?`,
      [...params, pLimit, offset]
    );

    res.json({
      success: true,
      data: owners,
      pagination: {
        page: pPage,
        limit: pLimit,
        total,
        totalPages: Math.ceil(total / pLimit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getStores = async (req, res, next) => {
  try {
    const { name, email, address, owner, sort, order, page = 1, limit = 10 } = req.query;
    let whereClause = '1=1';
    const params = [];

    if (name) { whereClause += ' AND s.name LIKE ?'; params.push(`%${name}%`); }
    if (email) { whereClause += ' AND s.email LIKE ?'; params.push(`%${email}%`); }
    if (address) { whereClause += ' AND s.address LIKE ?'; params.push(`%${address}%`); }
    if (owner) { whereClause += ' AND s.owner_id = ?'; params.push(owner); }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM stores s WHERE ${whereClause}`, params);

    const allowedSort = ['name', 'email', 'created_at'];
    const sField = allowedSort.includes(sort) ? `s.${sort}` : 's.created_at';
    const sOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const pPage = Math.max(1, parseInt(page) || 1);
    const pLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pPage - 1) * pLimit;

    const query = `
      SELECT s.id, s.name, s.email, s.address, s.owner_id, s.created_at, s.updated_at,
             u.name as owner_name, u.email as owner_email
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE ${whereClause}
      ORDER BY ${sField} ${sOrder}
      LIMIT ? OFFSET ?
    `;

    const [stores] = await pool.query(query, [...params, pLimit, offset]);

    res.json({
      success: true,
      data: stores,
      pagination: {
        page: pPage,
        limit: pLimit,
        total,
        totalPages: Math.ceil(total / pLimit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getReviews = async (req, res, next) => {
  try {
    const { storeId, userId, rating, sort, order, page = 1, limit = 10 } = req.query;
    let whereClause = '1=1';
    const params = [];

    if (storeId) { whereClause += ' AND r.store_id = ?'; params.push(storeId); }
    if (userId) { whereClause += ' AND r.user_id = ?'; params.push(userId); }
    if (rating) { whereClause += ' AND r.rating = ?'; params.push(Number(rating)); }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM ratings r WHERE ${whereClause}`, params);

    const allowedSort = ['rating', 'created_at'];
    const sField = allowedSort.includes(sort) ? `r.${sort}` : 'r.created_at';
    const sOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const pPage = Math.max(1, parseInt(page) || 1);
    const pLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pPage - 1) * pLimit;

    const [reviews] = await pool.query(
      `SELECT r.id, r.user_id, r.store_id, r.rating, r.review, r.created_at,
              u.name as user_name, s.name as store_name
       FROM ratings r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN stores s ON s.id = r.store_id
       WHERE ${whereClause}
       ORDER BY ${sField} ${sOrder}
       LIMIT ? OFFSET ?`,
      [...params, pLimit, offset]
    );

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: pPage,
        limit: pLimit,
        total,
        totalPages: Math.ceil(total / pLimit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createStore = async (req, res, next) => {
  try {
    const { name, email, address, ownerId } = req.body;

    if (!name || !email || !address || !ownerId) {
      return res.status(400).json({ success: false, message: 'Name, email, address, and ownerId are required.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (address.length > 400) {
      return res.status(400).json({ success: false, message: 'Address must not exceed 400 characters.' });
    }

    const [owners] = await pool.query('SELECT role FROM users WHERE id = ?', [ownerId]);
    if (owners.length === 0) {
      return res.status(400).json({ success: false, message: 'Owner user not found.' });
    }
    if (owners[0].role !== 'STORE_OWNER') {
      return res.status(400).json({ success: false, message: 'Assigned user must have the STORE_OWNER role.' });
    }

    const [result] = await pool.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
      [name, email, address, ownerId]
    );

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      store: {
        id: result.insertId,
        name,
        email,
        address,
        owner_id: ownerId
      }
    });
  } catch (err) {
    next(err);
  }
};
