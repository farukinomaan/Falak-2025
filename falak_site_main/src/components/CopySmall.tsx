"use client";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import React from "react";

export function CopySmall({ text, className = "" }: { text: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); toast.success("Copied"); }}
      aria-label="Copy code"
      className={`p-1.5 rounded-md bg-black/40 hover:bg-black/60 border border-white/20 transition-colors text-white ${className}`}
    >
      <Copy size={14} />
    </button>
  );
}

export default CopySmall;
