export type ResultProgressTone =
  | "critical"
  | "developing"
  | "consolidated"
  | "neutral";

interface ResultProgressBarProps {
  label: string;
  value: number;
  detail: string;
  tone?: ResultProgressTone;
}

function clampPercentage(
  value: number,
): number {
  return Math.min(
    100,
    Math.max(0, value),
  );
}

function formatPercentage(
  value: number,
): string {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      maximumFractionDigits: 2,
    },
  ).format(value);
}

export function ResultProgressBar({
  label,
  value,
  detail,
  tone = "neutral",
}: ResultProgressBarProps) {
  const normalizedValue =
    clampPercentage(value);

  return (
    <div
      className={[
        "teacher-result-progress",
        `is-${tone}`,
      ].join(" ")}
    >
      <div className="teacher-result-progress-header">
        <div>
          <strong>{label}</strong>
          <span>{detail}</span>
        </div>

        <strong>
          {formatPercentage(value)}%
        </strong>
      </div>

      <div
        className="teacher-result-progress-track"
        role="progressbar"
        aria-label={`${label}: ${formatPercentage(
          value,
        )}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
      >
        <span
          className="teacher-result-progress-fill"
          style={{
            width: `${normalizedValue}%`,
          }}
        />
      </div>
    </div>
  );
}