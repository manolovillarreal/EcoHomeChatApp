# chat-service

Standalone chat microservice for EcoHome Store. It uses Express, Socket.IO, and PostgreSQL with logical isolation through the `chat` schema.

## Project structure

```text
chat-service/
  server.js
  package.json
  .env.example
  sql/
    init.sql
  src/
    db.js
    socket.js
    services/
      messageService.js
```

## Environment variables

Create a `.env` file from `.env.example` and configure:

- `PORT`
- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `DB_PORT`
- `DB_SSL`
- `DB_SSL_REJECT_UNAUTHORIZED`
- `JWT_SECRET`

Example:

```env
PORT=3000
DB_HOST=aws-1-us-east-1.pooler.supabase.com
DB_USER=postgres.xxxxxxxxxxxxx
DB_PASS=your_database_password
DB_NAME=postgres
DB_PORT=5432
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
JWT_SECRET=your_shared_jwt_secret
NODE_ENV=development
```

## Database bootstrap

Run the SQL in `sql/init.sql` against the shared PostgreSQL instance:

```sql
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
```

This service does not create foreign keys and does not read from other schemas.

## Run locally

```bash
npm install
npm run build:client
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The frontend lives in `public/` and is served directly by Express. Rebuild it after any frontend changes:

```bash
npm run build:client
```

## Frontend routes

- `/login`
- `/chat`

## Frontend configuration

Client runtime config is defined in `public/index.html` through `window.__ECOHOME_CONFIG__`.

- `AUTH_API_BASE`: currently set to `https://ecohomeapi.onrender.com`
- `CHAT_URL`: leave empty to connect Socket.IO to the same origin serving the page

## Socket.IO behavior

- Client must connect with `socket.handshake.auth.token`.
- JWT is validated locally with `JWT_SECRET`.
- Invalid tokens are rejected during the Socket.IO handshake.
- On connection, the service emits `message-history` with the last 10 messages.
- On connection, the service emits `users:online` with currently connected users.
- On `new-message`, the service persists the message and broadcasts it to all clients.
- On `private-message`, the service persists the message and emits it only to sender and recipient sockets.
- On `private-history`, the service returns the last 10 private messages between two users.
- The chat service only reads and writes `chat.messages`.

## Example client payload

```json
{ "text": "message" }
```

## Additional events

Connected users:

```text
users:online
```

```json
[
  { "userId": "user-1", "username": "Alice" },
  { "userId": "user-2", "username": null }
]
```

Private message emit:

```json
{
  "toUserId": "target-user-id",
  "text": "hello"
}
```

Private history request:

```json
{
  "userId": "target-user-id"
}
```
