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

async function getPrivateConversations(userId) {
  const query = `
    WITH private_messages AS (
      SELECT
        id,
        user_id,
        to_user_id,
        text,
        created_at,
        CASE
          WHEN user_id = $1 THEN to_user_id
          ELSE user_id
        END AS other_user_id
      FROM chat.messages
      WHERE COALESCE(type, 'global') = 'private'
        AND (user_id = $1 OR to_user_id = $1)
    ),
    latest_conversations AS (
      SELECT DISTINCT ON (other_user_id)
        other_user_id,
        id AS last_message_id,
        text AS last_message_text,
        created_at AS last_message_at
      FROM private_messages
      ORDER BY other_user_id, created_at DESC, id DESC
    )
    SELECT
      latest_conversations.other_user_id AS "userId",
      (
        SELECT message.user_name_snapshot
        FROM chat.messages AS message
        WHERE COALESCE(message.type, 'global') = 'private'
          AND message.user_id = latest_conversations.other_user_id
          AND (
            (message.user_id = $1 AND message.to_user_id = latest_conversations.other_user_id)
            OR
            (message.user_id = latest_conversations.other_user_id AND message.to_user_id = $1)
          )
          AND message.user_name_snapshot IS NOT NULL
        ORDER BY message.created_at DESC, message.id DESC
        LIMIT 1
      ) AS username,
      latest_conversations.last_message_id AS "lastMessageId",
      latest_conversations.last_message_text AS "lastMessageText",
      latest_conversations.last_message_at AS "lastMessageAt"
    FROM latest_conversations
    ORDER BY "lastMessageAt" DESC, "lastMessageId" DESC
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows;
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
  getPrivateConversations,
  getRecentMessages,
  getRecentPrivateMessages,
  MAX_HISTORY_MESSAGES,
  MESSAGE_TYPES,
  resolveUserId,
  resolveUserNameSnapshot
};
