import { getAccessToken, setAccessToken } from '../utils/storage.js';

const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_BASE || 'https://ecohomeapi.onrender.com';

function extractToken(payload) {
  return payload?.accessToken || payload?.access_token || payload?.token || null;
}

export async function login({ email, password }) {
  const response = await fetch(`${AUTH_API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || 'Unable to login');
  }

  const token = extractToken(payload);

  if (!token) {
    throw new Error('Access token missing in login response');
  }

  setAccessToken(token);
  return token;
}

export function getCurrentAccessToken() {
  return getAccessToken();
}
