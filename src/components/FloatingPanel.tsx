"use client";

import { useState, useRef, useCallback } from "react";
import type { ChatMessage, StickyNote } from "@/lib/storage";

function clampPosition(x: number, y: number, elWidth: number, elHeight: number) {
  const maxX = window.innerWidth - 20 - elWidth;
  const maxY = window.innerHeight - 20 - elHeight;
  // position is an offset from the default bottom-right anchor, so negative x = left, negative y = up
  const minX = -(window.innerWidth - 20 - elWidth);
  const minY = -(window.innerHeight - 20 - elHeight);
  return {
    x: Math.max(minX, Math.min(0, x)),
    y: Math.max(minY, Math.min(0, y)),
  };
}

export default function FloatingPanel({
  chatMessages,
  equation,
  notes,
  onSendMessage,
  onApplyCorrection,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: {
  chatMessages: ChatMessage[];
  equation: string | null;
  notes: StickyNote[];
  onSendMessage: (message: string) => Promise<string | null>;
  onApplyCorrection: (equation: string) => void;
  onAddNote: () => void;
  onEditNote: (note: StickyNote) => void;
  onDeleteNote: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [tab, setTab] = useState<"ai" | "notes">("ai");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [correction, setCorrection] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);
    setCorrection(null);
    try {
      const correctedEquation = await onSendMessage(msg);
      if (correctedEquation) {
        setCorrection(correctedEquation);
      }
    } catch {
      // Error handled by parent
    } finally {
      setSending(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [input, sending, onSendMessage]);

  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        posX: position.x,
        posY: position.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [position]
  );

  const handleDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const el = panelRef.current;
      const w = el ? el.offsetWidth : 320;
      const h = el ? el.offsetHeight : 460;
      setPosition(clampPosition(dragRef.current.posX + dx, dragRef.current.posY + dy, w, h));
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleCollapse = useCallback(() => {
    setCollapsed(true);
    setPosition({ x: 0, y: 0 });
  }, []);

  if (collapsed) {
    return (
      <button
        className="floating-pill"
        onClick={() => setCollapsed(false)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        AI / Notes
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      className="floating-panel"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Draggable header */}
      <div
        className="floating-panel-header"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
      >
        <div className="floating-panel-tabs" data-no-drag>
          <button
            className={`floating-tab ${tab === "ai" ? "active" : ""}`}
            onClick={() => setTab("ai")}
          >
            AI
          </button>
          <button
            className={`floating-tab ${tab === "notes" ? "active" : ""}`}
            onClick={() => setTab("notes")}
          >
            Notes
          </button>
        </div>
        <button
          data-no-drag
          className="floating-panel-close"
          onClick={handleCollapse}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* AI Tab */}
      {tab === "ai" && (
        <div className="floating-panel-body">
          <div className="floating-chat-messages">
            {chatMessages.length === 0 && (
              <p className="text-xs text-muted text-center py-4">
                Ask about the equation, request changes, or get help understanding the solution.
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                <div className="chat-bubble">{msg.content}</div>
              </div>
            ))}
            {sending && (
              <div className="chat-msg assistant">
                <div className="chat-bubble">
                  <span className="chat-typing">Thinking...</span>
                </div>
              </div>
            )}
            {correction && (
              <div className="chat-correction">
                <button
                  data-no-drag
                  onClick={() => {
                    onApplyCorrection(correction);
                    setCorrection(null);
                  }}
                  className="chat-apply-btn"
                >
                  Apply correction: {correction.slice(0, 40)}
                  {correction.length > 40 ? "..." : ""}
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="floating-chat-input" data-no-drag>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={equation ? "Ask about the equation..." : "Solve something first..."}
              disabled={sending || !equation}
            />
            <button onClick={handleSend} disabled={sending || !input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {tab === "notes" && (
        <div className="floating-panel-body">
          <button className="floating-add-note" data-no-drag onClick={onAddNote}>
            + Add Note
          </button>
          <div className="floating-notes-list">
            {notes.length === 0 && (
              <p className="text-xs text-muted text-center py-4">
                No notes yet. Add one to annotate the solution.
              </p>
            )}
            {notes.map((note) => (
              <div key={note.id} className="floating-note-item" style={{ borderLeftColor: note.color }}>
                <input
                  data-no-drag
                  type="text"
                  value={note.text}
                  onChange={(e) => onEditNote({ ...note, text: e.target.value })}
                  placeholder="Type note..."
                  className="floating-note-input"
                />
                <button
                  data-no-drag
                  onClick={() => onDeleteNote(note.id)}
                  className="floating-note-delete"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
