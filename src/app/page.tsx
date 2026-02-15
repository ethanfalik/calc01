"use client";

import { useState, useRef, useCallback } from "react";
import CameraCapture from "@/components/CameraCapture";
import Solution from "@/components/Solution";

export type SolveResult = {
  recognized: string;
  steps: { title: string; content: string; detail?: string }[];
  finalAnswer: string;
};

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const solve = useCallback(async (base64: string) => {
    setImage(base64);
    setResult(null);
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
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const reset = useCallback(() => {
    setImage(null);
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <button onClick={reset} className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">calc01</h1>
        </button>
        {(image || result) && (
          <button
            onClick={reset}
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            New
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
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
              onClick={reset}
              className="text-sm text-accent hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <Solution result={result} image={image} onReset={reset} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-muted py-4 border-t border-border">
        Powered by AI vision &mdash; results may need verification
      </footer>
    </div>
  );
}
