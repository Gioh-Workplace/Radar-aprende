import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="ui-page-header">
      <div className="ui-page-header-copy">
        {eyebrow && (
          <span className="ui-page-eyebrow">
            {eyebrow}
          </span>
        )}

        <h1>{title}</h1>

        {description && (
          <p>{description}</p>
        )}
      </div>

      {actions && (
        <div className="ui-page-header-actions">
          {actions}
        </div>
      )}
    </header>
  );
}