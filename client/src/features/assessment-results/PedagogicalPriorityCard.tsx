import {
    AlertTriangle,
    CheckCircle2,
    CircleDashed,
    Gauge,
  } from "lucide-react";
  
  import {
    StatusBadge,
    type StatusBadgeTone,
  } from "../../components/ui/StatusBadge";
  import type {
    SkillPerformanceLevel,
    TeacherPedagogicalRecommendation,
  } from "../../types/teacher";
  
  interface PedagogicalPriorityCardProps {
    recommendation:
      TeacherPedagogicalRecommendation;
  }
  
  interface LevelPresentation {
    label: string;
    tone: StatusBadgeTone;
  }
  
  function getLevelPresentation(
    level: SkillPerformanceLevel,
  ): LevelPresentation {
    const presentations: Record<
      SkillPerformanceLevel,
      LevelPresentation
    > = {
      CRITICAL: {
        label: "Intervenção prioritária",
        tone: "danger",
      },
  
      DEVELOPING: {
        label: "Reforço recomendado",
        tone: "warning",
      },
  
      CONSOLIDATED: {
        label: "Habilidade consolidada",
        tone: "success",
      },
  
      NO_DATA: {
        label: "Sem dados suficientes",
        tone: "neutral",
      },
    };
  
    return presentations[level];
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
  
  export function PedagogicalPriorityCard({
    recommendation,
  }: PedagogicalPriorityCardProps) {
    const presentation =
      getLevelPresentation(
        recommendation.level,
      );
  
    const LevelIcon =
      recommendation.level === "CRITICAL"
        ? AlertTriangle
        : recommendation.level ===
            "DEVELOPING"
          ? Gauge
          : recommendation.level ===
              "CONSOLIDATED"
            ? CheckCircle2
            : CircleDashed;
  
    return (
      <article
        className={[
          "assessment-results-priority-card",
          `is-${recommendation.level.toLowerCase()}`,
        ].join(" ")}
      >
        <header className="assessment-results-priority-header">
          <span className="assessment-results-priority-number">
            Prioridade{" "}
            {recommendation.priority}
          </span>
  
          <StatusBadge
            tone={presentation.tone}
          >
            {presentation.label}
          </StatusBadge>
        </header>
  
        <div className="assessment-results-priority-skill">
          <LevelIcon
            size={19}
            strokeWidth={1.9}
            aria-hidden="true"
          />
  
          <div>
            <span>Habilidade</span>
  
            <strong>
              {recommendation.skillName}
            </strong>
          </div>
  
          <strong className="assessment-results-priority-score">
            {formatPercentage(
              recommendation.accuracyRate,
            )}
            %
          </strong>
        </div>
  
        <h3>{recommendation.title}</h3>
  
        <p>{recommendation.description}</p>
  
        {recommendation.actions.length >
          0 && (
          <div className="assessment-results-priority-actions">
            <strong>Ações sugeridas</strong>
  
            <ul>
              {recommendation.actions.map(
                (action) => (
                  <li key={action}>
                    {action}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </article>
    );
  }