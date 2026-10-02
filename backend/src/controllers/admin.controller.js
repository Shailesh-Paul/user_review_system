import crypto from 'crypto';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import { validateEmail, validatePassword } from '../utils/validation.js';
import { createNotification, NOTIFICATION_TYPES, ENTITY_TYPES } from '../utils/notifications.js';
import { resolveRange } from '../utils/analyticsRange.js';

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

    if (name) { whereClause += ' AND LOWER(name) LIKE LOWER(?)'; params.push(`%${name}%`); }
    if (email) { whereClause += ' AND LOWER(email) LIKE LOWER(?)'; params.push(`%${email}%`); }
    if (address) { whereClause += ' AND LOWER(address) LIKE LOWER(?)'; params.push(`%${address}%`); }
    if (role) {
      if (!['ADMIN', 'USER', 'STORE_OWNER'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role filter.' });
      }
      whereClause += ' AND role = ?';
      params.push(role);
    }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM users WHERE ${whereClause}`, params);

    const allowedSort = ['name', 'email', 'address', 'role', 'created_at'];
    const sField = allowedSort.includes(sort) ? `u.${sort}` : 'u.created_at';
    const sOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const pPage = Math.max(1, parseInt(page) || 1);
    const pLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pPage - 1) * pLimit;

    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at, u.updated_at
       FROM users u WHERE ${whereClause} ORDER BY ${sField} ${sOrder}, u.id ${sOrder} LIMIT ? OFFSET ?`,
      [...params, pLimit, offset]
    );

    const owners = users.filter((user) => user.role === 'STORE_OWNER');
    if (owners.length > 0) {
      const [ownerStores] = await pool.query(
        `SELECT s.owner_id, s.id, s.name, s.email, s.address,
                COALESCE(ROUND(AVG(r.rating), 2), 0) AS averageRating,
                COUNT(r.id) AS totalRatings
         FROM stores s
         LEFT JOIN ratings r ON r.store_id = s.id
         WHERE s.owner_id IN (?)
         GROUP BY s.id
         ORDER BY s.name ASC, s.id ASC`,
        [owners.map((owner) => owner.id)]
      );
      const storesByOwner = new Map();
      for (const store of ownerStores) {
        if (!storesByOwner.has(store.owner_id)) storesByOwner.set(store.owner_id, []);
        storesByOwner.get(store.owner_id).push({
          id: store.id,
          name: store.name,
          email: store.email,
          address: store.address,
          averageRating: Number(store.averageRating),
          totalRatings: Number(store.totalRatings)
        });
      }
      for (const owner of owners) owner.stores = storesByOwner.get(owner.id) ?? [];
    }

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
    const { name, email, password, address, role = 'USER' } = req.body ?? {};

    if (typeof name !== 'string' || name.trim().length < 20 || name.trim().length > 60) {
      return res.status(400).json({ success: false, message: 'Name must be between 20 and 60 characters.' });
    }
    if (typeof email !== 'string' || !validateEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (typeof password !== 'string' || !validatePassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be 8-16 characters long and contain at least one uppercase letter and one special character.' });
    }
    if (address !== undefined && (typeof address !== 'string' || address.length > 400)) {
      return res.status(400).json({ success: false, message: 'Address must not exceed 400 characters.' });
    }
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be USER or ADMIN.' });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email is already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = role;
    const includeMustChangePassword = (await pool.query("SHOW COLUMNS FROM users LIKE 'must_change_password'"))[0].length > 0;

    const insertSql = includeMustChangePassword
      ? 'INSERT INTO users (name, email, password_hash, address, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?)'
      : 'INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?)';
    const insertValues = includeMustChangePassword
      ? [normalizedName, normalizedEmail, passwordHash, address?.trim() || null, assignedRole, false]
      : [normalizedName, normalizedEmail, passwordHash, address?.trim() || null, assignedRole];

    const [result] = await pool.query(insertSql, insertValues);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: { id: result.insertId, name: normalizedName, email: normalizedEmail, address: address?.trim() || null, role: assignedRole }
    });
  } catch (err) {
    next(err);
  }
};

