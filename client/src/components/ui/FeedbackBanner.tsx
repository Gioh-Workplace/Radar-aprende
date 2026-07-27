import {
    AlertCircle,
    CircleCheck,
    Info,
  } from "lucide-react";
  import type { ReactNode } from "react";
  
  type FeedbackTone =
    | "info"
    | "success"
    | "error";
  
  interface FeedbackBannerProps {
    tone?: FeedbackTone;
    title: string;
    description: string;
    action?: ReactNode;
  }
  
  const icons = {
    info: Info,
    success: CircleCheck,
    error: AlertCircle,
  };
  
  export function FeedbackBanner({
    tone = "info",
    title,
    description,
    action,
  }: FeedbackBannerProps) {
    const Icon = icons[tone];
  
    return (
      <section
        className={[
          "ui-feedback-banner",
          `is-${tone}`,
        ].join(" ")}
        role={tone === "error" ? "alert" : "status"}
      >
        <span
          className="ui-feedback-icon"
          aria-hidden="true"
        >
          <Icon
            size={21}
            strokeWidth={1.9}
          />
        </span>
  
        <div className="ui-feedback-copy">
          <strong>{title}</strong>
          <p>{description}</p>
        </div>
  
        {action && (
          <div className="ui-feedback-action">
            {action}
          </div>
        )}
      </section>
    );
  }