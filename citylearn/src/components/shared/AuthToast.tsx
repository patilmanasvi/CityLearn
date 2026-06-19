"use client";

import React, { useEffect } from "react";

interface AuthToastProps {
  message: string;
  type?: "error" | "success";
  onClose: () => void;
}

export function AuthToast({ message, type = "error", onClose }: AuthToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === "error";

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
      <div
        className={`flex items-start gap-3 rounded-xl border shadow-xl px-4 py-3 backdrop-blur-md ${
          isError
            ? "bg-white border-destructive/30 text-foreground"
            : "bg-white border-green-200 text-foreground"
        }`}
        role="alert"
      >
        <span
          className={`material-symbols-outlined text-xl shrink-0 ${
            isError ? "text-destructive" : "text-green-600"
          }`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isError ? "error" : "check_circle"}
        </span>
        <p className="text-sm font-semibold flex-1 pt-0.5">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
}