export const createStoreOwner = async (req, res, next) => {
  try {
    const { name, email, password, address } = req.body ?? {};

    if (typeof name !== 'string' || name.trim().length < 20 || name.trim().length > 60) {
      return res.status(400).json({ success: false, message: 'Name must be between 20 and 60 characters.' });
    }
    if (typeof email !== 'string' || !validateEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (password !== undefined && password !== '' && (typeof password !== 'string' || !validatePassword(password))) {
      return res.status(400).json({ success: false, message: 'Password must be 8-16 characters long and contain at least one uppercase letter and one special character.' });
    }
    if (address !== undefined && (typeof address !== 'string' || address.length > 400)) {
      return res.status(400).json({ success: false, message: 'Address must not exceed 400 characters.' });
    }

    const normalizedName = name.trim();
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
      ? [normalizedName, normalizedEmail, passwordHash, address?.trim() || null, assignedRole, true]
      : [normalizedName, normalizedEmail, passwordHash, address?.trim() || null, assignedRole];

    const [result] = await pool.query(insertSql, insertValues);

    res.status(201).json({
      success: true,
      message: 'Store Owner created successfully',
      user: { id: result.insertId, name: normalizedName, email: normalizedEmail, address: address?.trim() || null, role: assignedRole },
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

    const allowedSort = ['name', 'email', 'address', 'created_at'];
    const sField = allowedSort.includes(sort) ? sort : 'created_at';
    const sOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const pPage = Math.max(1, parseInt(page) || 1);
    const pLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pPage - 1) * pLimit;

    const [owners] = await pool.query(
      `SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE ${whereClause} ORDER BY ${sField} ${sOrder}, id ${sOrder} LIMIT ? OFFSET ?`,
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

    if (name) { whereClause += ' AND LOWER(s.name) LIKE LOWER(?)'; params.push(`%${name}%`); }
    if (email) { whereClause += ' AND LOWER(s.email) LIKE LOWER(?)'; params.push(`%${email}%`); }
    if (address) { whereClause += ' AND LOWER(s.address) LIKE LOWER(?)'; params.push(`%${address}%`); }
    if (owner) { whereClause += ' AND s.owner_id = ?'; params.push(owner); }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM stores s WHERE ${whereClause}`, params);

    const allowedSort = ['name', 'email', 'address', 'rating', 'created_at'];
    const sField = sort === 'rating'
      ? 'averageRating'
      : allowedSort.includes(sort)
        ? `s.${sort}`
        : 's.created_at';
    const sOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const pPage = Math.max(1, parseInt(page) || 1);
    const pLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pPage - 1) * pLimit;

    const query = `
      SELECT s.id, s.name, s.email, s.address, s.owner_id, s.created_at, s.updated_at,
             u.name as owner_name, u.email as owner_email,
             COALESCE(ROUND(AVG(r.rating), 2), 0) AS averageRating,
             COUNT(r.id) AS totalRatings
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON r.store_id = s.id
      WHERE ${whereClause}
      GROUP BY s.id
      ORDER BY ${sField} ${sOrder}, s.id ${sOrder}
      LIMIT ? OFFSET ?
    `;

    const [stores] = await pool.query(query, [...params, pLimit, offset]);
    for (const store of stores) {
      store.averageRating = Number(store.averageRating);
      store.totalRatings = Number(store.totalRatings);
    }

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
    const { name, email, address, ownerId } = req.body ?? {};

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof address !== 'string' || !address.trim() ||
      !Number.isInteger(Number(ownerId)) || Number(ownerId) <= 0
    ) {
      return res.status(400).json({ success: false, message: 'Name, email, address, and ownerId are required.' });
    }

    if (!validateEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    if (address.trim().length > 400) {
      return res.status(400).json({ success: false, message: 'Address must not exceed 400 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const [owners] = await pool.query('SELECT role FROM users WHERE id = ?', [Number(ownerId)]);
    if (owners.length === 0) {
      return res.status(400).json({ success: false, message: 'Owner user not found.' });
    }
    if (owners[0].role !== 'STORE_OWNER') {
      return res.status(400).json({ success: false, message: 'Assigned user must have the STORE_OWNER role.' });
    }

    const [result] = await pool.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
      [name.trim(), normalizedEmail, address.trim(), Number(ownerId)]
    );

    // Phase 17: notify the store owner that a store has been assigned to them.
    await createNotification({
      userId: Number(ownerId),
      type: NOTIFICATION_TYPES.STORE_ASSIGNMENT,
      title: 'Store assigned',
      message: `You have been assigned ${name.trim()}.`,
      entityType: ENTITY_TYPES.STORE,
      entityId: result.insertId
    });

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      store: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
        address: address.trim(),
        owner_id: Number(ownerId)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Phase 17 — Platform-wide analytics (ADMIN only, enforced by route middleware).
 *
 * All figures are descriptive aggregates computed in SQL. No business
 * conclusions (e.g. "best store") are invented.
 */
export const getPlatformAnalytics = async (req, res, next) => {
  try {
    const { key: rangeKey, fromDate, dateFormat } = resolveRange(req.query.range);
    const rangeParams = fromDate ? [fromDate] : [];
    const ratingsDateFilter = fromDate ? 'WHERE created_at >= ?' : '';

    const [[usersSummary]] = await pool.query(`
      SELECT
        COUNT(*) AS totalUsers,
        COALESCE(SUM(role = 'ADMIN'), 0) AS totalAdmins,
        COALESCE(SUM(role = 'USER'), 0) AS totalCustomers,
        COALESCE(SUM(role = 'STORE_OWNER'), 0) AS totalStoreOwners
      FROM users
    `);

    const [[storeCount]] = await pool.query('SELECT COUNT(*) AS totalStores FROM stores');
    const [[productCount]] = await pool.query('SELECT COUNT(*) AS totalProducts FROM products');

    const [[ratingSummary]] = await pool.query(`
      SELECT
        COUNT(*) AS totalRatings,
        COALESCE(SUM(CASE WHEN review IS NOT NULL AND TRIM(review) <> '' THEN 1 ELSE 0 END), 0) AS totalReviews,
        COALESCE(ROUND(AVG(rating), 2), 0) AS averagePlatformRating,
        COALESCE(SUM(rating = 1), 0) AS count1,
        COALESCE(SUM(rating = 2), 0) AS count2,
        COALESCE(SUM(rating = 3), 0) AS count3,
        COALESCE(SUM(rating = 4), 0) AS count4,
        COALESCE(SUM(rating = 5), 0) AS count5
      FROM ratings
    `);

    const [[newUsers]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users ${fromDate ? 'WHERE created_at >= ?' : ''}`,
      rangeParams
    );
    const [[newStores]] = await pool.query(
      `SELECT COUNT(*) AS total FROM stores ${fromDate ? 'WHERE created_at >= ?' : ''}`,
      rangeParams
    );
    const [[rangeRatingStats]] = await pool.query(`
      SELECT
        COUNT(*) AS newRatings,
        COALESCE(SUM(CASE WHEN review IS NOT NULL AND TRIM(review) <> '' THEN 1 ELSE 0 END), 0) AS newReviews
      FROM ratings ${ratingsDateFilter}
    `, rangeParams);

    const [activityRows] = await pool.query(`
      SELECT
        DATE_FORMAT(created_at, ?) AS period,
        COUNT(*) AS ratings,
        COALESCE(SUM(CASE WHEN review IS NOT NULL AND TRIM(review) <> '' THEN 1 ELSE 0 END), 0) AS reviews
      FROM ratings ${ratingsDateFilter}
      GROUP BY period
      ORDER BY period ASC
    `, [dateFormat, ...rangeParams]);

    const [topStoreRows] = await pool.query(`
      SELECT
        s.id, s.name, s.city, s.state, s.category,
        COUNT(r.id) AS ratingCount,
        COALESCE(SUM(CASE WHEN r.review IS NOT NULL AND TRIM(r.review) <> '' THEN 1 ELSE 0 END), 0) AS reviewCount,
        COALESCE(ROUND(AVG(r.rating), 2), 0) AS averageRating
      FROM stores s
      LEFT JOIN ratings r ON r.store_id = s.id
      GROUP BY s.id
      ORDER BY reviewCount DESC, ratingCount DESC
      LIMIT 5
    `);

    const [storesByCategory] = await pool.query(`
      SELECT COALESCE(NULLIF(category, ''), 'General Retail') AS category, COUNT(*) AS stores
      FROM stores
      GROUP BY category
      ORDER BY stores DESC, category ASC
    `);

    const [productsByCategory] = await pool.query(`
      SELECT category, COUNT(*) AS products
      FROM products
      WHERE category IS NOT NULL AND category <> ''
      GROUP BY category
      ORDER BY products DESC, category ASC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        range: rangeKey,
        summary: {
          totalUsers: Number(usersSummary.totalUsers ?? 0),
          totalAdmins: Number(usersSummary.totalAdmins ?? 0),
          totalCustomers: Number(usersSummary.totalCustomers ?? 0),
          totalStoreOwners: Number(usersSummary.totalStoreOwners ?? 0),
          totalStores: Number(storeCount.totalStores ?? 0),
          totalProducts: Number(productCount.totalProducts ?? 0),
          totalRatings: Number(ratingSummary.totalRatings ?? 0),
          totalReviews: Number(ratingSummary.totalReviews ?? 0),
          averagePlatformRating: Number(ratingSummary.averagePlatformRating ?? 0)
        },
        rangeActivity: {
          newUsers: Number(newUsers.total ?? 0),
          newStores: Number(newStores.total ?? 0),
          newRatings: Number(rangeRatingStats.newRatings ?? 0),
          newReviews: Number(rangeRatingStats.newReviews ?? 0)
        },
        distribution: {
          '1': Number(ratingSummary.count1 ?? 0),
          '2': Number(ratingSummary.count2 ?? 0),
          '3': Number(ratingSummary.count3 ?? 0),
          '4': Number(ratingSummary.count4 ?? 0),
          '5': Number(ratingSummary.count5 ?? 0)
        },
        activityOverTime: activityRows.map((row) => ({
          period: row.period,
          ratings: Number(row.ratings ?? 0),
          reviews: Number(row.reviews ?? 0)
        })),
        mostReviewedStores: topStoreRows.map((row) => ({
          id: row.id,
          name: row.name,
          city: row.city,
          state: row.state,
          category: row.category,
          ratingCount: Number(row.ratingCount ?? 0),
          reviewCount: Number(row.reviewCount ?? 0),
          averageRating: Number(row.averageRating ?? 0)
        })),
        storesByCategory: storesByCategory.map((row) => ({
          category: row.category,
          stores: Number(row.stores ?? 0)
        })),
        productsByCategory: productsByCategory.map((row) => ({
          category: row.category,
          products: Number(row.products ?? 0)
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};
