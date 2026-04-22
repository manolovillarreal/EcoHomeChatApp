const CHAT_URL = import.meta.env.VITE_CHAT_URL || window.location.origin;

export async function getConversations(token) {
  const response = await fetch(`${CHAT_URL}/api/conversations`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to load conversations');
  }

  const conversations = await response.json();
  return Array.isArray(conversations) ? conversations : [];
}
