import type {
    ButtonHTMLAttributes,
    ReactNode,
  } from "react";
  import { Link } from "react-router";
  
  export type ButtonVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "danger";
  
  interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    icon?: ReactNode;
    isLoading?: boolean;
  }
  
  export function Button({
    variant = "primary",
    icon,
    isLoading = false,
    className = "",
    children,
    disabled,
    type = "button",
    ...buttonProps
  }: ButtonProps) {
    return (
      <button
        {...buttonProps}
        type={type}
        className={[
          "ui-button",
          `is-${variant}`,
          isLoading ? "is-loading" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
      >
        {icon && (
          <span
            className="ui-button-icon"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
  
        <span>
          {isLoading
            ? "Carregando..."
            : children}
        </span>
      </button>
    );
  }
  
  interface ButtonLinkProps {
    to: string;
    children: ReactNode;
    variant?: ButtonVariant;
    icon?: ReactNode;
    className?: string;
    ariaLabel?: string;
  }
  
  export function ButtonLink({
    to,
    children,
    variant = "primary",
    icon,
    className = "",
    ariaLabel,
  }: ButtonLinkProps) {
    return (
      <Link
        to={to}
        className={[
          "ui-button",
          `is-${variant}`,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={ariaLabel}
      >
        {icon && (
          <span
            className="ui-button-icon"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
  
        <span>{children}</span>
      </Link>
    );
  }