import type {
    LucideIcon,
  } from "lucide-react";
  import type {
    ReactNode,
  } from "react";
  
  type PageStateTone =
    | "neutral"
    | "primary";
  
  interface PageStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
    tone?: PageStateTone;
    isLoading?: boolean;
  }
  
  export function PageState({
    icon: Icon,
    title,
    description,
    action,
    tone = "neutral",
    isLoading = false,
  }: PageStateProps) {
    return (
      <section
        className={[
          "ui-page-state",
          `is-${tone}`,
          isLoading ? "is-loading" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-live={
          isLoading
            ? "polite"
            : undefined
        }
        aria-busy={isLoading}
      >
        <span
          className="ui-page-state-icon"
          aria-hidden="true"
        >
          <Icon
            size={24}
            strokeWidth={1.8}
          />
        </span>
  
        <div className="ui-page-state-copy">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
  
        {action && (
          <div className="ui-page-state-action">
            {action}
          </div>
        )}
      </section>
    );
  }