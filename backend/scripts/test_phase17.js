import app from '../src/app.js';
import pool from '../src/config/db.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

/**
 * Phase 17 verification suite.
 *
 * Exercises the real Railway MySQL data through the real Express app for:
 * notifications (ownership + mark read), store-owner analytics (ownership
 * enforcement), admin analytics (ADMIN-only), and the NEW_REVIEW integration.
 */

let passed = 0;
let failed = 0;

const assert = (condition, title) => {
  if (condition) {
    console.log(`[PASS] ${title}`);
    passed++;
  } else {
    console.error(`[FAIL] ${title}`);
    failed++;
  }
};

const makeRequest = async (path, options = {}) => {
  const server = app.listen(0);
  const port = server.address().port;
  const url = `http://localhost:${port}${path}`;

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    server.close();
    return { status: response.status, data };
  } catch (err) {
    server.close();
    throw err;
  }
};

const run = async () => {
  console.log('==================================================');
  console.log('PHASE 17 — NOTIFICATIONS, ANALYTICS & INTEGRATION');
  console.log('==================================================\n');

  // --- Resolve real actors from the database ---
  const [adminRows] = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1");
  const [storeRows] = await pool.query(`
    SELECT s.id, s.owner_id, s.name, u.name AS owner_name
    FROM stores s JOIN users u ON u.id = s.owner_id
    ORDER BY s.id ASC
  `);

  const ownerA = storeRows[0];
  const ownerB = storeRows.find((row) => row.owner_id !== ownerA.owner_id);
  const otherStoreForA = storeRows.find((row) => row.owner_id !== ownerA.owner_id);

  const adminToken = jwt.sign({ id: adminRows[0].id, role: 'ADMIN' }, env.jwt.secret, { expiresIn: '1h' });
  const ownerAToken = jwt.sign({ id: ownerA.owner_id, role: 'STORE_OWNER' }, env.jwt.secret, { expiresIn: '1h' });
  const ownerBToken = jwt.sign({ id: ownerB.owner_id, role: 'STORE_OWNER' }, env.jwt.secret, { expiresIn: '1h' });

  console.log(`Actors -> admin:${adminRows[0].id} ownerA:${ownerA.owner_id} (store ${ownerA.id}) ownerB:${ownerB.owner_id} (store ${ownerB.id})\n`);

  console.log('--- 1. ADMIN ANALYTICS & AUTHORIZATION ---');
  const adminAnalytics = await makeRequest('/api/admin/analytics?range=30d', { token: adminToken });
  assert(adminAnalytics.status === 200 && adminAnalytics.data?.data?.summary, 'Admin analytics returns 200 with summary');
  assert(
    adminAnalytics.data?.data?.summary?.totalRatings >= 0 &&
    adminAnalytics.data?.data?.distribution &&
    '5' in adminAnalytics.data.data.distribution,
    'Admin analytics includes distribution 1..5'
  );
  assert(
    Array.isArray(adminAnalytics.data?.data?.mostReviewedStores) &&
    Array.isArray(adminAnalytics.data?.data?.storesByCategory),
    'Admin analytics includes store insights and category distribution'
  );

  const ownerCallingAdmin = await makeRequest('/api/admin/analytics', { token: ownerAToken });
  assert(ownerCallingAdmin.status === 403, 'Store owner blocked from admin analytics (403)');

  const unauthAdmin = await makeRequest('/api/admin/analytics');
  assert(unauthAdmin.status === 401, 'Unauthenticated admin analytics rejected (401)');

  console.log('\n--- 2. STORE OWNER ANALYTICS & ISOLATION ---');
  const ownerAnalytics = await makeRequest(`/api/store-owner/analytics?range=30d&storeId=${ownerA.id}`, { token: ownerAToken });
  assert(ownerAnalytics.status === 200 && ownerAnalytics.data?.data?.summary, 'Owner analytics returns 200 for own store');
  assert(
    Array.isArray(ownerAnalytics.data?.data?.reviewActivity) &&
    Array.isArray(ownerAnalytics.data?.data?.ratingTrend) &&
    Array.isArray(ownerAnalytics.data?.data?.categoryDistribution),
    'Owner analytics includes activity, trend and category series'
  );

  const ownerAnalyticsAllTime = await makeRequest(`/api/store-owner/analytics?range=all&storeId=${ownerA.id}`, { token: ownerAToken });
  assert(ownerAnalyticsAllTime.status === 200 && ownerAnalyticsAllTime.data?.data?.range === 'all', 'Owner analytics supports All Time range');

  const ownerCrossStore = await makeRequest(`/api/store-owner/analytics?storeId=${otherStoreForA.id}`, { token: ownerAToken });
  assert(ownerCrossStore.status === 403, "Store owner blocked from another owner's store analytics (403)");

  console.log('\n--- 3. NOTIFICATIONS API ---');
  const unauthNotifications = await makeRequest('/api/notifications');
  assert(unauthNotifications.status === 401, 'Unauthenticated notifications rejected (401)');

  const ownerNotifications = await makeRequest('/api/notifications', { token: ownerAToken });
  assert(ownerNotifications.status === 200 && Array.isArray(ownerNotifications.data?.data), 'Owner can list own notifications');
  assert(typeof ownerNotifications.data?.unreadCount === 'number', 'Notifications response includes unreadCount');

  const unreadCount = await makeRequest('/api/notifications/unread-count', { token: ownerAToken });
  assert(unreadCount.status === 200 && typeof unreadCount.data?.unreadCount === 'number', 'Unread count endpoint works');

  // Ownership isolation at the notification level.
  const [seed] = await pool.query(
    "INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id) VALUES (?, 'STORE_ASSIGNMENT', 'Store assigned', 'You have been assigned a test store.', 'STORE', ?)",
    [ownerA.owner_id, ownerA.id]
  );
  const seededId = seed.insertId;

  const crossRead = await makeRequest(`/api/notifications/${seededId}/read`, { method: 'PATCH', token: ownerBToken });
  assert(crossRead.status === 404, "A user cannot mark another user's notification as read (404)");

  const ownRead = await makeRequest(`/api/notifications/${seededId}/read`, { method: 'PATCH', token: ownerAToken });
  assert(ownRead.status === 200, 'Owner can mark own notification as read');

  const markAll = await makeRequest('/api/notifications/read-all', { method: 'PATCH', token: ownerAToken });
  assert(markAll.status === 200, 'Owner can mark all notifications as read');

  const unreadAfter = await makeRequest('/api/notifications/unread-count', { token: ownerAToken });
  assert(unreadAfter.data?.unreadCount === 0, 'Unread count is 0 after read-all');

  console.log('\n--- 4. CUSTOMER -> OWNER NEW_REVIEW INTEGRATION ---');
  // Find a customer + store pairing that does not yet exist, targeting owner A's store.
  const [candidateUsers] = await pool.query(`
    SELECT u.id FROM users u
    WHERE u.role = 'USER'
      AND NOT EXISTS (SELECT 1 FROM ratings r WHERE r.user_id = u.id AND r.store_id = ?)
    ORDER BY u.id ASC LIMIT 1
  `, [ownerA.id]);

  if (candidateUsers.length === 0) {
    console.log('[SKIP] Every customer already rated owner A store; integration path not exercised.');
  } else {
    const customerId = candidateUsers[0].id;
    const customerToken = jwt.sign({ id: customerId, role: 'USER' }, env.jwt.secret, { expiresIn: '1h' });

    const beforeNotif = await pool.query(
      "SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND type = 'NEW_REVIEW' AND entity_id = ?",
      [ownerA.owner_id, ownerA.id]
    );
    const beforeCount = beforeNotif[0][0].total;

    const submit = await makeRequest(`/api/user/stores/${ownerA.id}/ratings`, {
      method: 'POST',
      token: customerToken,
      body: { rating: 5, review: 'Prompt, helpful staff and a well-organised display. Recommended.' }
    });
    assert(submit.status === 201, 'Customer submits a review against a real store (201)');

    const afterNotif = await pool.query(
      "SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND type = 'NEW_REVIEW' AND entity_id = ?",
      [ownerA.owner_id, ownerA.id]
    );
    const afterCount = afterNotif[0][0].total;
    assert(afterCount === beforeCount + 1, 'Exactly one NEW_REVIEW notification created for the store owner');

    const [latest] = await pool.query(
      "SELECT title, message FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [ownerA.owner_id]
    );
    assert(
      latest[0]?.title === 'New review received' && /5-star/.test(latest[0]?.message ?? ''),
      `Notification message is descriptive: "${latest[0]?.message}"`
    );

    // Customer must not be able to read the owner's notifications.
    const customerReadsOwner = await makeRequest('/api/notifications?limit=50', { token: customerToken });
    const customerIds = (customerReadsOwner.data?.data ?? []).map((row) => row.id);
    assert(
      customerReadsOwner.status === 200 && !customerIds.includes(seededId),
      "Customer notifications never expose the owner's notifications"
    );
  }

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
};

run().catch(async (error) => {
  console.error('Test run failed:', error);
  try { await pool.end(); } catch (e) { /* ignore */ }
  process.exit(1);
});
