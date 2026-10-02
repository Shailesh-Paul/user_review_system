import pool from '../config/db.js';

/**
 * Phase 17 — Notification helpers.
 *
 * Notifications are always scoped to a single user. Callers must never trust a
 * user id supplied by the client: the recipient is derived from ownership of the
 * related entity (e.g. the store's owner_id) or from an authenticated request.
 */

export const NOTIFICATION_TYPES = {
  NEW_REVIEW: 'NEW_REVIEW',
  NEW_RATING: 'NEW_RATING',
  STORE_ASSIGNMENT: 'STORE_ASSIGNMENT'
};

export const ENTITY_TYPES = {
  STORE: 'STORE',
  RATING: 'RATING'
};

const sanitize = (value, maxLength) => {
  if (value === undefined || value === null) return null;
  return String(value).replace(/\s+/g, ' ').trim().substring(0, maxLength);
};

/**
 * Insert a notification. Accepts an optional transaction connection so callers
 * can keep notification writes atomic with the triggering change.
 */
export const createNotification = async (
  { userId, type, title, message, entityType = null, entityId = null },
  db = pool
) => {
  if (!userId) return null;

  const safeTitle = sanitize(title, 150);
  const safeMessage = sanitize(message, 500);
  const safeType = sanitize(type, 40);

  if (!safeType || !safeTitle || !safeMessage) {
    return null;
  }

  try {
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, safeType, safeTitle, safeMessage, entityType, entityId]
    );
  } catch (error) {
    // Notifications are non-critical: never let them break the primary action.
    console.error('Failed to create notification:', error.message);
  }

  return null;
};

/**
 * Notify the owner of a store. Ownership is resolved from the database so a
 * caller can never direct a notification to an arbitrary user id.
 */
export const notifyStoreOwner = async (
  { storeId, type, title, message, entityType = ENTITY_TYPES.STORE, entityId = null },
  db = pool
) => {
  if (!storeId) return null;

  const [stores] = await db.query('SELECT id, name, owner_id FROM stores WHERE id = ?', [storeId]);
  if (stores.length === 0 || !stores[0].owner_id) return null;

  const store = stores[0];

  await createNotification(
    {
      userId: store.owner_id,
      type,
      title,
      message,
      entityType,
      entityId: entityId ?? store.id
    },
    db
  );

  return store.owner_id;
};

/**
 * Notify a store owner about new customer feedback (a rating and/or review).
 *
 * The ratings table stores a rating and an optional review together. To avoid
 * emitting duplicate notifications for a single submission, the event type is
 * chosen once: NEW_REVIEW when the customer included review text, otherwise
 * NEW_RATING.
 */
export const notifyStoreOwnerAboutFeedback = async (
  { storeId, rating, hasReview, ratingId = null },
  db = pool
) => {
  if (!storeId || !rating) return null;

  const [stores] = await db.query('SELECT id, name, owner_id FROM stores WHERE id = ?', [storeId]);
  if (stores.length === 0 || !stores[0].owner_id) return null;

  const store = stores[0];
  const type = hasReview ? NOTIFICATION_TYPES.NEW_REVIEW : NOTIFICATION_TYPES.NEW_RATING;
  const title = hasReview ? 'New review received' : 'New rating received';
  const message = hasReview
    ? `A customer left a ${rating}-star review for ${store.name}.`
    : `A customer left a ${rating}-star rating for ${store.name}.`;

  await createNotification(
    {
      userId: store.owner_id,
      type,
      title,
      message,
      entityType: ENTITY_TYPES.STORE,
      entityId: store.id
    },
    db
  );

  return store.owner_id;
};

