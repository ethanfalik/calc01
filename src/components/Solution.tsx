"use client";

import { useState } from "react";
import type { SolveResult } from "@/app/page";

export default function Solution({
  result,
  image,
  onReset,
}: {
  result: SolveResult;
  image: string | null;
  onReset: () => void;
}) {
  return (
    <div className="w-full space-y-6 animate-in">
      {/* Recognized equation */}
      {image && (
        <div className="flex items-start gap-3">
          <img
            src={image}
            alt="Equation"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-border object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs text-muted mb-1">Recognized</p>
            <p className="math-block text-sm sm:text-base break-words">
              {result.recognized}
            </p>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2">
        <p className="text-xs text-muted uppercase tracking-wider">
          Solution Steps
        </p>
        <div className="space-y-2">
          {result.steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </div>
      </div>

      {/* Final answer */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
        <p className="text-xs text-accent mb-1 font-medium">Final Answer</p>
        <p className="math-block text-base sm:text-lg font-medium">
          {result.finalAnswer}
        </p>
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
}: {
  step: { title: string; content: string; detail?: string };
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => step.detail && setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-3 sm:p-4 text-left hover:bg-surface-hover transition-colors"
      >
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-medium flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{step.title}</p>
          <p className="math-block text-sm text-muted mt-1 break-words">
            {step.content}
          </p>
        </div>
        {step.detail && (
          <svg
            className={`w-4 h-4 text-muted flex-shrink-0 mt-1 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        )}
      </button>
      {expanded && step.detail && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 ml-9">
          <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
            {step.detail}
          </div>
        </div>
      )}
    </div>
  );
}
