import type {
    LucideIcon,
  } from "lucide-react";
  
  export type StatCardTone =
    | "primary"
    | "teal"
    | "warning"
    | "neutral";
  
  interface StatCardProps {
    label: string;
    value: number | string | null;
    description: string;
    icon: LucideIcon;
    tone?: StatCardTone;
    isLoading?: boolean;
  }
  
  export function StatCard({
    label,
    value,
    description,
    icon: Icon,
    tone = "neutral",
    isLoading = false,
  }: StatCardProps) {
    return (
      <article
        className={[
          "ui-stat-card",
          `is-${tone}`,
        ].join(" ")}
        aria-busy={isLoading}
      >
        <div className="ui-stat-card-header">
          <span>{label}</span>
  
          <span
            className="ui-stat-card-icon"
            aria-hidden="true"
          >
            <Icon
              size={19}
              strokeWidth={1.9}
            />
          </span>
        </div>
  
        <strong className="ui-stat-card-value">
          {isLoading
            ? "…"
            : value ?? "—"}
        </strong>
  
        <p>{description}</p>
      </article>
    );
  }