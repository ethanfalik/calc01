"use client";

import { useState, useRef, useEffect } from "react";
import type { Session } from "@/lib/storage";
import Math from "@/components/Math";

export default function SessionHistory({
  sessions,
  currentId,
  onSelect,
  onDelete,
  onNew,
}: {
  sessions: Session[];
  currentId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const pastSessions = sessions.filter((s) => s.result !== null || s.id === currentId);

  if (pastSessions.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        History
      </button>
      {open && (
        <div className="session-dropdown">
          <div className="session-dropdown-header">
            <span className="text-xs font-medium">Sessions</span>
            <button onClick={() => { onNew(); setOpen(false); }} className="session-new-btn">
              + New
            </button>
          </div>
          <div className="session-dropdown-list">
            {pastSessions.map((s) => (
              <div
                key={s.id}
                className={`session-item ${s.id === currentId ? "active" : ""}`}
              >
                <button
                  className="session-item-content"
                  onClick={() => { onSelect(s.id); setOpen(false); }}
                >
                  <div className="session-equation">
                    {s.result ? (
                      <Math>{s.result.recognized.slice(0, 60)}</Math>
                    ) : (
                      <span className="text-muted text-xs">Empty session</span>
                    )}
                  </div>
                  <span className="session-date">
                    {new Date(s.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </button>
                {s.id !== currentId && (
                  <button
                    className="session-delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
