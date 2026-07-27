import type {
    StatusBadgeTone,
  } from "../../components/ui/StatusBadge";
  import { StatusBadge } from "../../components/ui/StatusBadge";
  import type {
    TeacherStudentAssessmentResult,
  } from "../../types/teacher";
  
  interface StudentResultCardProps {
    student: TeacherStudentAssessmentResult;
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
  
  function formatSubmissionDate(
    value: string | null,
  ): string {
    if (!value) {
      return "Aguardando envio";
    }
  
    const date = new Date(value);
  
    if (Number.isNaN(date.getTime())) {
      return "Data indisponível";
    }
  
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(date);
  }
  
  function getScoreTone(
    score: number | null,
  ): StatusBadgeTone {
    if (score === null) {
      return "neutral";
    }
  
    if (score < 50) {
      return "danger";
    }
  
    if (score < 70) {
      return "warning";
    }
  
    return "success";
  }
  
  export function StudentResultCard({
    student,
  }: StudentResultCardProps) {
    const hasSubmitted =
      student.status === "SUBMITTED";
  
    return (
      <article className="teacher-results-student-card">
        <header className="teacher-results-student-card-header">
          <div className="teacher-results-student-card-identity">
            <span
              className="teacher-results-student-avatar"
              aria-hidden="true"
            >
              {student.name
                .charAt(0)
                .toUpperCase()}
            </span>
  
            <div>
              <strong>{student.name}</strong>
  
              <span>
                {student.registration
                  ? `Matrícula ${student.registration}`
                  : "Matrícula não informada"}
              </span>
            </div>
          </div>
  
          <StatusBadge
            tone={
              hasSubmitted
                ? "success"
                : "warning"
            }
          >
            {hasSubmitted
              ? "Respondida"
              : "Pendente"}
          </StatusBadge>
        </header>
  
        <dl className="teacher-results-student-card-metrics">
          <div>
            <dt>Acertos</dt>
  
            <dd>
              {student.correctAnswers ===
              null
                ? "—"
                : `${student.correctAnswers}/${student.totalQuestions}`}
            </dd>
          </div>
  
          <div>
            <dt>Resultado</dt>
  
            <dd>
              <StatusBadge
                tone={getScoreTone(
                  student.score,
                )}
              >
                {student.score === null
                  ? "Sem resultado"
                  : `${formatPercentage(
                      student.score,
                    )}%`}
              </StatusBadge>
            </dd>
          </div>
  
          <div className="is-wide">
            <dt>Envio</dt>
  
            <dd>
              {formatSubmissionDate(
                student.submittedAt,
              )}
            </dd>
          </div>
        </dl>
      </article>
    );
  }