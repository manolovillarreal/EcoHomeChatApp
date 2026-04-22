# chat-service

Microservicio de chat de EcoHome Store. Usa Express, Socket.IO y PostgreSQL con aislamiento en el esquema `chat`.

Este modulo hace parte de un **caso academico**.

## Project structure

```text
chat-service/
  server.js
  package.json
  .env.example
  public/
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
PORT=your_port_number
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=your_database_name
DB_PORT=your_database_port
DB_SSL= true
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
npm run build
npm start
```

For development with auto-reload:

```bash
npm run dev
```

`npm run build` existe para plataformas como Render, aunque este servicio no requiere compilacion real.

## Frontend servido por Express

Si `public/` contiene el build generado por `chat-app`, este servicio tambien entrega la SPA en:

- `/`
- `/login`
- `/chat`

## REST API

- `GET /health`
- `GET /api/conversations`

`GET /api/conversations` requiere `Authorization: Bearer <token>` y devuelve las conversaciones privadas del usuario autenticado ordenadas por mensaje mas reciente.

Example response:

```json
[
  {
    "userId": "target-user-id",
    "username": "Alice",
    "lastMessageId": 42,
    "lastMessageText": "hello",
    "lastMessageAt": "2026-04-21T20:15:00.000Z"
  }
]
```

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
