import {
    CheckCircle2,
    Target,
    Trash2,
  } from "lucide-react";
  
  import { Button } from "../../components/ui/Button";
  import type {
    TeacherAssessmentQuestion,
    TeacherSkill,
  } from "../../types/teacher";
  
  interface AssessmentQuestionCardProps {
    question: TeacherAssessmentQuestion;
    questionNumber: number;
    skill?: TeacherSkill;
    canEdit: boolean;
    isRemoving: boolean;
  
    onRemove(): void;
  }
  
  const alternativeLabels = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
  ];
  
  export function AssessmentQuestionCard({
    question,
    questionNumber,
    skill,
    canEdit,
    isRemoving,
    onRemove,
  }: AssessmentQuestionCardProps) {
    return (
      <article className="assessment-builder-question-card">
        <header className="assessment-builder-question-header">
          <div>
            <span className="assessment-builder-question-number">
              Questão {questionNumber}
            </span>
  
            <span className="assessment-builder-question-skill">
              <Target
                size={14}
                strokeWidth={1.9}
                aria-hidden="true"
              />
  
              {skill?.name ??
                "Habilidade indisponível"}
            </span>
          </div>
  
          {canEdit && (
            <Button
              variant="danger"
              className="assessment-builder-remove-question"
              icon={
                <Trash2
                  size={15}
                  strokeWidth={1.9}
                />
              }
              disabled={isRemoving}
              onClick={onRemove}
            >
              {isRemoving
                ? "Removendo..."
                : "Remover"}
            </Button>
          )}
        </header>
  
        {skill?.subject && (
          <span className="assessment-builder-question-subject">
            {skill.subject}
          </span>
        )}
  
        <h3>{question.statement}</h3>
  
        <ol className="assessment-builder-alternatives">
          {question.alternatives.map(
            (alternative, index) => (
              <li
                key={alternative.id}
                className={
                  alternative.isCorrect
                    ? "is-correct"
                    : ""
                }
              >
                <span className="assessment-builder-alternative-letter">
                  {alternativeLabels[index] ??
                    index + 1}
                </span>
  
                <span className="assessment-builder-alternative-text">
                  {alternative.text}
                </span>
  
                {alternative.isCorrect && (
                  <span className="assessment-builder-correct-label">
                    <CheckCircle2
                      size={15}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
  
                    Correta
                  </span>
                )}
              </li>
            ),
          )}
        </ol>
      </article>
    );
  }