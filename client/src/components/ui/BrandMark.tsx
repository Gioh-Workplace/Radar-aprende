import "./BrandMark.css";

type BrandMarkTone =
  | "light"
  | "dark";

interface BrandMarkProps {
  compact?: boolean;
  tone?: BrandMarkTone;
}

export function BrandMark({
  compact = false,
  tone = "light",
}: BrandMarkProps) {
  return (
    <span
      className={[
        "radar-brand",
        `is-${tone}`,
        compact ? "is-compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className="radar-brand-symbol"
        aria-hidden="true"
      >
        <span className="radar-brand-sweep" />
        <span className="radar-brand-dot" />
      </span>

      <span className="radar-brand-copy">
        <strong>RadarAprende</strong>

        {!compact && (
          <span>
            Evidências que orientam
          </span>
        )}
      </span>
    </span>
  );
}