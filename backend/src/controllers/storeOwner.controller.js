import pool from '../config/db.js';
import { validateEmail } from '../utils/validation.js';

const normalizeStore = (store) => ({
  id: store.id,
  name: store.name,
  email: store.email,
  address: store.address,
  category: store.category || 'General Retail',
  description: store.description || '',
  city: store.city || '',
  state: store.state || '',
  pin_code: store.pin_code || '',
  contact_phone: store.contact_phone || '',
  owner_id: store.owner_id,
  created_at: store.created_at,
  updated_at: store.updated_at
});

const getMyStores = async (ownerId) => {
  const [stores] = await pool.query(
    `SELECT id, name, email, address, category, description, city, state, pin_code, contact_phone, owner_id, created_at, updated_at
     FROM stores WHERE owner_id = ? ORDER BY created_at ASC`,
    [ownerId]
  );
  return stores.map(normalizeStore);
};

const getMyStore = async (ownerId, storeId = null) => {
  if (storeId) {
    const [stores] = await pool.query(
      `SELECT id, name, email, address, category, description, city, state, pin_code, contact_phone, owner_id, created_at, updated_at
       FROM stores WHERE id = ? AND owner_id = ?`,
      [storeId, ownerId]
    );
    return stores.length > 0 ? normalizeStore(stores[0]) : null;
  }

  const stores = await getMyStores(ownerId);
  return stores.length > 0 ? stores[0] : null;
};

const resolveAuthorizedStore = async (req, storeId, allowDefault = true) => {
  const requestedStoreId = storeId !== undefined && storeId !== null ? Number(storeId) : null;

  if (requestedStoreId !== null && Number.isNaN(requestedStoreId)) {
    return { store: null, error: { status: 400, message: 'Invalid store id provided.' } };
  }

  const store = requestedStoreId !== null
    ? await getMyStore(req.user.id, requestedStoreId)
    : allowDefault
      ? await getMyStore(req.user.id)
      : null;

  if (!store) {
    if (requestedStoreId !== null) {
      return { store: null, error: { status: 403, message: 'Forbidden: This store is not assigned to your account.' } };
    }
    return { store: null, error: { status: 404, message: 'No store assigned to this owner.' } };
  }

  return { store, error: null };
};

const resolveAuthorizedProduct = async (req, storeId, productId) => {
  const { store, error } = await resolveAuthorizedStore(req, storeId, true);
  if (error) return { store: null, product: null, error };

  const productIdNum = Number(productId);
  if (Number.isNaN(productIdNum)) {
    return { store: null, product: null, error: { status: 400, message: 'Invalid product id provided.' } };
  }

  const [products] = await pool.query(
    'SELECT * FROM products WHERE id = ? AND store_id = ?',
    [productIdNum, store.id]
  );

  if (!products[0]) {
    return { store, product: null, error: { status: 404, message: 'Product not found for this store.' } };
  }

  return { store, product: products[0], error: null };
};

export const getMyStoreInfo = async (req, res, next) => {
  try {
    const { store, error } = await resolveAuthorizedStore(req, req.query.storeId, true);
    if (error) return res.status(error.status).json({ success: false, message: error.message });
    res.json({ success: true, data: store });
  } catch (err) {
    next(err);
  }
};

export const getMyStoreList = async (req, res, next) => {
  try {
    const stores = await getMyStores(req.user.id);
    res.json({ success: true, data: stores });
  } catch (err) {
    next(err);
  }
};

