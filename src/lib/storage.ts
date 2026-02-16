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

function stripImages(sessions: Session[]): Session[] {
  return sessions.map((s) => ({ ...s, image: null }));
}

export function getSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Session[];
    // Sanitize: strip any lingering image data from old sessions
    const clean = stripImages(parsed);
    return clean;
  } catch {
    // Corrupted data — nuke it
    localStorage.removeItem(SESSIONS_KEY);
    return [];
  }
}

export function getSession(id: string): Session | undefined {
  return getSessions().find((s) => s.id === id);
}

export function saveSession(session: Session): void {
  try {
    const sessions = getSessions();
    const toStore = { ...session, image: null };
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = toStore;
    } else {
      sessions.unshift(toStore);
    }
    // Keep at most 20 sessions
    if (sessions.length > 20) sessions.length = 20;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Quota still exceeded — clear old sessions and retry with just this one
    try {
      const toStore = { ...session, image: null };
      localStorage.setItem(SESSIONS_KEY, JSON.stringify([toStore]));
    } catch {
      // Completely hosed — clear everything
      localStorage.removeItem(SESSIONS_KEY);
    }
  }
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    localStorage.removeItem(SESSIONS_KEY);
  }
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
