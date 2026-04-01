import React from "react";
import { MessageSquare, PackageOpen, Inbox, FileBox } from "lucide-react";

function EmptyIcon({ variant = "default" }) {
  if (variant === "messages") {
    return <MessageSquare size={34} strokeWidth={1.5} className="empty-icon-svg" />;
  }
  if (variant === "orders") {
    return <PackageOpen size={34} strokeWidth={1.5} className="empty-icon-svg" />;
  }
  if (variant === "inbox") {
    return <Inbox size={34} strokeWidth={1.5} className="empty-icon-svg" />;
  }
  return <FileBox size={34} strokeWidth={1.5} className="empty-icon-svg" />;
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
      <div className="empty-icon-wrapper" aria-hidden="true">
        <EmptyIcon variant={variant} />
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
