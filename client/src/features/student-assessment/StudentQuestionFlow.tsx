import {
    BookOpenCheck,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Circle,
    ClipboardCheck,
    Send,
  } from "lucide-react";
  import {
    useMemo,
    useRef,
    useState,
    type FormEventHandler,
  } from "react";
  
  import {
    Button,
    ButtonLink,
  } from "../../components/ui/Button";
  import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
  import { FeedbackBanner } from "../../components/ui/FeedbackBanner";
  import { PageHeader } from "../../components/ui/PageHeader";
  import { PageState } from "../../components/ui/PageState";
  import { StatusBadge } from "../../components/ui/StatusBadge";
  import type {
    StudentAssessmentDetails,
  } from "../../types/student";
  
  interface StudentQuestionFlowProps {
    assessment: StudentAssessmentDetails;
    selectedAnswers: Record<
      string,
      string
    >;
    answeredQuestionCount: number;
    isSubmitting: boolean;
    submissionError: string | null;
  
    onSelect(
      questionId: string,
      alternativeId: string,
    ): void;
  
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
  
  export function StudentQuestionFlow({
    assessment,
    selectedAnswers,
    answeredQuestionCount,
    isSubmitting,
    submissionError,
    onSelect,
    onSubmit,
  }: StudentQuestionFlowProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] =
      useState(0);
  
    const [
      navigationError,
      setNavigationError,
    ] = useState<string | null>(null);
  
    const questionCardRef =
      useRef<HTMLElement | null>(null);
  
    const totalQuestions =
      assessment.questions.length;
  
    const currentQuestion =
      assessment.questions[
        currentQuestionIndex
      ];
  
    const unansweredQuestionIndexes =
      useMemo(
        () =>
          assessment.questions.reduce<
            number[]
          >(
            (
              currentIndexes,
              question,
              index,
            ) => {
              if (
                !selectedAnswers[
                  question.id
                ]
              ) {
                currentIndexes.push(index);
              }
  
              return currentIndexes;
            },
            [],
          ),
        [
          assessment.questions,
          selectedAnswers,
        ],
      );
  
    const pendingQuestionCount =
      unansweredQuestionIndexes.length;
  
    const completionPercentage =
      totalQuestions > 0
        ? Math.round(
            (answeredQuestionCount /
              totalQuestions) *
              100,
          )
        : 0;
  
    const isFirstQuestion =
      currentQuestionIndex === 0;
  
    const isLastQuestion =
      currentQuestionIndex ===
      totalQuestions - 1;
  
    const isCurrentQuestionAnswered =
      currentQuestion
        ? Boolean(
            selectedAnswers[
              currentQuestion.id
            ],
          )
        : false;
  
    function navigateToQuestion(
      questionIndex: number,
    ) {
      const safeIndex = Math.min(
        Math.max(questionIndex, 0),
        Math.max(totalQuestions - 1, 0),
      );
  
      setCurrentQuestionIndex(
        safeIndex,
      );
  
      setNavigationError(null);
  
      requestAnimationFrame(() => {
        questionCardRef.current
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
  
        questionCardRef.current
          ?.focus({
            preventScroll: true,
          });
      });
    }
  
    function handleNextQuestion() {
      if (!isCurrentQuestionAnswered) {
        setNavigationError(
          "Selecione uma alternativa antes de avançar para a próxima questão.",
        );
  
        questionCardRef.current?.focus();
        return;
      }
  
      navigateToQuestion(
        currentQuestionIndex + 1,
      );
    }
  
    function handleSelectAlternative(
      questionId: string,
      alternativeId: string,
    ) {
      onSelect(
        questionId,
        alternativeId,
      );
  
      setNavigationError(null);
    }
  
    function openFirstPendingQuestion() {
      const firstPendingIndex =
        unansweredQuestionIndexes[0];
  
      if (
        firstPendingIndex !==
        undefined
      ) {
        navigateToQuestion(
          firstPendingIndex,
        );
      }
    }
  
    if (!currentQuestion) {
      return (
        <div className="student-assessment-flow-page">
          <Breadcrumbs
            items={[
              {
                label: "Minhas avaliações",
                to: "/aluno",
              },
              {
                label: assessment.title,
              },
            ]}
          />
  
          <PageState
            icon={ClipboardCheck}
            title="Nenhuma questão disponível"
            description="Esta avaliação não possui questões disponíveis para resposta."
            tone="primary"
            action={
              <ButtonLink
                to="/aluno"
                variant="secondary"
              >
                Voltar às avaliações
              </ButtonLink>
            }
          />
        </div>
      );
    }
  
    return (
      <div className="student-assessment-flow-page">
        <Breadcrumbs
          items={[
            {
              label: "Minhas avaliações",
              to: "/aluno",
            },
            {
              label: assessment.title,
            },
          ]}
        />
  
        <PageHeader
          eyebrow="Avaliação diagnóstica"
          title={assessment.title}
          description={
            assessment.description ??
            "Responda cada questão com atenção e revise suas escolhas antes de enviar."
          }
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
          className="student-assessment-flow-progress"
          aria-label="Progresso da avaliação"
        >
          <div className="student-assessment-flow-progress-header">
            <div>
              <span>
                Progresso da avaliação
              </span>
  
              <strong>
                {answeredQuestionCount} de{" "}
                {totalQuestions}
              </strong>
            </div>
  
            <span aria-live="polite">
              {completionPercentage}%
            </span>
          </div>
  
          <div
            className="student-assessment-flow-progress-track"
            role="progressbar"
            aria-label="Questões respondidas"
            aria-valuemin={0}
            aria-valuemax={
              totalQuestions
            }
            aria-valuenow={
              answeredQuestionCount
            }
            aria-valuetext={`${answeredQuestionCount} de ${totalQuestions} questões respondidas`}
          >
            <span
              style={{
                width: `${completionPercentage}%`,
              }}
            />
          </div>
  
          <p>
            Você pode voltar às questões
            anteriores e alterar suas
            respostas antes do envio.
          </p>
        </section>
  
        <form
          className="student-assessment-flow-form"
          onSubmit={onSubmit}
        >
          <div className="student-assessment-flow-layout">
            <main className="student-assessment-flow-main">
              {navigationError && (
                <FeedbackBanner
                  tone="error"
                  title="Escolha uma resposta"
                  description={
                    navigationError
                  }
                />
              )}
  
              {submissionError && (
                <FeedbackBanner
                  tone="error"
                  title="Não foi possível enviar a avaliação"
                  description={
                    submissionError
                  }
                />
              )}
  
              <article
                ref={questionCardRef}
                className="student-assessment-flow-question"
                tabIndex={-1}
              >
                <header className="student-assessment-flow-question-header">
                  <div>
                    <span>
                      Questão{" "}
                      {currentQuestionIndex +
                        1}
                    </span>
  
                    <strong>
                      de {totalQuestions}
                    </strong>
                  </div>
  
                  <StatusBadge
                    tone={
                      isCurrentQuestionAnswered
                        ? "success"
                        : "warning"
                    }
                  >
                    {isCurrentQuestionAnswered
                      ? "Respondida"
                      : "Pendente"}
                  </StatusBadge>
                </header>
  
                <h2>
                  {currentQuestion.statement}
                </h2>
  
                <fieldset className="student-assessment-flow-alternatives">
                  <legend>
                    Selecione uma alternativa
                  </legend>
  
                  <div
                    className="student-assessment-flow-alternative-list"
                    role="radiogroup"
                    aria-label={`Alternativas da questão ${
                      currentQuestionIndex +
                      1
                    }`}
                  >
                    {currentQuestion.alternatives.map(
                      (
                        alternative,
                        alternativeIndex,
                      ) => {
                        const isSelected =
                          selectedAnswers[
                            currentQuestion.id
                          ] ===
                          alternative.id;
  
                        const alternativeLabel =
                          alternativeLabels[
                            alternativeIndex
                          ] ??
                          String(
                            alternativeIndex +
                              1,
                          );
  
                        return (
                          <label
                            key={
                              alternative.id
                            }
                            className={[
                              "student-assessment-flow-alternative",
                              isSelected
                                ? "is-selected"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion.id}`}
                              value={
                                alternative.id
                              }
                              checked={
                                isSelected
                              }
                              onChange={() =>
                                handleSelectAlternative(
                                  currentQuestion.id,
                                  alternative.id,
                                )
                              }
                              disabled={
                                isSubmitting
                              }
                            />
  
                            <span
                              className="student-assessment-flow-alternative-letter"
                              aria-hidden="true"
                            >
                              {
                                alternativeLabel
                              }
                            </span>
  
                            <span className="student-assessment-flow-alternative-text">
                              {
                                alternative.text
                              }
                            </span>
  
                            <span
                              className="student-assessment-flow-alternative-icon"
                              aria-hidden="true"
                            >
                              {isSelected ? (
                                <CheckCircle2
                                  size={20}
                                  strokeWidth={2}
                                />
                              ) : (
                                <Circle
                                  size={20}
                                  strokeWidth={1.8}
                                />
                              )}
                            </span>
                          </label>
                        );
                      },
                    )}
                  </div>
                </fieldset>
              </article>
  
              <footer className="student-assessment-flow-navigation">
                <Button
                  variant="secondary"
                  icon={
                    <ChevronLeft
                      size={17}
                      strokeWidth={2}
                    />
                  }
                  disabled={
                    isFirstQuestion ||
                    isSubmitting
                  }
                  onClick={() =>
                    navigateToQuestion(
                      currentQuestionIndex -
                        1,
                    )
                  }
                >
                  Anterior
                </Button>
  
                <span>
                  Questão{" "}
                  {currentQuestionIndex + 1}{" "}
                  de {totalQuestions}
                </span>
  
                {!isLastQuestion ? (
                  <Button
                    icon={
                      <ChevronRight
                        size={17}
                        strokeWidth={2}
                      />
                    }
                    disabled={
                      isSubmitting
                    }
                    onClick={
                      handleNextQuestion
                    }
                  >
                    Próxima
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    icon={
                      <Send
                        size={17}
                        strokeWidth={1.9}
                      />
                    }
                    disabled={
                      isSubmitting ||
                      pendingQuestionCount >
                        0
                    }
                  >
                    {isSubmitting
                      ? "Enviando..."
                      : "Enviar avaliação"}
                  </Button>
                )}
              </footer>
  
              {isLastQuestion &&
                pendingQuestionCount > 0 && (
                <section className="student-assessment-flow-pending">
                  <div>
                    <strong>
                      Ainda existem questões
                      pendentes
                    </strong>
  
                    <p>
                      {pendingQuestionCount}{" "}
                      {pendingQuestionCount ===
                      1
                        ? "questão ainda não foi respondida."
                        : "questões ainda não foram respondidas."}
                    </p>
                  </div>
  
                  <Button
                    variant="secondary"
                    onClick={
                      openFirstPendingQuestion
                    }
                  >
                    Ir para a primeira
                    pendente
                  </Button>
                </section>
              )}
            </main>
  
            <aside className="student-assessment-flow-sidebar">
              <section className="student-assessment-flow-navigator">
                <div className="student-assessment-flow-sidebar-header">
                  <h2>Questões</h2>
  
                  <p>
                    Acesse uma questão para
                    revisar ou completar a
                    resposta.
                  </p>
                </div>
  
                <nav
                  className="student-assessment-flow-question-grid"
                  aria-label="Navegação entre questões"
                >
                  {assessment.questions.map(
                    (question, index) => {
                      const isAnswered =
                        Boolean(
                          selectedAnswers[
                            question.id
                          ],
                        );
  
                      const isCurrent =
                        index ===
                        currentQuestionIndex;
  
                      return (
                        <button
                          key={question.id}
                          type="button"
                          className={[
                            "student-assessment-flow-question-button",
                            isAnswered
                              ? "is-answered"
                              : "",
                            isCurrent
                              ? "is-current"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-current={
                            isCurrent
                              ? "step"
                              : undefined
                          }
                          aria-label={`Questão ${
                            index + 1
                          }${
                            isAnswered
                              ? ", respondida"
                              : ", pendente"
                          }`}
                          onClick={() =>
                            navigateToQuestion(
                              index,
                            )
                          }
                          disabled={
                            isSubmitting
                          }
                        >
                          {isAnswered ? (
                            <CheckCircle2
                              size={17}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          ) : (
                            <span>
                              {index + 1}
                            </span>
                          )}
                        </button>
                      );
                    },
                  )}
                </nav>
              </section>
  
              <section className="student-assessment-flow-summary">
                <ClipboardCheck
                  size={20}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
  
                <div>
                  <span>
                    Resumo das respostas
                  </span>
  
                  <strong>
                    {answeredQuestionCount}{" "}
                    respondidas
                  </strong>
  
                  <p>
                    {pendingQuestionCount ===
                    0
                      ? "Todas as questões foram respondidas."
                      : `${pendingQuestionCount} ${
                          pendingQuestionCount ===
                          1
                            ? "questão pendente"
                            : "questões pendentes"
                        }.`}
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </form>
      </div>
    );
  }