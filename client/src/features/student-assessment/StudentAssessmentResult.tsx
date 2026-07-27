import {
    Award,
    BookOpenCheck,
    CheckCircle2,
    ClipboardCheck,
    Lightbulb,
    Target,
    XCircle,
  } from "lucide-react";
  
  import { ButtonLink } from "../../components/ui/Button";
  import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
  import { PageHeader } from "../../components/ui/PageHeader";
  import {
    StatusBadge,
    type StatusBadgeTone,
  } from "../../components/ui/StatusBadge";
  import type {
    StudentAssessmentDetails,
    StudentSubmission,
  } from "../../types/student";
  
  interface StudentAssessmentResultProps {
    assessment: StudentAssessmentDetails;
    submission: StudentSubmission;
  }
  
  interface ResultPresentation {
    label: string;
    message: string;
    recommendation: string;
    tone: StatusBadgeTone;
    className: string;
  }
  
  function formatScore(
    score: number,
  ): string {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        maximumFractionDigits: 2,
      },
    ).format(score);
  }
  
  function formatSubmissionDate(
    value: string,
  ): string {
    const date = new Date(value);
  
    if (Number.isNaN(date.getTime())) {
      return "Data indisponível";
    }
  
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        dateStyle: "long",
        timeStyle: "short",
      },
    ).format(date);
  }
  
  function getResultPresentation(
    score: number,
  ): ResultPresentation {
    if (score >= 70) {
      return {
        label: "Bom desempenho",
        message:
          "Você demonstrou domínio da maior parte das habilidades avaliadas.",
        recommendation:
          "Continue praticando para consolidar ainda mais o aprendizado.",
        tone: "success",
        className: "is-consolidated",
      };
    }
  
    if (score >= 50) {
      return {
        label: "Em desenvolvimento",
        message:
          "Você está avançando, mas algumas habilidades ainda precisam de prática.",
        recommendation:
          "Revise as questões incorretas e retome os conteúdos relacionados.",
        tone: "warning",
        className: "is-developing",
      };
    }
  
    return {
      label: "Precisa de atenção",
      message:
        "Algumas habilidades importantes ainda precisam ser fortalecidas.",
      recommendation:
        "Converse com seu professor e revise os conteúdos desta avaliação.",
      tone: "danger",
      className: "is-critical",
    };
  }
  
  export function StudentAssessmentResult({
    assessment,
    submission,
  }: StudentAssessmentResultProps) {
    const presentation =
      getResultPresentation(
        submission.score,
      );
  
    const incorrectAnswers =
      submission.totalQuestions -
      submission.correctAnswers;
  
    const submissionByQuestionId =
      new Map(
        submission.answers.map(
          (answer) => [
            answer.questionId,
            answer,
          ],
        ),
      );
  
    const normalizedScore = Math.min(
      100,
      Math.max(0, submission.score),
    );
  
    return (
      <div className="student-assessment-result-page">
        <Breadcrumbs
          items={[
            {
              label: "Minhas avaliações",
              to: "/aluno",
            },
            {
              label: assessment.title,
            },
            {
              label: "Resultado",
            },
          ]}
        />
  
        <PageHeader
          eyebrow="Avaliação concluída"
          title={assessment.title}
          description={`Enviada em ${formatSubmissionDate(
            submission.submittedAt,
          )}.`}
          actions={
            <ButtonLink
              to="/aluno"
              variant="secondary"
              icon={
                <BookOpenCheck
                  size={16}
                  strokeWidth={1.9}
                />
              }
            >
              Minhas avaliações
            </ButtonLink>
          }
        />
  
        <section
          className={[
            "student-assessment-result-hero",
            presentation.className,
          ].join(" ")}
        >
          <div className="student-assessment-result-copy">
            <StatusBadge
              tone={presentation.tone}
            >
              {presentation.label}
            </StatusBadge>
  
            <h2>
              Avaliação enviada com sucesso
            </h2>
  
            <p>
              {presentation.message}
            </p>
  
            <div className="student-assessment-result-recommendation">
              <Lightbulb
                size={17}
                strokeWidth={1.9}
                aria-hidden="true"
              />
  
              <span>
                {presentation.recommendation}
              </span>
            </div>
          </div>
  
          <div className="student-assessment-result-score">
            <span>Resultado</span>
  
            <strong>
              {formatScore(
                submission.score,
              )}
              %
            </strong>
  
            <div
              className="student-assessment-result-score-track"
              role="progressbar"
              aria-label="Resultado da avaliação"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                normalizedScore
              }
            >
              <span
                style={{
                  width: `${normalizedScore}%`,
                }}
              />
            </div>
          </div>
        </section>
  
        <section
          className="student-assessment-result-metrics"
          aria-label="Resumo do resultado"
        >
          <article>
            <span
              className="is-success"
              aria-hidden="true"
            >
              <CheckCircle2
                size={20}
                strokeWidth={1.9}
              />
            </span>
  
            <div>
              <small>Acertos</small>
  
              <strong>
                {submission.correctAnswers}
              </strong>
            </div>
          </article>
  
          <article>
            <span
              className="is-danger"
              aria-hidden="true"
            >
              <XCircle
                size={20}
                strokeWidth={1.9}
              />
            </span>
  
            <div>
              <small>Incorretas</small>
  
              <strong>
                {incorrectAnswers}
              </strong>
            </div>
          </article>
  
          <article>
            <span
              className="is-primary"
              aria-hidden="true"
            >
              <ClipboardCheck
                size={20}
                strokeWidth={1.9}
              />
            </span>
  
            <div>
              <small>Total</small>
  
              <strong>
                {submission.totalQuestions}
              </strong>
            </div>
          </article>
        </section>
  
        <section className="student-assessment-result-panel">
          <header className="student-assessment-result-panel-header">
            <div>
              <span
                aria-hidden="true"
                className="student-assessment-result-panel-icon"
              >
                <Target
                  size={20}
                  strokeWidth={1.9}
                />
              </span>
  
              <div>
                <h2>
                  Revisão das respostas
                </h2>
  
                <p>
                  Consulte a resposta
                  selecionada em cada questão.
                </p>
              </div>
            </div>
  
            <span>
              {submission.correctAnswers} de{" "}
              {submission.totalQuestions}{" "}
              corretas
            </span>
          </header>
  
          <div className="student-assessment-result-list">
            {assessment.questions.map(
              (
                question,
                questionIndex,
              ) => {
                const answer =
                  submissionByQuestionId.get(
                    question.id,
                  );
  
                const selectedAlternativeIndex =
                  question.alternatives.findIndex(
                    (alternative) =>
                      alternative.id ===
                      answer
                        ?.selectedAlternativeId,
                  );
  
                const selectedAlternative =
                  question.alternatives[
                    selectedAlternativeIndex
                  ];
  
                const alternativeLabel =
                  String.fromCharCode(
                    65 +
                      Math.max(
                        selectedAlternativeIndex,
                        0,
                      ),
                  );
  
                const isCorrect =
                  answer?.isCorrect === true;
  
                return (
                  <article
                    key={question.id}
                    className={[
                      "student-assessment-result-question",
                      isCorrect
                        ? "is-correct"
                        : "is-incorrect",
                    ].join(" ")}
                  >
                    <header>
                      <span>
                        Questão{" "}
                        {questionIndex + 1}
                      </span>
  
                      <StatusBadge
                        tone={
                          isCorrect
                            ? "success"
                            : "danger"
                        }
                      >
                        {isCorrect
                          ? "Correta"
                          : "Incorreta"}
                      </StatusBadge>
                    </header>
  
                    <h3>
                      {question.statement}
                    </h3>
  
                    <div className="student-assessment-result-answer">
                      <span aria-hidden="true">
                        {selectedAlternative
                          ? alternativeLabel
                          : "—"}
                      </span>
  
                      <div>
                        <small>
                          Sua resposta
                        </small>
  
                        <strong>
                          {selectedAlternative
                            ?.text ??
                            "Resposta indisponível"}
                        </strong>
                      </div>
  
                      {isCorrect ? (
                        <CheckCircle2
                          size={19}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      ) : (
                        <XCircle
                          size={19}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </article>
                );
              },
            )}
          </div>
        </section>
  
        <section className="student-assessment-result-next">
          <Award
            size={24}
            strokeWidth={1.8}
            aria-hidden="true"
          />
  
          <div>
            <h2>Continue aprendendo</h2>
  
            <p>
              Seu professor poderá usar este
              resultado para planejar as
              próximas atividades da turma.
            </p>
          </div>
  
          <ButtonLink
            to="/aluno"
            icon={
              <BookOpenCheck
                size={16}
                strokeWidth={1.9}
              />
            }
          >
            Voltar às avaliações
          </ButtonLink>
        </section>
      </div>
    );
  }