# EcoHome Chat

Repositorio del sistema de chat interno de **EcoHome Store**, dividido en dos proyectos:

- `chat-app`: frontend en React + Vite
- `chat-service`: microservicio de chat en Node.js + Express + Socket.IO + PostgreSQL

Este proyecto fue desarrollado como **caso academico**, con enfoque en integracion de frontend y backend dentro de una arquitectura de microservicios.

## Estructura

```text
EcoHome_Chat/
  chat-app/
  chat-service/
```

## chat-app

Aplicacion React que:

- autentica contra el servicio de auth existente
- almacena el JWT en `localStorage`
- se conecta al microservicio de chat con Socket.IO
- muestra chat global, presencia y mensajes privados

Comandos principales:

```bash
cd chat-app
npm install
npm run dev
```

Build:

```bash
npm run build
```

Deploy del frontend hacia el backend:

```bash
npm run deploy
```

Variables:

- `VITE_AUTH_API_BASE`
- `VITE_CHAT_URL`

## chat-service

Microservicio Express que:

- valida JWT con secreto compartido
- maneja conexiones Socket.IO
- persiste mensajes en PostgreSQL bajo el esquema `chat`
- soporta chat global, presencia y mensajes privados
- sirve el frontend compilado desde `public/`

Comandos principales:

```bash
cd chat-service
npm install
npm run build
npm start
```

Modo desarrollo:

```bash
npm run dev
```

Variables:

- `PORT`
- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `DB_PORT`
- `DB_SSL`
- `DB_SSL_REJECT_UNAUTHORIZED`
- `JWT_SECRET`

## Flujo recomendado local

1. Configurar `chat-service/.env`
2. Levantar backend:

```bash
cd chat-service
npm install
npm start
```

3. Levantar frontend:

```bash
cd chat-app
npm install
npm run dev
```

## Deploy

Si el backend va a servir el frontend compilado:

1. Ejecutar `npm run deploy` dentro de `chat-app`
2. Confirmar que `chat-service/public/` contiene el build
3. Desplegar `chat-service`

En Render, con `Root Directory = chat-service`, usar:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`

## Nota

Este repositorio no implementa el servicio de autenticacion ni otros modulos de negocio. Solo integra el frontend del chat y el microservicio de mensajeria necesarios para el ejercicio academico.
