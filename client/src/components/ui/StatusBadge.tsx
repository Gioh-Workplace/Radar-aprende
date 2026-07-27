import type { ReactNode } from "react";

export type StatusBadgeTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusBadgeTone;
}

export function StatusBadge({
  children,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={[
        "ui-status-badge",
        `is-${tone}`,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
