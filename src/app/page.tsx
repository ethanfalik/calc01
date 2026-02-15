"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import CameraCapture from "@/components/CameraCapture";
import Solution from "@/components/Solution";
import FloatingPanel from "@/components/FloatingPanel";
import StickyNoteComponent from "@/components/StickyNote";
import SessionHistory from "@/components/SessionHistory";
import {
  type Session,
  type SolveResult,
  type StickyNote,
  type ChatMessage,
  getSessions,
  getSession,
  saveSession,
  deleteSession,
  getCurrentSessionId,
  setCurrentSessionId,
  createSession,
} from "@/lib/storage";

// Re-export for any existing imports
export type { SolveResult } from "@/lib/storage";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize session from localStorage on mount
  useEffect(() => {
    const currentId = getCurrentSessionId();
    const allSessions = getSessions();
    setSessions(allSessions);

    if (currentId) {
      const existing = getSession(currentId);
      if (existing) {
        setSession(existing);
        setMounted(true);
        return;
      }
    }
    // No valid session — create one
    const newSession = createSession();
    saveSession(newSession);
    setCurrentSessionId(newSession.id);
    setSession(newSession);
    setSessions(getSessions());
    setMounted(true);
  }, []);

  const updateSession = useCallback((updated: Session) => {
    setSession(updated);
    saveSession(updated);
    setSessions(getSessions());
  }, []);

  const solve = useCallback(
    async (base64: string) => {
      if (!session) return;
      const updated = { ...session, image: base64, result: null };
      updateSession(updated);
      setError(null);
      setLoading(true);

      try {
        const res = await fetch("/api/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to solve equation");
        }

        const data: SolveResult = await res.json();
        updateSession({ ...session, image: base64, result: data });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [session, updateSession]
  );

  const resolveFromText = useCallback(
    async (corrected: string) => {
      if (!session) return;
      setError(null);
      setLoading(true);

      try {
        const res = await fetch("/api/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ corrected }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to solve equation");
        }

        const data: SolveResult = await res.json();
        updateSession({ ...session, result: data });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [session, updateSession]
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        solve(base64);
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [solve]
  );

  const startNewSession = useCallback(() => {
    const newSession = createSession();
    saveSession(newSession);
    setCurrentSessionId(newSession.id);
    setSession(newSession);
    setSessions(getSessions());
    setError(null);
    setLoading(false);
  }, []);

  const switchToSession = useCallback((id: string) => {
    const s = getSession(id);
    if (s) {
      setSession(s);
      setCurrentSessionId(id);
      setError(null);
      setLoading(false);
    }
  }, []);

  const handleDeleteSession = useCallback(
    (id: string) => {
      deleteSession(id);
      setSessions(getSessions());
    },
    []
  );

  // Sticky notes
  const addNote = useCallback(() => {
    if (!session) return;
    const note: StickyNote = {
      id: crypto.randomUUID(),
      text: "",
      x: 10 + Math.random() * 30,
      y: 10 + Math.random() * 30,
      color: "#fef08a",
    };
    updateSession({ ...session, notes: [...session.notes, note] });
  }, [session, updateSession]);

  const updateNote = useCallback(
    (note: StickyNote) => {
      if (!session) return;
      updateSession({
        ...session,
        notes: session.notes.map((n) => (n.id === note.id ? note : n)),
      });
    },
    [session, updateSession]
  );

  const deleteNote = useCallback(
    (id: string) => {
      if (!session) return;
      updateSession({
        ...session,
        notes: session.notes.filter((n) => n.id !== id),
      });
    },
    [session, updateSession]
  );

  // Chat
  const handleSendMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (!session) return null;
      const userMsg: ChatMessage = { role: "user", content: message };
      const updatedMessages = [...session.chatMessages, userMsg];

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            equation: session.result?.recognized || null,
          }),
        });
        const data = await res.json();
        if (data.error) {
          const errorMsg: ChatMessage = { role: "assistant", content: `Error: ${data.error}` };
          updateSession({ ...session, chatMessages: [...updatedMessages, errorMsg] });
          return null;
        }
        const assistantMsg: ChatMessage = { role: "assistant", content: data.content };
        updateSession({ ...session, chatMessages: [...updatedMessages, assistantMsg] });
        return data.correctedEquation || null;
      } catch {
        const errorMsg: ChatMessage = { role: "assistant", content: "Failed to get response." };
        updateSession({ ...session, chatMessages: [...updatedMessages, errorMsg] });
        return null;
      }
    },
    [session, updateSession]
  );

  if (!mounted || !session) return null;

  const { image, result, notes, chatMessages } = session;

  return (
    <div className="min-h-dvh flex flex-col relative">
      {/* Sticky notes overlay */}
      {notes.length > 0 && (
        <div className="sticky-notes-container">
          {notes.map((note) => (
            <StickyNoteComponent
              key={note.id}
              note={note}
              onUpdate={updateNote}
              onDelete={deleteNote}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border relative z-10">
        <button onClick={startNewSession} className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">calc01</h1>
        </button>
        <div className="flex items-center gap-3">
          <SessionHistory
            sessions={sessions}
            currentId={session.id}
            onSelect={switchToSession}
            onDelete={handleDeleteSession}
            onNew={startNewSession}
          />
          {(image || result) && (
            <button
              onClick={startNewSession}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              New
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-[1]">
        {!image && !result && (
          <div className="flex-1 flex flex-col items-center justify-center w-full gap-6">
            <div className="text-center space-y-2 mb-4">
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Solve any equation
              </p>
              <p className="text-muted text-sm sm:text-base">
                Take a photo or upload an image of any math problem
              </p>
            </div>

            <div className="w-full max-w-sm space-y-3">
              <CameraCapture onCapture={solve} />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-colors text-sm font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                Upload Image
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {image && (
              <img
                src={image}
                alt="Captured equation"
                className="max-h-40 rounded-lg border border-border"
              />
            )}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted">
                Recognizing and solving...
              </span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            {image && (
              <img
                src={image}
                alt="Captured equation"
                className="max-h-40 rounded-lg border border-border"
              />
            )}
            <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm max-w-sm text-center">
              {error}
            </div>
            <button
              onClick={startNewSession}
              className="text-sm text-accent hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <Solution result={result} image={image} onReset={startNewSession} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted py-4 border-t border-border relative z-10">
        Powered by AI vision &mdash; results may need verification
      </footer>

      {/* Floating panel */}
      <FloatingPanel
        chatMessages={chatMessages}
        equation={result?.recognized || null}
        notes={notes}
        onSendMessage={handleSendMessage}
        onApplyCorrection={resolveFromText}
        onAddNote={addNote}
        onEditNote={updateNote}
        onDeleteNote={deleteNote}
      />
    </div>
  );
}
