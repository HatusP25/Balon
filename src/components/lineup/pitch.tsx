import React from "react";

export function Pitch({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-pitch-600 to-pitch-700 shadow-lg">
      <div
        aria-hidden
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 6%, rgba(255,255,255,0.6) 6%, rgba(255,255,255,0.6) 12%)",
        }}
      />
      <div className="absolute inset-3 rounded-xl border-2 border-white/30" />
      <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-white/30" />
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40" />
      <div className="absolute left-[20%] right-[20%] top-3 h-[18%] border-2 border-white/30 border-t-0" />
      <div className="absolute bottom-3 left-[20%] right-[20%] h-[18%] border-2 border-white/30 border-b-0" />
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}
