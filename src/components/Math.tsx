"use client";

import katex from "katex";
import { useMemo } from "react";

export default function Math({
  children,
  display = false,
  className = "",
}: {
  children: string;
  display?: boolean;
  className?: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return children;
    }
  }, [children, display]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Renders a string that may contain inline LaTeX wrapped in $...$
 * and display LaTeX wrapped in $$...$$, mixed with plain text.
 */
export function MathText({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  const parts = useMemo(() => {
    const result: { type: "text" | "math" | "display-math"; value: string }[] = [];
    // Match $$...$$ first, then $...$
    const regex = /\$\$([\s\S]*?)\$\$|\$((?!\$)[\s\S]*?)\$/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(children)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: "text", value: children.slice(lastIndex, match.index) });
      }
      if (match[1] !== undefined) {
        result.push({ type: "display-math", value: match[1] });
      } else if (match[2] !== undefined) {
        result.push({ type: "math", value: match[2] });
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < children.length) {
      result.push({ type: "text", value: children.slice(lastIndex) });
    }

    return result;
  }, [children]);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <span key={i}>{part.value}</span>;
        }
        return (
          <Math key={i} display={part.type === "display-math"}>
            {part.value}
          </Math>
        );
      })}
    </span>
  );
}
