"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GlobalReload() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Don't show on login/register pages
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <button
      onClick={() => window.location.reload()}
      style={{
        position: "fixed",
        bottom: "85px", // Above bottom nav
        right: "20px",
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        backgroundColor: "rgba(10, 11, 15, 0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
      title="Reload Page"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    </button>
  );
}
