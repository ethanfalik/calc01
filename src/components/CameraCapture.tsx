"use client";

import { useState, useRef, useCallback } from "react";

export default function CameraCapture({
  onCapture,
}: {
  onCapture: (base64: string) => void;
}) {
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      // Fallback: trigger file input with capture
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onCapture(reader.result as string);
        reader.readAsDataURL(file);
      };
      input.click();
    }
  }, [onCapture]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);

    // Stop camera
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);

    onCapture(base64);
  }, [onCapture]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  if (streaming) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden border border-border">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-[4/3] object-cover bg-black"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-4 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <button
            onClick={stopCamera}
            className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={capture}
            className="w-14 h-14 rounded-full bg-white border-4 border-white/30 hover:scale-105 active:scale-95 transition-transform"
          />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={startCamera}
      className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-accent hover:bg-accent-light transition-colors text-white text-sm font-medium"
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
          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
        />
      </svg>
      Take Photo
    </button>
  );
}
