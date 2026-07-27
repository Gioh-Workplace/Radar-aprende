import {
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useParams } from "react-router";

import { Button } from "../components/ui/Button";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { PageState } from "../components/ui/PageState";
import { StudentAssessmentResult } from "../features/student-assessment/StudentAssessmentResult";
import { StudentQuestionFlow } from "../features/student-assessment/StudentQuestionFlow";
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

import "../styles/student-assessment-flow.css";
import "../styles/student-assessment-result.css";

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

  const [
    submissionError,
    setSubmissionError,
  ] = useState<string | null>(null);

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
      setSubmissionError(null);
      setSelectedAnswers({});

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

        if (isCancelled) {
          return;
        }

        setAssessment(
          assessmentData,
        );

        setSubmission(
          submissionData,
        );
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setAssessment(null);

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
        [questionId]:
          alternativeId,
      }),
    );

    setSubmissionError(null);
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

      setSubmission(
        createdSubmission,
      );

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
      <div className="student-assessment-flow-page">
        <Breadcrumbs
          items={[
            {
              label: "Minhas avaliações",
              to: "/aluno",
            },
            {
              label: "Carregando",
            },
          ]}
        />

        <PageState
          icon={LoaderCircle}
          title="Carregando avaliação"
          description="Estamos preparando as questões e verificando seu progresso."
          tone="primary"
          isLoading
        />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="student-assessment-flow-page">
        <Breadcrumbs
          items={[
            {
              label: "Minhas avaliações",
              to: "/aluno",
            },
            {
              label: "Avaliação indisponível",
            },
          ]}
        />

        <FeedbackBanner
          tone="error"
          title="Não foi possível abrir a avaliação"
          description={
            error ??
            "A avaliação não foi encontrada."
          }
          action={
            <Button
              variant="secondary"
              icon={
                <RefreshCw
                  size={16}
                  strokeWidth={1.9}
                />
              }
              onClick={() =>
                setReloadKey(
                  (currentValue) =>
                    currentValue + 1,
                )
              }
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  if (submission) {
    return (
      <StudentAssessmentResult
        assessment={assessment}
        submission={submission}
      />
    );
  }

  return (
    <StudentQuestionFlow
      assessment={assessment}
      selectedAnswers={
        selectedAnswers
      }
      answeredQuestionCount={
        answeredQuestionCount
      }
      isSubmitting={isSubmitting}
      submissionError={
        submissionError
      }
      onSelect={selectAlternative}
      onSubmit={handleSubmit}
    />
  );
}