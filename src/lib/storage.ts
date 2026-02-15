export type SolveResult = {
  recognized: string;
  steps: { title: string; content: string; detail?: string }[];
  finalAnswer: string;
};

export type StickyNote = {
  id: string;
  text: string;
  x: number; // percentage-based
  y: number;
  color: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Session = {
  id: string;
  createdAt: number;
  image: string | null;
  result: SolveResult | null;
  notes: StickyNote[];
  chatMessages: ChatMessage[];
};

const SESSIONS_KEY = "calc01_sessions";
const CURRENT_KEY = "calc01_current_session";

export function getSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getSession(id: string): Session | undefined {
  return getSessions().find((s) => s.id === id);
}

export function saveSession(session: Session): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  if (getCurrentSessionId() === id) {
    localStorage.removeItem(CURRENT_KEY);
  }
}

export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_KEY);
}

export function setCurrentSessionId(id: string): void {
  localStorage.setItem(CURRENT_KEY, id);
}

export function createSession(): Session {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    image: null,
    result: null,
    notes: [],
    chatMessages: [],
  };
}
