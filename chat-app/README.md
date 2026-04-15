# chat-app

Frontend Vite + React for the EcoHome Store internal chat.

## Initialize with Vite

```bash
npm create vite@latest chat-app -- --template react
```

This repository already contains the generated app structure adapted for the chat flow.

## Run locally

```bash
npm install
copy .env.example .env
npm run dev
```

## Build

```bash
npm run build
```

## Environment variables

- `VITE_AUTH_API_BASE`: auth service base URL
- `VITE_CHAT_URL`: chat microservice Socket.IO URL
