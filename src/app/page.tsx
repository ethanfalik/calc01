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

  const handleDeleteSession = useCallback((id: string) => {
    deleteSession(id);
    setSessions(getSessions());
  }, []);

  const addNote = useCallback(() => {
    if (!session) return;
    const note: StickyNote = {
      id: crypto.randomUUID(),
      text: "",
      x: 10 + Math.random() * 30,
      y: 10 + Math.random() * 30,
      color: "#fff9c4",
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
      <header className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-border relative z-10 bg-surface/80 backdrop-blur-sm">
        <button onClick={startNewSession} className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white font-mono text-xs font-bold shrink-0 group-hover:bg-accent-light transition-colors">
            c
          </div>
          <h1 className="text-base font-bold tracking-tight">calc01</h1>
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
              className="text-sm text-muted hover:text-foreground transition-colors font-medium"
            >
              New
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-[1]">
        {/* Landing state */}
        {!image && !result && !loading && !error && (
          <div className="flex-1 flex flex-col items-center justify-center w-full gap-8">
            <div className="text-center space-y-4 mb-2">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-3xl font-light select-none">
                  ∑
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">
                Solve any equation
              </p>
              <p className="text-muted text-sm sm:text-base max-w-xs mx-auto leading-relaxed">
                Take a photo or upload an image of any math problem for step-by-step solutions
              </p>
            </div>

            <div className="w-full max-w-sm space-y-3">
              <CameraCapture onCapture={solve} />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-colors text-sm font-medium"
              >
                <svg
                  className="w-4 h-4 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
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
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            {image && (
              <img
                src={image}
                alt="Captured equation"
                className="max-h-44 rounded-xl border border-border shadow-sm object-cover"
              />
            )}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 rounded-full border-2 border-border" />
                <div className="absolute inset-0 rounded-full border-2 border-t-accent animate-spin" />
              </div>
              <p className="text-sm text-muted font-medium">Recognizing and solving&hellip;</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            {image && (
              <img
                src={image}
                alt="Captured equation"
                className="max-h-44 rounded-xl border border-border shadow-sm object-cover"
              />
            )}
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-400 px-5 py-4 rounded-xl text-sm max-w-sm text-center leading-relaxed">
              {error}
            </div>
            <button
              onClick={startNewSession}
              className="text-sm font-medium text-accent hover:text-accent-light underline underline-offset-2 transition-colors"
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
      <footer className="text-center text-xs text-muted/60 py-4 border-t border-border relative z-10">
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
