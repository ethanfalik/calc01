"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { StickyNote as StickyNoteType } from "@/lib/storage";

const COLORS = ["#fef08a", "#fde68a", "#bbf7d0", "#bfdbfe", "#e9d5ff", "#fecdd3"];

export default function StickyNote({
  note,
  onUpdate,
  onDelete,
}: {
  note: StickyNoteType;
  onUpdate: (note: StickyNoteType) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(!note.text);
  const [text, setText] = useState(note.text);
  const [dragging, setDragging] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; noteX: number; noteY: number } | null>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      e.preventDefault();
      setDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        noteX: note.x,
        noteY: note.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [note.x, note.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !dragRef.current) return;
      const parent = noteRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
      const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
      const newX = Math.max(0, Math.min(85, dragRef.current.noteX + dx));
      const newY = Math.max(0, Math.min(85, dragRef.current.noteY + dy));
      onUpdate({ ...note, x: newX, y: newY });
    },
    [dragging, note, onUpdate]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    dragRef.current = null;
  }, []);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (text !== note.text) {
      onUpdate({ ...note, text });
    }
  }, [text, note, onUpdate]);

  useEffect(() => {
    setText(note.text);
  }, [note.text]);

  return (
    <div
      ref={noteRef}
      className="sticky-note"
      style={{
        left: `${note.x}%`,
        top: `${note.y}%`,
        backgroundColor: note.color,
        cursor: dragging ? "grabbing" : "grab",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="sticky-note-header">
        <button
          data-no-drag
          className="sticky-note-btn"
          onClick={() => setShowColors(!showColors)}
          title="Change color"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </button>
        <button
          data-no-drag
          className="sticky-note-btn"
          onClick={() => onDelete(note.id)}
          title="Delete"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      {showColors && (
        <div data-no-drag className="sticky-note-colors">
          {COLORS.map((c) => (
            <button
              key={c}
              className="sticky-color-dot"
              style={{ backgroundColor: c }}
              onClick={() => {
                onUpdate({ ...note, color: c });
                setShowColors(false);
              }}
            />
          ))}
        </div>
      )}
      {editing ? (
        <textarea
          data-no-drag
          className="sticky-note-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          autoFocus
          placeholder="Type a note..."
        />
      ) : (
        <div
          data-no-drag
          className="sticky-note-text"
          onClick={() => setEditing(true)}
        >
          {note.text || "Click to edit..."}
        </div>
      )}
    </div>
  );
}
