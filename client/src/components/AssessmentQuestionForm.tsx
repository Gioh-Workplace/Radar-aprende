import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useRef,
  useState,
  type FormEvent,
} from "react";

import type {
  AddTeacherAssessmentQuestionInput,
  TeacherSkill,
} from "../types/teacher";
import { Button } from "./ui/Button";

interface AssessmentQuestionFormProps {
  skills: TeacherSkill[];

  onSubmit(
    input: AddTeacherAssessmentQuestionInput,
  ): Promise<boolean>;
}

interface AlternativeDraft {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionFormErrors {
  statement?: string;
  skillId?: string;
  alternatives?: string;
}

const alternativeLabels = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
] as const;

let alternativeSequence = 0;

function createAlternative(
  isCorrect = false,
): AlternativeDraft {
  alternativeSequence += 1;

  return {
    id: `alternative-${alternativeSequence}`,
    text: "",
    isCorrect,
  };
}

function createInitialAlternatives():
AlternativeDraft[] {
  return [
    createAlternative(true),
    createAlternative(),
    createAlternative(),
    createAlternative(),
  ];
}

export function AssessmentQuestionForm({
  skills,
  onSubmit,
}: AssessmentQuestionFormProps) {
  const statementRef =
    useRef<HTMLTextAreaElement | null>(
      null,
    );

  const [statement, setStatement] =
    useState("");

  const [skillId, setSkillId] =
    useState("");

  const [alternatives, setAlternatives] =
    useState<AlternativeDraft[]>(
      createInitialAlternatives,
    );

  const [errors, setErrors] =
    useState<QuestionFormErrors>({});

  const [
    invalidAlternativeIds,
    setInvalidAlternativeIds,
  ] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function handleStatementChange(
    value: string,
  ) {
    setStatement(value);

    if (errors.statement) {
      setErrors(
        (currentErrors) => ({
          ...currentErrors,
          statement: undefined,
        }),
      );
    }
  }

  function handleSkillChange(
    value: string,
  ) {
    setSkillId(value);

    if (errors.skillId) {
      setErrors(
        (currentErrors) => ({
          ...currentErrors,
          skillId: undefined,
        }),
      );
    }
  }

  function updateAlternativeText(
    alternativeId: string,
    text: string,
  ) {
    setAlternatives(
      (currentAlternatives) =>
        currentAlternatives.map(
          (alternative) =>
            alternative.id ===
            alternativeId
              ? {
                  ...alternative,
                  text,
                }
              : alternative,
        ),
    );

    if (text.trim()) {
      setInvalidAlternativeIds(
        (currentIds) =>
          currentIds.filter(
            (currentId) =>
              currentId !==
              alternativeId,
          ),
      );
    }

    if (errors.alternatives) {
      setErrors(
        (currentErrors) => ({
          ...currentErrors,
          alternatives: undefined,
        }),
      );
    }
  }

  function selectCorrectAlternative(
    alternativeId: string,
  ) {
    setAlternatives(
      (currentAlternatives) =>
        currentAlternatives.map(
          (alternative) => ({
            ...alternative,
            isCorrect:
              alternative.id ===
              alternativeId,
          }),
        ),
    );

    if (errors.alternatives) {
      setErrors(
        (currentErrors) => ({
          ...currentErrors,
          alternatives: undefined,
        }),
      );
    }
  }

  function addAlternative() {
    if (alternatives.length >= 6) {
      return;
    }

    setAlternatives(
      (currentAlternatives) => [
        ...currentAlternatives,
        createAlternative(),
      ],
    );
  }

  function removeAlternative(
    alternativeId: string,
  ) {
    if (alternatives.length <= 2) {
      return;
    }

    setInvalidAlternativeIds(
      (currentIds) =>
        currentIds.filter(
          (currentId) =>
            currentId !==
            alternativeId,
        ),
    );

    setAlternatives(
      (currentAlternatives) => {
        const removedAlternative =
          currentAlternatives.find(
            (alternative) =>
              alternative.id ===
              alternativeId,
          );

        const remainingAlternatives =
          currentAlternatives.filter(
            (alternative) =>
              alternative.id !==
              alternativeId,
          );

        if (
          removedAlternative?.isCorrect &&
          remainingAlternatives.length > 0
        ) {
          return remainingAlternatives.map(
            (alternative, index) => ({
              ...alternative,
              isCorrect: index === 0,
            }),
          );
        }

        return remainingAlternatives;
      },
    );
  }

  function validateForm(): boolean {
    const nextErrors:
      QuestionFormErrors = {};

    const emptyAlternativeIds =
      alternatives
        .filter(
          (alternative) =>
            alternative.text.trim()
              .length === 0,
        )
        .map(
          (alternative) =>
            alternative.id,
        );

    if (statement.trim().length < 3) {
      nextErrors.statement =
        "Escreva um enunciado com pelo menos 3 caracteres.";
    }

    if (!skillId) {
      nextErrors.skillId =
        "Selecione a habilidade avaliada.";
    }

    if (emptyAlternativeIds.length > 0) {
      nextErrors.alternatives =
        "Preencha o texto de todas as alternativas.";
    }

    const correctAlternativeCount =
      alternatives.filter(
        (alternative) =>
          alternative.isCorrect,
      ).length;

    if (correctAlternativeCount !== 1) {
      nextErrors.alternatives =
        "Selecione exatamente uma alternativa correta.";
    }

    setErrors(nextErrors);

    setInvalidAlternativeIds(
      emptyAlternativeIds,
    );

    return (
      Object.keys(nextErrors).length ===
      0
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const normalizedAlternatives =
      alternatives.map(
        (alternative) => ({
          text:
            alternative.text.trim(),
          isCorrect:
            alternative.isCorrect,
        }),
      );

    setIsSubmitting(true);

    try {
      const shouldReset =
        await onSubmit({
          statement:
            statement.trim(),
          skillId,
          alternatives:
            normalizedAlternatives,
        });

      if (shouldReset) {
        setStatement("");
        setSkillId("");

        setAlternatives(
          createInitialAlternatives(),
        );

        setErrors({});
        setInvalidAlternativeIds([]);

        requestAnimationFrame(() => {
          statementRef.current?.focus();
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="teacher-question-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="teacher-question-form-top">
        <div
          className={[
            "teacher-question-field",
            "is-statement",
            errors.statement
              ? "has-error"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="teacher-question-field-label-row">
            <label htmlFor="question-statement">
              Enunciado
            </label>

            <span>Obrigatório</span>
          </div>

          <textarea
            ref={statementRef}
            id="question-statement"
            name="statement"
            value={statement}
            onChange={(event) =>
              handleStatementChange(
                event.target.value,
              )
            }
            placeholder="Digite o enunciado da questão."
            minLength={3}
            maxLength={1000}
            rows={5}
            disabled={isSubmitting}
            required
            aria-invalid={
              Boolean(
                errors.statement,
              )
            }
            aria-describedby={[
              "question-statement-help",
              errors.statement
                ? "question-statement-error"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />

          <div className="teacher-question-field-meta">
            {errors.statement ? (
              <span
                id="question-statement-error"
                className="teacher-question-field-error"
                role="alert"
              >
                <AlertCircle
                  size={14}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                {errors.statement}
              </span>
            ) : (
              <span>
                Use uma linguagem clara e
                adequada à turma.
              </span>
            )}

            <span id="question-statement-help">
              {statement.length}/1000
            </span>
          </div>
        </div>

        <div
          className={[
            "teacher-question-field",
            errors.skillId
              ? "has-error"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="teacher-question-field-label-row">
            <label htmlFor="question-skill">
              Habilidade avaliada
            </label>

            <span>Obrigatório</span>
          </div>

          <select
            id="question-skill"
            name="skillId"
            value={skillId}
            onChange={(event) =>
              handleSkillChange(
                event.target.value,
              )
            }
            disabled={
              isSubmitting ||
              skills.length === 0
            }
            required
            aria-invalid={
              Boolean(errors.skillId)
            }
            aria-describedby={
              errors.skillId
                ? "question-skill-error"
                : "question-skill-help"
            }
          >
            <option value="">
              Selecione uma habilidade
            </option>

            {skills.map(
              (skill) => (
                <option
                  key={skill.id}
                  value={skill.id}
                >
                  {skill.name}
                  {" — "}
                  {skill.subject}
                </option>
              ),
            )}
          </select>

          {errors.skillId ? (
            <span
              id="question-skill-error"
              className="teacher-question-field-error"
              role="alert"
            >
              <AlertCircle
                size={14}
                strokeWidth={2}
                aria-hidden="true"
              />

              {errors.skillId}
            </span>
          ) : (
            <span
              id="question-skill-help"
              className="teacher-question-field-help"
            >
              Essa habilidade será usada
              na análise dos resultados.
            </span>
          )}
        </div>
      </div>

      <fieldset
        className={[
          "teacher-question-alternatives",
          errors.alternatives
            ? "has-error"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <legend>Alternativas</legend>

        <div className="teacher-question-alternatives-heading">
          <p>
            Escreva entre duas e seis
            opções e marque exatamente uma
            como resposta correta.
          </p>

          <span>
            {alternatives.length} de 6
          </span>
        </div>

        {errors.alternatives && (
          <div
            id="question-alternatives-error"
            className="teacher-question-alternatives-error"
            role="alert"
          >
            <AlertCircle
              size={15}
              strokeWidth={2}
              aria-hidden="true"
            />

            {errors.alternatives}
          </div>
        )}

        <div className="teacher-question-alternative-list">
          {alternatives.map(
            (alternative, index) => {
              const alternativeLabel =
                alternativeLabels[
                  index
                ] ?? `${index + 1}`;

              const isInvalid =
                invalidAlternativeIds.includes(
                  alternative.id,
                );

              const errorId =
                `${alternative.id}-error`;

              return (
                <div
                  key={alternative.id}
                  className={[
                    "teacher-question-alternative",
                    alternative.isCorrect
                      ? "is-correct"
                      : "",
                    isInvalid
                      ? "has-error"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span
                    className="teacher-question-alternative-letter"
                    aria-hidden="true"
                  >
                    {alternativeLabel}
                  </span>

                  <div className="teacher-question-alternative-input">
                    <input
                      type="text"
                      value={
                        alternative.text
                      }
                      onChange={(event) =>
                        updateAlternativeText(
                          alternative.id,
                          event.target.value,
                        )
                      }
                      aria-label={`Texto da alternativa ${alternativeLabel}`}
                      aria-invalid={
                        isInvalid
                      }
                      aria-describedby={
                        isInvalid
                          ? errorId
                          : undefined
                      }
                      placeholder={`Alternativa ${alternativeLabel}`}
                      maxLength={300}
                      disabled={
                        isSubmitting
                      }
                      required
                    />

                    {isInvalid && (
                      <span
                        id={errorId}
                        className="teacher-question-alternative-error"
                      >
                        Preencha esta
                        alternativa.
                      </span>
                    )}
                  </div>

                  <label className="teacher-question-correct-selector">
                    <input
                      type="radio"
                      name="correct-alternative"
                      checked={
                        alternative.isCorrect
                      }
                      onChange={() =>
                        selectCorrectAlternative(
                          alternative.id,
                        )
                      }
                      disabled={
                        isSubmitting
                      }
                    />

                    <span
                      className="teacher-question-correct-icon"
                      aria-hidden="true"
                    >
                      {alternative.isCorrect ? (
                        <CheckCircle2
                          size={17}
                          strokeWidth={2.1}
                        />
                      ) : (
                        <Circle
                          size={17}
                          strokeWidth={1.8}
                        />
                      )}
                    </span>

                    <span>
                      {alternative.isCorrect
                        ? "Resposta correta"
                        : "Marcar como correta"}
                    </span>
                  </label>

                  <button
                    type="button"
                    className="teacher-question-remove-alternative"
                    onClick={() =>
                      removeAlternative(
                        alternative.id,
                      )
                    }
                    disabled={
                      isSubmitting ||
                      alternatives.length <= 2
                    }
                    aria-label={`Remover alternativa ${alternativeLabel}`}
                    title={`Remover alternativa ${alternativeLabel}`}
                  >
                    <Trash2
                      size={16}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              );
            },
          )}
        </div>

        <div className="teacher-question-alternatives-footer">
          <Button
            variant="secondary"
            icon={
              <Plus
                size={16}
                strokeWidth={2}
              />
            }
            onClick={addAlternative}
            disabled={
              isSubmitting ||
              alternatives.length >= 6
            }
          >
            Adicionar alternativa
          </Button>

          <span>
            {alternatives.length >= 6
              ? "Limite de seis alternativas atingido."
              : "Mínimo de duas e máximo de seis alternativas."}
          </span>
        </div>
      </fieldset>

      <footer className="teacher-question-form-footer">
        <div className="teacher-question-form-note">
          <strong>
            Antes de adicionar
          </strong>

          <span>
            Revise o enunciado, a
            habilidade e a resposta
            marcada como correta.
          </span>
        </div>

        <Button
          type="submit"
          className="teacher-question-form-submit"
          icon={
            <CheckCircle2
              size={17}
              strokeWidth={2}
            />
          }
          disabled={
            isSubmitting ||
            skills.length === 0
          }
        >
          {isSubmitting
            ? "Adicionando..."
            : "Adicionar questão"}
        </Button>
      </footer>
    </form>
  );
}