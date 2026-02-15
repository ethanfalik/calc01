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
        <div className="overflow-x-auto py-2">
          <Math display>{result.recognized}</Math>
        </div>
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
