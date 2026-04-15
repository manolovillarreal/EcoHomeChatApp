const { pool } = require('../db');

const MAX_HISTORY_MESSAGES = 10;
const MESSAGE_TYPES = {
  GLOBAL: 'global',
  PRIVATE: 'private'
};

function resolveUserId(user) {
  const userId = user?.sub || user?.id || user?.user_id;

  if (!userId) {
    throw new Error('Token payload does not contain a user identifier');
  }

  return String(userId);
}

function resolveUserNameSnapshot(user) {
  const name = user?.name || user?.user_name || user?.username || user?.full_name;
  return name ? String(name) : null;
}

async function getRecentMessages(limit = 10) {
  const query = `
    SELECT id, user_id, to_user_id, type, text, user_name_snapshot, created_at
    FROM chat.messages
    WHERE COALESCE(type, 'global') = 'global'
    ORDER BY created_at DESC
    LIMIT $1
  `;

  const { rows } = await pool.query(query, [limit]);
  return rows.reverse();
}

async function getRecentPrivateMessages({ userId, otherUserId, limit = 10 }) {
  const query = `
    SELECT id, user_id, to_user_id, type, text, user_name_snapshot, created_at
    FROM chat.messages
    WHERE COALESCE(type, 'global') = 'private'
      AND (
        (user_id = $1 AND to_user_id = $2)
        OR
        (user_id = $2 AND to_user_id = $1)
      )
    ORDER BY created_at DESC
    LIMIT $3
  `;

  const { rows } = await pool.query(query, [userId, otherUserId, limit]);
  return rows.reverse();
}

async function createMessage({
  userId,
  text,
  userNameSnapshot,
  toUserId = null,
  type = MESSAGE_TYPES.GLOBAL
}) {
  const query = `
    INSERT INTO chat.messages (user_id, to_user_id, type, text, user_name_snapshot)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id, to_user_id, type, text, user_name_snapshot, created_at
  `;

  const values = [userId, toUserId, type, text, userNameSnapshot];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

module.exports = {
  createMessage,
  getRecentMessages,
  getRecentPrivateMessages,
  MAX_HISTORY_MESSAGES,
  MESSAGE_TYPES,
  resolveUserId,
  resolveUserNameSnapshot
};
