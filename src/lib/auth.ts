import { read, transaction } from "./db";
import { writeAudit, normalizePhone } from "./services/bookings";
import { ApiError } from "./services/errors";
import type { ID } from "./types";

const ADMIN_KEY = "atmosfera.admin-session";
const CLIENT_KEY = "atmosfera.client-session";
const ATTEMPTS_KEY = "atmosfera.login-attempts";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;

export interface AdminSession {
  userId: ID;
  name: string;
  role: "ADMIN" | "MANAGER";
  expiresAt: number;
}
export interface ClientSession {
  clientId: ID;
  name: string;
}

export async function hashPassword(login: string, password: string) {
  const data = new TextEncoder().encode(`atmosfera:${login}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Simple rate limit: 5 failed attempts lock the form for a minute. */
function checkRateLimit(scope: string) {
  const state = readJSON<Record<string, { count: number; lockedUntil: number }>>(ATTEMPTS_KEY) ?? {};
  const s = state[scope];
  if (s && s.lockedUntil > Date.now()) {
    const sec = Math.ceil((s.lockedUntil - Date.now()) / 1000);
    throw new ApiError(429, "RATE_LIMITED", `Слишком много попыток. Попробуйте через ${sec} с.`);
  }
}
function registerAttempt(scope: string, success: boolean) {
  const state = readJSON<Record<string, { count: number; lockedUntil: number }>>(ATTEMPTS_KEY) ?? {};
  if (success) delete state[scope];
  else {
    const count = (state[scope]?.count ?? 0) + 1;
    state[scope] = { count: count >= MAX_ATTEMPTS ? 0 : count, lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0 };
  }
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(state));
}

export async function adminLogin(login: string, password: string): Promise<AdminSession> {
  checkRateLimit("admin");
  const user = read().users.find((u) => u.login === login.trim());
  const ok = !!user && user.passwordHash === (await hashPassword(user.login, password));
  registerAttempt("admin", ok);
  transaction((db) => writeAudit(db, ok ? "ADMIN_LOGIN" : "ADMIN_LOGIN_FAILED", user?.id, ok ? "Вход в панель" : `Неудачная попытка входа: ${login}`, login));
  if (!ok || !user) throw new ApiError(401, "UNAUTHORIZED", "Неверный логин или пароль");
  const session: AdminSession = { userId: user.id, name: user.name, role: user.role, expiresAt: Date.now() + SESSION_TTL_MS };
  localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
  return session;
}

export function getAdminSession(): AdminSession | null {
  const s = readJSON<AdminSession>(ADMIN_KEY);
  if (!s || s.expiresAt < Date.now()) return null;
  return s;
}

export function requireAdmin(): AdminSession {
  const s = getAdminSession();
  if (!s) throw new ApiError(401, "UNAUTHORIZED", "Требуется вход администратора");
  return s;
}

export const adminLogout = () => localStorage.removeItem(ADMIN_KEY);

export async function changeAdminPassword(current: string, next: string) {
  const session = requireAdmin();
  const user = read().users.find((u) => u.id === session.userId)!;
  if (user.passwordHash !== (await hashPassword(user.login, current))) {
    throw new ApiError(400, "VALIDATION_ERROR", "Текущий пароль указан неверно");
  }
  if (next.length < 8) throw new ApiError(400, "VALIDATION_ERROR", "Новый пароль — минимум 8 символов");
  const hash = await hashPassword(user.login, next);
  transaction((db) => {
    db.users.find((u) => u.id === user.id)!.passwordHash = hash;
    writeAudit(db, "ADMIN_CHANGED_SETTINGS", user.id, "Изменён пароль администратора", user.login);
  });
}

/** Client sign-in: phone number + booking code from the confirmation. */
export function clientLogin(phone: string, code: string): ClientSession {
  checkRateLimit("client");
  const db = read();
  const client = db.clients.find((c) => c.phone === normalizePhone(phone));
  const booking = client && db.bookings.find((b) => b.clientId === client.id && b.code.toUpperCase() === code.trim().toUpperCase());
  registerAttempt("client", !!booking);
  if (!client || !booking) throw new ApiError(401, "UNAUTHORIZED", "Не нашли бронирование с таким телефоном и кодом");
  const session = { clientId: client.id, name: client.name };
  localStorage.setItem(CLIENT_KEY, JSON.stringify(session));
  return session;
}

export const getClientSession = () => readJSON<ClientSession>(CLIENT_KEY);
export const clientLogout = () => localStorage.removeItem(CLIENT_KEY);
