# chat-app

Frontend de EcoHome Chat construido con **React + Vite**.

Este modulo hace parte de un **caso academico** y consume:

- un servicio externo de autenticacion que entrega JWT
- el microservicio `chat-service` para tiempo real y persistencia

## Comandos

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Deploy del build hacia `../chat-service/public`:

```bash
npm run deploy
```

## Variables de entorno

Usa un archivo `.env` basado en `.env.example`.

- `VITE_AUTH_API_BASE`: URL base del servicio de autenticacion
- `VITE_CHAT_URL`: URL del microservicio de chat. Si se deja vacia, usa el mismo origen del navegador.
