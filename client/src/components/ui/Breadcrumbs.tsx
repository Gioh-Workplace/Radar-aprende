import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({
  items,
}: BreadcrumbsProps) {
  return (
    <nav
      className="ui-breadcrumbs"
      aria-label="Navegação estrutural"
    >
      <ol>
        {items.map((item, index) => {
          const isLast =
            index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 && (
                <ChevronRight
                  size={14}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
              )}

              {item.to && !isLast ? (
                <Link to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={
                    isLast
                      ? "page"
                      : undefined
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}