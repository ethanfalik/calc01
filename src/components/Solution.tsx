"use client";

import { useState } from "react";
import type { SolveResult } from "@/app/page";
import Math from "@/components/Math";

export default function Solution({
  result,
  image,
  onReset,
  onResolve,
}: {
  result: SolveResult;
  image: string | null;
  onReset: () => void;
  onResolve: (corrected: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(result.recognized);

  const handleCorrect = () => {
    if (editValue.trim() && editValue !== result.recognized) {
      onResolve(editValue.trim());
    }
    setEditing(false);
  };

  return (
    <div className="w-full space-y-8">
      {/* Recognized equation */}
      <div className="space-y-3">
        {image && (
          <img
            src={image}
            alt="Equation"
            className="max-h-28 rounded-lg border border-border object-cover"
          />
        )}

        {editing ? (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-muted">
              Edit equation (LaTeX)
            </p>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
              rows={3}
              autoFocus
            />
            <div className="overflow-x-auto py-1 px-1 bg-surface-hover rounded-lg">
              <p className="text-[10px] text-muted mb-1">Preview:</p>
              <Math display>{editValue}</Math>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCorrect}
                className="flex-1 h-9 rounded-lg bg-accent hover:bg-accent-light transition-colors text-white text-xs font-medium"
              >
                Re-solve
              </button>
              <button
                onClick={() => { setEditing(false); setEditValue(result.recognized); }}
                className="h-9 px-4 rounded-lg border border-border text-xs font-medium hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="group relative">
            <div className="overflow-x-auto py-2">
              <Math display>{result.recognized}</Math>
            </div>
            <button
              onClick={() => { setEditValue(result.recognized); setEditing(true); }}
              className="mt-1 text-xs text-muted hover:text-accent transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
              </svg>
              Wrong? Edit equation
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Steps */}
      <div className="space-y-4">
        {result.steps.map((step, i) => (
          <StepCard
            key={i}
            step={step}
            index={i}
            total={result.steps.length}
          />
        ))}
      </div>

      {/* Final answer */}
      <div className="rounded-2xl bg-accent/[0.06] border border-accent/15 p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-widest text-accent/70 mb-3 font-medium">
          Answer
        </p>
        <div className="overflow-x-auto">
          <Math display>{result.finalAnswer}</Math>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full h-12 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white text-sm font-medium"
      >
        Solve Another
      </button>
    </div>
  );
}

function StepCard({
  step,
  index,
  total,
}: {
  step: { title: string; content: string; detail?: string };
  index: number;
  total: number;
}) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="relative flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-accent/10 text-accent text-xs font-semibold flex items-center justify-center flex-shrink-0">
          {index + 1}
        </div>
        {index < total - 1 && (
          <div className="w-px flex-1 bg-border mt-2" />
        )}
      </div>

      {/* Content */}
      <div className="pb-6 min-w-0 flex-1">
        <p className="text-sm font-medium text-muted mb-2">{step.title}</p>
        <div className="overflow-x-auto py-1">
          <Math display>{step.content}</Math>
        </div>
        {step.detail && (
          <>
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="mt-2 text-xs text-accent/70 hover:text-accent transition-colors flex items-center gap-1"
            >
              {showDetail ? "Hide" : "Why?"}
              <svg
                className={`w-3 h-3 transition-transform ${showDetail ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showDetail && (
              <p className="mt-2 text-sm text-muted leading-relaxed">
                {step.detail}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
