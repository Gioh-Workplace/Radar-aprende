import {
    AlertTriangle,
    CheckCircle2,
    ClipboardCheck,
    PencilLine,
    Send,
    ShieldCheck,
  } from "lucide-react";
  import type {
    FormEventHandler,
  } from "react";
  
  import { Button } from "../../components/ui/Button";
  import { FeedbackBanner } from "../../components/ui/FeedbackBanner";
  import { StatusBadge } from "../../components/ui/StatusBadge";
  import type {
    StudentAssessmentDetails,
  } from "../../types/student";
  
  interface StudentAssessmentReviewProps {
    assessment: StudentAssessmentDetails;
  
    selectedAnswers: Record<
      string,
      string
    >;
  
    isSubmitting: boolean;
    submissionError: string | null;
  
    onEditQuestion(
      questionIndex: number,
    ): void;
  
    onBack(): void;
  
    onSubmit:
      FormEventHandler<HTMLFormElement>;
  }
  
  const alternativeLabels = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
  ];
  
  export function StudentAssessmentReview({
    assessment,
    selectedAnswers,
    isSubmitting,
    submissionError,
    onEditQuestion,
    onBack,
    onSubmit,
  }: StudentAssessmentReviewProps) {
    return (
      <form
        className="student-assessment-review"
        onSubmit={onSubmit}
      >
        <div className="student-assessment-review-layout">
          <main className="student-assessment-review-main">
            {submissionError && (
              <FeedbackBanner
                tone="error"
                title="Não foi possível enviar a avaliação"
                description={submissionError}
              />
            )}
  
            <section className="student-assessment-review-panel">
              <header className="student-assessment-review-header">
                <span
                  className="student-assessment-review-icon"
                  aria-hidden="true"
                >
                  <ClipboardCheck
                    size={22}
                    strokeWidth={1.9}
                  />
                </span>
  
                <div>
                  <span>Revisão final</span>
  
                  <h2>
                    Confira suas respostas
                  </h2>
  
                  <p>
                    Você ainda pode voltar e
                    alterar qualquer resposta
                    antes do envio definitivo.
                  </p>
                </div>
              </header>
  
              <div className="student-assessment-review-list">
                {assessment.questions.map(
                  (
                    question,
                    questionIndex,
                  ) => {
                    const selectedAlternativeId =
                      selectedAnswers[
                        question.id
                      ];
  
                    const selectedAlternativeIndex =
                      question.alternatives.findIndex(
                        (alternative) =>
                          alternative.id ===
                          selectedAlternativeId,
                      );
  
                    const selectedAlternative =
                      question.alternatives[
                        selectedAlternativeIndex
                      ];
  
                    const alternativeLabel =
                      alternativeLabels[
                        selectedAlternativeIndex
                      ] ?? "—";
  
                    return (
                      <article
                        key={question.id}
                        className="student-assessment-review-card"
                      >
                        <header>
                          <div>
                            <span>
                              Questão{" "}
                              {questionIndex + 1}
                            </span>
  
                            <StatusBadge tone="success">
                              Respondida
                            </StatusBadge>
                          </div>
  
                          <Button
                            variant="ghost"
                            icon={
                              <PencilLine
                                size={15}
                                strokeWidth={1.9}
                              />
                            }
                            onClick={() =>
                              onEditQuestion(
                                questionIndex,
                              )
                            }
                            disabled={
                              isSubmitting
                            }
                          >
                            Editar
                          </Button>
                        </header>
  
                        <h3>
                          {question.statement}
                        </h3>
  
                        <div className="student-assessment-review-answer">
                          <span aria-hidden="true">
                            {alternativeLabel}
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
  
                          <CheckCircle2
                            size={18}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            </section>
          </main>
  
          <aside className="student-assessment-review-sidebar">
            <section className="student-assessment-review-confirmation">
              <ShieldCheck
                size={23}
                strokeWidth={1.9}
                aria-hidden="true"
              />
  
              <div>
                <span>
                  Pronto para enviar
                </span>
  
                <h2>
                  Todas as questões foram
                  respondidas
                </h2>
  
                <p>
                  A avaliação possui{" "}
                  {assessment.questions.length}{" "}
                  {assessment.questions
                    .length === 1
                    ? "questão"
                    : "questões"}.
                </p>
              </div>
  
              <ul>
                <li>
                  <CheckCircle2
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
  
                  Todas as questões possuem
                  resposta.
                </li>
  
                <li>
                  <CheckCircle2
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
  
                  As escolhas ainda podem ser
                  revisadas.
                </li>
              </ul>
  
              <div className="student-assessment-review-warning">
                <AlertTriangle
                  size={16}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
  
                <span>
                  Depois do envio, as
                  respostas não poderão ser
                  alteradas.
                </span>
              </div>
  
              <Button
                type="submit"
                icon={
                  <Send
                    size={17}
                    strokeWidth={1.9}
                  />
                }
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Enviando..."
                  : "Confirmar e enviar"}
              </Button>
  
              <Button
                variant="secondary"
                onClick={onBack}
                disabled={isSubmitting}
              >
                Voltar às questões
              </Button>
            </section>
          </aside>
        </div>
      </form>
    );
  }