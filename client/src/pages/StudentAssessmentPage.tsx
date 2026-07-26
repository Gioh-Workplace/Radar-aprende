import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
  } from "react";
  import {
    Link,
    useParams,
  } from "react-router";
  
  import { getErrorMessage } from "../lib/get-error-message";
  import {
    getStudentAssessment,
    getStudentSubmissionOrNull,
    submitStudentAssessment,
  } from "../services/student-api";
  import type {
    StudentAssessmentDetails,
    StudentSubmission,
  } from "../types/student";
  
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
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        dateStyle: "long",
        timeStyle: "short",
      },
    ).format(new Date(value));
  }
  
  function getResultLevel(
    score: number,
  ): {
    label: string;
    className: string;
    message: string;
  } {
    if (score >= 70) {
      return {
        label: "Bom desempenho",
        className: "is-consolidated",
        message:
          "Você demonstrou domínio da maior parte das habilidades avaliadas.",
      };
    }
  
    if (score >= 50) {
      return {
        label: "Em desenvolvimento",
        className: "is-developing",
        message:
          "Você está avançando, mas algumas habilidades ainda precisam de prática.",
      };
    }
  
    return {
      label: "Precisa de atenção",
      className: "is-critical",
      message:
        "Revise os conteúdos avaliados e peça orientação ao professor.",
    };
  }
  
  export function StudentAssessmentPage() {
    const { assessmentId } = useParams<{
      assessmentId: string;
    }>();
  
    const [assessment, setAssessment] =
      useState<StudentAssessmentDetails | null>(
        null,
      );
  
    const [submission, setSubmission] =
      useState<StudentSubmission | null>(
        null,
      );
  
    const [
      selectedAnswers,
      setSelectedAnswers,
    ] = useState<Record<string, string>>(
      {},
    );
  
    const [isLoading, setIsLoading] =
      useState(true);
  
    const [isSubmitting, setIsSubmitting] =
      useState(false);
  
    const [error, setError] =
      useState<string | null>(null);
  
    const [submissionError, setSubmissionError] =
      useState<string | null>(null);
  
    const [reloadKey, setReloadKey] =
      useState(0);
  
    useEffect(() => {
      let isCancelled = false;
  
      async function loadAssessment() {
        if (!assessmentId) {
          setError(
            "O identificador da avaliação não foi informado.",
          );
          setIsLoading(false);
          return;
        }
  
        setIsLoading(true);
        setError(null);
  
        try {
          const [
            assessmentData,
            submissionData,
          ] = await Promise.all([
            getStudentAssessment(
              assessmentId,
            ),
            getStudentSubmissionOrNull(
              assessmentId,
            ),
          ]);
  
          if (!isCancelled) {
            setAssessment(assessmentData);
            setSubmission(submissionData);
          }
        } catch (caughtError) {
          if (isCancelled) {
            return;
          }
  
          setError(
            getErrorMessage(
              caughtError,
              "Não foi possível carregar a avaliação.",
            ),
          );
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      }
  
      void loadAssessment();
  
      return () => {
        isCancelled = true;
      };
    }, [
      assessmentId,
      reloadKey,
    ]);
  
    const answeredQuestionCount =
      useMemo(
        () =>
          Object.values(
            selectedAnswers,
          ).filter(Boolean).length,
        [selectedAnswers],
      );
  
    function selectAlternative(
      questionId: string,
      alternativeId: string,
    ) {
      setSelectedAnswers(
        (currentAnswers) => ({
          ...currentAnswers,
          [questionId]: alternativeId,
        }),
      );
    }
  
    async function handleSubmit(
      event: FormEvent<HTMLFormElement>,
    ) {
      event.preventDefault();
  
      if (
        !assessmentId ||
        !assessment
      ) {
        return;
      }
  
      if (
        answeredQuestionCount !==
        assessment.questions.length
      ) {
        setSubmissionError(
          "Responda todas as questões antes de enviar.",
        );
  
        return;
      }
  
      const shouldSubmit = window.confirm(
        "Enviar esta avaliação?\n\nDepois do envio, as respostas não poderão ser alteradas.",
      );
  
      if (!shouldSubmit) {
        return;
      }
  
      setIsSubmitting(true);
      setSubmissionError(null);
  
      try {
        const createdSubmission =
          await submitStudentAssessment(
            assessmentId,
            {
              answers:
                assessment.questions.map(
                  (question) => ({
                    questionId:
                      question.id,
  
                    selectedAlternativeId:
                      selectedAnswers[
                        question.id
                      ],
                  }),
                ),
            },
          );
  
        setSubmission(createdSubmission);
  
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (caughtError) {
        setSubmissionError(
          getErrorMessage(
            caughtError,
            "Não foi possível enviar a avaliação.",
          ),
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  
    if (isLoading) {
      return (
        <>
          <Link
            to="/aluno"
            className="student-back-link"
          >
            ← Voltar para avaliações
          </Link>
  
          <section className="student-feedback">
            <strong>
              Carregando avaliação...
            </strong>
  
            <p>
              Estamos preparando suas questões.
            </p>
          </section>
        </>
      );
    }
  
    if (error || !assessment) {
      return (
        <>
          <Link
            to="/aluno"
            className="student-back-link"
          >
            ← Voltar para avaliações
          </Link>
  
          <section
            className="student-feedback is-error"
            role="alert"
          >
            <div>
              <strong>
                Não foi possível abrir
                a avaliação
              </strong>
  
              <p>
                {error ??
                  "A avaliação não foi encontrada."}
              </p>
            </div>
  
            <button
              type="button"
              onClick={() =>
                setReloadKey(
                  (currentValue) =>
                    currentValue + 1,
                )
              }
            >
              Tentar novamente
            </button>
          </section>
        </>
      );
    }
  
    if (submission) {
      const resultLevel =
        getResultLevel(
          submission.score,
        );
  
      const submissionByQuestionId =
        new Map(
          submission.answers.map(
            (answer) => [
              answer.questionId,
              answer,
            ],
          ),
        );
  
      return (
        <>
          <Link
            to="/aluno"
            className="student-back-link"
          >
            ← Voltar para avaliações
          </Link>
  
          <header className="student-page-header">
            <span>Resultado da avaliação</span>
  
            <h1>{assessment.title}</h1>
  
            <p>
              Enviada em{" "}
              {formatSubmissionDate(
                submission.submittedAt,
              )}.
            </p>
          </header>
  
          <section
            className={[
              "student-result-summary",
              resultLevel.className,
            ].join(" ")}
          >
            <div>
              <span>
                {resultLevel.label}
              </span>
  
              <strong>
                {formatScore(
                  submission.score,
                )}
                %
              </strong>
  
              <p>
                {resultLevel.message}
              </p>
            </div>
  
            <dl>
              <div>
                <dt>Acertos</dt>
  
                <dd>
                  {submission.correctAnswers}
                </dd>
              </div>
  
              <div>
                <dt>Total</dt>
  
                <dd>
                  {submission.totalQuestions}
                </dd>
              </div>
            </dl>
          </section>
  
          <section className="student-result-list">
            {assessment.questions.map(
              (question, index) => {
                const answer =
                  submissionByQuestionId.get(
                    question.id,
                  );
  
                const selectedAlternative =
                  question.alternatives.find(
                    (alternative) =>
                      alternative.id ===
                      answer
                        ?.selectedAlternativeId,
                  );
  
                return (
                  <article
                    key={question.id}
                    className={[
                      "student-result-question",
                      answer?.isCorrect
                        ? "is-correct"
                        : "is-incorrect",
                    ].join(" ")}
                  >
                    <div className="student-result-question-header">
                      <span>
                        Questão {index + 1}
                      </span>
  
                      <strong>
                        {answer?.isCorrect
                          ? "Correta"
                          : "Incorreta"}
                      </strong>
                    </div>
  
                    <h2>
                      {question.statement}
                    </h2>
  
                    <p>
                      Sua resposta:{" "}
                      <strong>
                        {selectedAlternative
                          ?.text ??
                          "Resposta indisponível"}
                      </strong>
                    </p>
                  </article>
                );
              },
            )}
          </section>
        </>
      );
    }
  
    return (
      <>
        <Link
          to="/aluno"
          className="student-back-link"
        >
          ← Voltar para avaliações
        </Link>
  
        <header className="student-page-header">
          <span>Avaliação diagnóstica</span>
  
          <h1>{assessment.title}</h1>
  
          <p>
            {assessment.description ??
              "Responda todas as questões e revise antes de enviar."}
          </p>
        </header>
  
        <section className="student-assessment-progress">
          <div>
            <strong>
              {answeredQuestionCount} de{" "}
              {assessment.questions.length}
            </strong>
  
            <span>
              questões respondidas
            </span>
          </div>
  
          <progress
            value={answeredQuestionCount}
            max={assessment.questions.length}
          />
        </section>
  
        <form
          className="student-question-form"
          onSubmit={handleSubmit}
        >
          {assessment.questions.map(
            (question, questionIndex) => (
              <fieldset
                key={question.id}
                className="student-question-card"
              >
                <legend>
                  Questão {questionIndex + 1}
                </legend>
  
                <h2>
                  {question.statement}
                </h2>
  
                <div className="student-alternative-list">
                  {question.alternatives.map(
                    (alternative, alternativeIndex) => (
                      <label
                        key={alternative.id}
                        className={[
                          "student-alternative-option",
                          selectedAnswers[
                            question.id
                          ] === alternative.id
                            ? "is-selected"
                            : "",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={alternative.id}
                          checked={
                            selectedAnswers[
                              question.id
                            ] === alternative.id
                          }
                          onChange={() =>
                            selectAlternative(
                              question.id,
                              alternative.id,
                            )
                          }
                          disabled={
                            isSubmitting
                          }
                        />
  
                        <span
                          className="student-alternative-letter"
                          aria-hidden="true"
                        >
                          {String.fromCharCode(
                            65 +
                              alternativeIndex,
                          )}
                        </span>
  
                        <span>
                          {alternative.text}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </fieldset>
            ),
          )}
  
          {submissionError && (
            <div
              className="student-inline-error"
              role="alert"
            >
              {submissionError}
            </div>
          )}
  
          <section className="student-submit-panel">
            <div>
              <strong>
                Revise antes de enviar
              </strong>
  
              <p>
                O envio é definitivo e esta
                avaliação não poderá ser
                respondida novamente.
              </p>
            </div>
  
            <button
              type="submit"
              disabled={
                isSubmitting ||
                answeredQuestionCount !==
                  assessment.questions.length
              }
            >
              {isSubmitting
                ? "Enviando..."
                : "Enviar avaliação"}
            </button>
          </section>
        </form>
      </>
    );
  }