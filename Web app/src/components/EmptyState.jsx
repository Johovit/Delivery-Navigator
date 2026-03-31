import React from "react";

function Illustration({ variant = "default" }) {
  const palette = {
    bg: "#EFF6FF",
    stroke: "#BFDBFE",
    accent: "#2563EB",
  };

  if (variant === "messages") {
    return (
      <svg width="130" height="90" viewBox="0 0 130 90" aria-hidden="true">
        <rect x="12" y="14" width="106" height="58" rx="12" fill={palette.bg} stroke={palette.stroke} strokeWidth="2" />
        <path d="M28 34 H102" stroke={palette.accent} strokeWidth="3" strokeLinecap="round" />
        <path d="M28 48 H78" stroke={palette.accent} strokeWidth="3" strokeLinecap="round" />
        <path d="M26 72 L38 60" stroke={palette.stroke} strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === "orders") {
    return (
      <svg width="130" height="90" viewBox="0 0 130 90" aria-hidden="true">
        <rect x="14" y="20" width="102" height="56" rx="14" fill={palette.bg} stroke={palette.stroke} strokeWidth="2" />
        <path d="M36 40 H94" stroke={palette.accent} strokeWidth="3" strokeLinecap="round" />
        <path d="M36 54 H78" stroke={palette.accent} strokeWidth="3" strokeLinecap="round" />
        <circle cx="44" cy="30" r="5" fill={palette.accent} />
      </svg>
    );
  }

  if (variant === "inbox") {
    return (
      <svg width="130" height="90" viewBox="0 0 130 90" aria-hidden="true">
        <rect x="16" y="18" width="98" height="60" rx="14" fill={palette.bg} stroke={palette.stroke} strokeWidth="2" />
        <path d="M28 52 L50 36 L65 48 L80 36 L102 52" stroke={palette.accent} strokeWidth="3" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }

  return (
    <svg width="130" height="90" viewBox="0 0 130 90" aria-hidden="true">
      <rect x="14" y="20" width="102" height="56" rx="14" fill={palette.bg} stroke={palette.stroke} strokeWidth="2" />
      <path d="M36 48 H94" stroke={palette.accent} strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="34" r="5" fill={palette.accent} />
    </svg>
  );
}

export default function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  variant = "default",
  compact = false,
}) {
  return (
    <div className={`empty-state${compact ? " compact" : ""}`}>
      <div className="empty-illustration" aria-hidden="true">
        <Illustration variant={variant} />
      </div>
      {title ? <p className="empty-title">{title}</p> : null}
      {message ? <p className="empty-sub">{message}</p> : null}
      {actionLabel && onAction ? (
        <button className="accent-btn empty-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

