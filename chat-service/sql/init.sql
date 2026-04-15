CREATE SCHEMA IF NOT EXISTS chat;

CREATE TABLE IF NOT EXISTS chat.messages (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    to_user_id TEXT,
    type TEXT NOT NULL DEFAULT 'global',
    text TEXT NOT NULL,
    user_name_snapshot TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE chat.messages
    ADD COLUMN IF NOT EXISTS to_user_id TEXT;

ALTER TABLE chat.messages
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'global';

UPDATE chat.messages
SET type = 'global'
WHERE type IS NULL;

ALTER TABLE chat.messages
    DROP CONSTRAINT IF EXISTS chat_messages_type_check;

ALTER TABLE chat.messages
    ADD CONSTRAINT chat_messages_type_check
    CHECK (type IN ('global', 'private'));

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
    ON chat.messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_private_lookup
    ON chat.messages (user_id, to_user_id, created_at DESC);
