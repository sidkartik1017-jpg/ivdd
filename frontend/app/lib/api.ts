// Thin client for the SpineGuard Flask backend.
// Base URL is configurable via NEXT_PUBLIC_API_URL (see .env.local.example).

import { FormState, RiskResult, HistoryEntry, ChatMessage } from "./risk";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const TOKEN_KEY = "sg_token";
const USER_KEY = "sg_user";

export type AuthUser = { id: number; email: string; name: string };

// --- token / user persistence (localStorage) ---
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}
export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}
export function setUser(user: AuthUser) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function signOut() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

// --- auth ---
export async function signIn(email: string, password: string) {
  const data = await request<{ token: string; user: AuthUser }>(
    "/api/auth/signin",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
  setToken(data.token);
  setUser(data.user);
  return data;
}

export async function signUp(name: string, email: string, password: string) {
  const data = await request<{ token: string; user: AuthUser }>(
    "/api/auth/signup",
    { method: "POST", body: JSON.stringify({ name, email, password }) }
  );
  setToken(data.token);
  setUser(data.user);
  return data;
}

// --- prediction ---
export async function predict(form: FormState, hasMri: boolean) {
  return request<{ result: RiskResult & { source?: string }; entry: HistoryEntry }>(
    "/api/predict",
    { method: "POST", body: JSON.stringify({ form, hasMri }) }
  );
}

export async function getHistory() {
  return request<{ history: HistoryEntry[] }>("/api/history");
}

// --- chatbot ---
export async function chat(message: string, history: ChatMessage[]) {
  return request<{ reply: string; source: string }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}
