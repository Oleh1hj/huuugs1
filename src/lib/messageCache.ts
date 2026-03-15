/**
 * localStorage message cache.
 * Messages are persisted here so they survive page reloads even when
 * the server DB is ephemeral (e.g. SQLite on Railway without a volume).
 */
import { Message } from '@/types';

const MAX_PER_CONV = 200;

function key(conversationId: string) {
  return `huugs_msgs_${conversationId}`;
}

export function loadCachedMessages(conversationId: string): Message[] {
  try {
    const raw = localStorage.getItem(key(conversationId));
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
}

export function saveMessagesToCache(conversationId: string, messages: Message[]) {
  try {
    // Only save real messages (not optimistic temp ones)
    const real = messages.filter((m) => !m.id.startsWith('temp-'));
    const trimmed = real.slice(-MAX_PER_CONV);
    localStorage.setItem(key(conversationId), JSON.stringify(trimmed));
  } catch {
    // localStorage might be full — ignore
  }
}

export function addMessageToCache(msg: Message) {
  if (msg.id.startsWith('temp-')) return;
  const existing = loadCachedMessages(msg.conversationId);
  if (existing.some((m) => m.id === msg.id)) return; // already stored
  const updated = [...existing, msg].slice(-MAX_PER_CONV);
  saveMessagesToCache(msg.conversationId, updated);
}