export const updateMyStore = async (req, res, next) => {
  try {
    const { name, email, address, category, description, city, state, pin_code, contact_phone } = req.body;
    const { store, error } = await resolveAuthorizedStore(req, req.query.storeId, true);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (email) {
      if (!validateEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email format.' });
      updates.push('email = ?'); params.push(email);
    }
    if (address) { updates.push('address = ?'); params.push(address); }
    if (category) { updates.push('category = ?'); params.push(category); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description || ''); }
    if (city !== undefined) { updates.push('city = ?'); params.push(city || ''); }
    if (state !== undefined) { updates.push('state = ?'); params.push(state || ''); }
    if (pin_code !== undefined) { updates.push('pin_code = ?'); params.push(pin_code || ''); }
    if (contact_phone !== undefined) { updates.push('contact_phone = ?'); params.push(contact_phone || ''); }

    if (updates.length === 0) return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });

    params.push(store.id, req.user.id);
    await pool.query(`UPDATE stores SET ${updates.join(', ')} WHERE id = ? AND owner_id = ?`, params);

    const updatedStore = await getMyStore(req.user.id, store.id);
    res.json({ success: true, message: 'Store updated successfully', data: updatedStore });
  } catch (err) {
    next(err);
  }
};

export const getStoreProducts = async (req, res, next) => {
  try {
    const storeId = req.params.storeId ?? req.query.storeId;
    const { store, error } = await resolveAuthorizedStore(req, storeId, true);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const [products] = await pool.query(
      `SELECT id, store_id, name, category, description, price, image_url, status, created_at, updated_at
       FROM products WHERE store_id = ? ORDER BY category ASC, name ASC`,
      [store.id]
    );

    res.json({
      success: true,
      data: products,
      summary: {
        totalProducts: products.length,
        categories: [...new Set(products.map((product) => product.category).filter(Boolean))]
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createStoreProduct = async (req, res, next) => {
  try {
    const storeId = req.params.storeId ?? req.query.storeId;
    const { name, category, description, price, image_url, status } = req.body;
    const { store, error } = await resolveAuthorizedStore(req, storeId, true);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }
    if (!category || String(category).trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Product category is required.' });
    }

    const normalizedName = String(name).trim();
    const normalizedCategory = String(category).trim();
    const normalizedDescription = description ? String(description).trim() : '';
    const normalizedStatus = ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED'].includes(status) ? status : 'IN_STOCK';
    const normalizedPrice = price !== undefined && price !== null && price !== '' ? Number(price) : null;

    if (normalizedPrice !== null && Number.isNaN(normalizedPrice)) {
      return res.status(400).json({ success: false, message: 'Product price must be numeric.' });
    }

    const [result] = await pool.query(
      `INSERT INTO products (store_id, name, category, description, price, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [store.id, normalizedName, normalizedCategory, normalizedDescription, normalizedPrice, image_url || null, normalizedStatus]
    );

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Product added successfully.', data: products[0] });
  } catch (err) {
    next(err);
  }
};

export const updateStoreProduct = async (req, res, next) => {
  try {
    const { store, product, error } = await resolveAuthorizedProduct(req, req.params.storeId, req.params.productId);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const { name, category, description, price, image_url, status } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) {
      if (!name || String(name).trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Product name is required.' });
      }
      updates.push('name = ?'); params.push(String(name).trim());
    }
    if (category !== undefined) {
      if (!category || String(category).trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Product category is required.' });
      }
      updates.push('category = ?'); params.push(String(category).trim());
    }
    if (description !== undefined) { updates.push('description = ?'); params.push(description ? String(description).trim() : ''); }
    if (price !== undefined) {
      const nextPrice = price === null || price === '' ? null : Number(price);
      if (nextPrice !== null && Number.isNaN(nextPrice)) {
        return res.status(400).json({ success: false, message: 'Product price must be numeric.' });
      }
      updates.push('price = ?'); params.push(nextPrice);
    }
    if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url || null); }
    if (status !== undefined) {
      if (!['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid product status.' });
      }
      updates.push('status = ?'); params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid product fields were provided for update.' });
    }

    params.push(product.id);
    await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updatedProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [product.id]);
    res.json({ success: true, message: 'Product updated successfully.', data: updatedProduct[0] });
  } catch (err) {
    next(err);
  }
};

export const deleteStoreProduct = async (req, res, next) => {
  try {
    const { store, product, error } = await resolveAuthorizedProduct(req, req.params.storeId, req.params.productId);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    await pool.query('DELETE FROM products WHERE id = ?', [product.id]);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const { store, error } = await resolveAuthorizedStore(req, req.query.storeId, true);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const [statsResult] = await pool.query(`
      SELECT 
        COUNT(r.id) as totalRatings,
        COALESCE(ROUND(AVG(r.rating), 2), 0) as averageRating,
        COALESCE(SUM(CASE WHEN r.review IS NOT NULL AND TRIM(r.review) <> '' THEN 1 ELSE 0 END), 0) as totalReviews,
        COALESCE(SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END), 0) as count1,
        COALESCE(SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END), 0) as count2,
        COALESCE(SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END), 0) as count3,
        COALESCE(SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END), 0) as count4,
        COALESCE(SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END), 0) as count5
      FROM ratings r
      WHERE r.store_id = ?
    `, [store.id]);

    const [productResult] = await pool.query(
      `SELECT COUNT(*) as totalProducts, COUNT(DISTINCT category) as totalCategories
       FROM products WHERE store_id = ?`,
      [store.id]
    );

    const stats = statsResult[0] ?? {};
    const productStats = productResult[0] ?? {};

    res.json({
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          email: store.email,
          address: store.address,
          category: store.category,
          description: store.description,
          city: store.city,
          state: store.state,
          pin_code: store.pin_code
        },
        totalRatings: Number(stats.totalRatings ?? 0),
        totalReviews: Number(stats.totalReviews ?? 0),
        averageRating: Number(stats.averageRating ?? 0),
        totalProducts: Number(productStats.totalProducts ?? 0),
        totalCategories: Number(productStats.totalCategories ?? 0),
        distribution: {
          '1': Number(stats.count1 ?? 0),
          '2': Number(stats.count2 ?? 0),
          '3': Number(stats.count3 ?? 0),
          '4': Number(stats.count4 ?? 0),
          '5': Number(stats.count5 ?? 0)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyRatings = async (req, res, next) => {
  try {
    const { store, error } = await resolveAuthorizedStore(req, req.query.storeId, true);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const { rating, sort, order, page = 1, limit = 10 } = req.query;

    let whereClause = 'r.store_id = ?';
    const params = [store.id];

    if (rating) {
      whereClause += ' AND r.rating = ?';
      params.push(rating);
    }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM ratings r WHERE ${whereClause}`, params);

    const allowedSort = ['rating', 'created_at'];
    const sField = allowedSort.includes(sort) ? `r.${sort}` : 'r.created_at';
    const sOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const pPage = Math.max(1, parseInt(page) || 1);
    const pLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset = (pPage - 1) * pLimit;

    const [ratings] = await pool.query(`
      SELECT r.id, r.rating, r.review, r.created_at, r.updated_at,
             u.id as user_id, u.name as user_name
      FROM ratings r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${sField} ${sOrder}
      LIMIT ? OFFSET ?
    `, [...params, pLimit, offset]);

    if (ratings.length > 0) {
      const ratingIds = ratings.map((entry) => entry.id);
      const [mediaRows] = await pool.query(
        'SELECT rating_id, id, media_url, media_type, created_at FROM rating_media WHERE rating_id IN (?)',
        [ratingIds]
      );

      const mediaByRating = new Map();
      for (const row of mediaRows) {
        if (!mediaByRating.has(row.rating_id)) mediaByRating.set(row.rating_id, []);
        mediaByRating.get(row.rating_id).push({
          id: row.id,
          media_url: row.media_url,
          media_type: row.media_type,
          created_at: row.created_at
        });
      }

      for (const rating of ratings) {
        rating.media = mediaByRating.get(rating.id) ?? [];
      }
    }

    res.json({
      success: true,
      data: ratings,
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
