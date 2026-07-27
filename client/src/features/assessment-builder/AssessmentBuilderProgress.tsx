import {
    Check,
    Circle,
  } from "lucide-react";
  
  import type {
    AssessmentStatus,
  } from "../../types/teacher";
  
  interface AssessmentBuilderProgressProps {
    status: AssessmentStatus;
    questionCount: number;
  }
  
  type StepState =
    | "complete"
    | "current"
    | "upcoming";
  
  interface ProgressStep {
    label: string;
    description: string;
    state: StepState;
  }
  
  export function AssessmentBuilderProgress({
    status,
    questionCount,
  }: AssessmentBuilderProgressProps) {
    const isPublished =
      status !== "DRAFT";
  
    const hasQuestions =
      questionCount > 0;
  
    const steps: ProgressStep[] = [
      {
        label: "Informações",
        description:
          "Título, descrição e turma definidos.",
        state: "complete",
      },
      {
        label: "Questões",
        description: hasQuestions
          ? `${questionCount} ${
              questionCount === 1
                ? "questão cadastrada"
                : "questões cadastradas"
            }.`
          : "Adicione pelo menos uma questão.",
        state:
          hasQuestions || isPublished
            ? "complete"
            : "current",
      },
      {
        label: "Publicação",
        description: isPublished
          ? "Avaliação disponível para acompanhamento."
          : hasQuestions
            ? "Pronta para revisão e publicação."
            : "Disponível após cadastrar questões.",
        state: isPublished
          ? "complete"
          : hasQuestions
            ? "current"
            : "upcoming",
      },
    ];
  
    return (
      <section className="assessment-builder-progress">
        <div className="assessment-builder-sidebar-header">
          <h2>
            Progresso da avaliação
          </h2>
  
          <p>
            Revise cada etapa antes de
            disponibilizar o diagnóstico.
          </p>
        </div>
  
        <ol>
          {steps.map(
            (step, index) => (
              <li
                key={step.label}
                className={`is-${step.state}`}
                aria-current={
                  step.state === "current"
                    ? "step"
                    : undefined
                }
              >
                <span
                  className="assessment-builder-step-icon"
                  aria-hidden="true"
                >
                  {step.state ===
                  "complete" ? (
                    <Check
                      size={15}
                      strokeWidth={2.2}
                    />
                  ) : (
                    <Circle
                      size={14}
                      strokeWidth={2}
                    />
                  )}
                </span>
  
                <div>
                  <strong>
                    {index + 1}. {step.label}
                  </strong>
  
                  <p>{step.description}</p>
                </div>
              </li>
            ),
          )}
        </ol>
      </section>
    );
  }