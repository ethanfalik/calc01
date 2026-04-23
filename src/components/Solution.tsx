"use client";

import { useState } from "react";
import type { SolveResult } from "@/lib/storage";
import Math from "@/components/Math";

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
    <div className="w-full space-y-6">
      {/* Recognized equation */}
      <div className="space-y-3">
        {image && (
          <img
            src={image}
            alt="Equation"
            className="max-h-28 rounded-xl border border-border object-cover shadow-sm"
          />
        )}
        <div className="math-area">
          <Math display>{result.recognized}</Math>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2.5">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-muted px-1 pb-1">
          Solution Steps
        </p>
        {result.steps.map((step, i) => (
          <StepCard key={i} step={step} index={i} />
        ))}
      </div>

      {/* Final answer */}
      <div className="rounded-2xl border border-accent/25 bg-accent/[0.05] p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <p className="text-[11px] uppercase tracking-widest font-semibold text-accent mb-3">
          Answer
        </p>
        <div className="overflow-x-auto">
          <Math display>{result.finalAnswer}</Math>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full h-12 rounded-xl bg-accent hover:bg-accent-light transition-all text-white text-sm font-semibold tracking-wide active:scale-[0.99]"
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
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="step-card">
      <div className="step-card-accent" />
      <div className="pl-3">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="step-number">{index + 1}</div>
          <p className="step-title">{step.title}</p>
        </div>
        <div className="step-math">
          <Math display>{step.content}</Math>
        </div>
        {step.detail && (
          <>
            <button
              onClick={() => setShowDetail(!showDetail)}
              className="mt-3 text-xs text-accent/70 hover:text-accent transition-colors flex items-center gap-1.5"
            >
              {showDetail ? "Hide explanation" : "Why this step?"}
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
              <p className="mt-2 text-sm text-muted leading-relaxed border-t border-border pt-3">
                {step.detail}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
