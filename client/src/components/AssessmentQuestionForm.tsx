import {
    useState,
    type FormEvent,
  } from "react";
  
  import type {
    AddTeacherAssessmentQuestionInput,
    TeacherSkill,
  } from "../types/teacher";
  
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
    const [statement, setStatement] =
      useState("");
  
    const [skillId, setSkillId] =
      useState("");
  
    const [alternatives, setAlternatives] =
      useState<AlternativeDraft[]>(
        createInitialAlternatives,
      );
  
    const [validationError, setValidationError] =
      useState<string | null>(null);
  
    const [isSubmitting, setIsSubmitting] =
      useState(false);
  
    function updateAlternativeText(
      alternativeId: string,
      text: string,
    ) {
      setAlternatives(
        (currentAlternatives) =>
          currentAlternatives.map(
            (alternative) =>
              alternative.id === alternativeId
                ? {
                    ...alternative,
                    text,
                  }
                : alternative,
          ),
      );
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
  
    async function handleSubmit(
      event: FormEvent<HTMLFormElement>,
    ) {
      event.preventDefault();
  
      setValidationError(null);
  
      const normalizedAlternatives =
        alternatives.map((alternative) => ({
          text: alternative.text.trim(),
          isCorrect: alternative.isCorrect,
        }));
  
      if (
        normalizedAlternatives.some(
          (alternative) =>
            alternative.text.length === 0,
        )
      ) {
        setValidationError(
          "Preencha o texto de todas as alternativas.",
        );
  
        return;
      }
  
      const correctAlternativeCount =
        normalizedAlternatives.filter(
          (alternative) =>
            alternative.isCorrect,
        ).length;
  
      if (correctAlternativeCount !== 1) {
        setValidationError(
          "Selecione exatamente uma alternativa correta.",
        );
  
        return;
      }
  
      setIsSubmitting(true);
  
      try {
        const shouldReset = await onSubmit({
          statement: statement.trim(),
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
          setValidationError(null);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  
    return (
      <form
        className="teacher-question-form"
        onSubmit={handleSubmit}
      >
        <div className="teacher-form-field">
          <label htmlFor="question-statement">
            Enunciado
          </label>
  
          <textarea
            id="question-statement"
            name="statement"
            value={statement}
            onChange={(event) =>
              setStatement(
                event.target.value,
              )
            }
            placeholder="Digite o enunciado da questão."
            minLength={3}
            maxLength={1000}
            rows={4}
            disabled={isSubmitting}
            required
          />
  
          <span className="teacher-character-count">
            {statement.length}/1000
          </span>
        </div>
  
        <div className="teacher-form-field">
          <label htmlFor="question-skill">
            Habilidade avaliada
          </label>
  
          <select
            id="question-skill"
            name="skillId"
            value={skillId}
            onChange={(event) =>
              setSkillId(event.target.value)
            }
            disabled={
              isSubmitting ||
              skills.length === 0
            }
            required
          >
            <option value="">
              Selecione uma habilidade
            </option>
  
            {skills.map((skill) => (
              <option
                key={skill.id}
                value={skill.id}
              >
                {skill.name} — {skill.subject}
              </option>
            ))}
          </select>
        </div>
  
        <fieldset className="teacher-alternatives-fieldset">
          <legend>Alternativas</legend>
  
          <p>
            Adicione entre duas e seis alternativas
            e marque exatamente uma como correta.
          </p>
  
          <div className="teacher-alternative-list">
            {alternatives.map(
              (alternative, index) => (
                <div
                  key={alternative.id}
                  className={[
                    "teacher-alternative-editor",
                    alternative.isCorrect
                      ? "is-correct"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <label className="teacher-correct-choice">
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
                      disabled={isSubmitting}
                    />
  
                    <span>Correta</span>
                  </label>
  
                  <input
                    type="text"
                    value={alternative.text}
                    onChange={(event) =>
                      updateAlternativeText(
                        alternative.id,
                        event.target.value,
                      )
                    }
                    aria-label={`Texto da alternativa ${
                      index + 1
                    }`}
                    placeholder={`Alternativa ${
                      index + 1
                    }`}
                    maxLength={300}
                    disabled={isSubmitting}
                    required
                  />
  
                  <button
                    type="button"
                    className="teacher-alternative-remove"
                    onClick={() =>
                      removeAlternative(
                        alternative.id,
                      )
                    }
                    disabled={
                      isSubmitting ||
                      alternatives.length <= 2
                    }
                    aria-label={`Remover alternativa ${
                      index + 1
                    }`}
                  >
                    Remover
                  </button>
                </div>
              ),
            )}
          </div>
  
          <button
            type="button"
            className="teacher-secondary-action"
            onClick={addAlternative}
            disabled={
              isSubmitting ||
              alternatives.length >= 6
            }
          >
            Adicionar alternativa
          </button>
        </fieldset>
  
        {validationError && (
          <div
            className="teacher-inline-feedback is-error"
            role="alert"
          >
            {validationError}
          </div>
        )}
  
        <button
          type="submit"
          className="teacher-primary-button"
          disabled={
            isSubmitting ||
            skills.length === 0
          }
        >
          {isSubmitting
            ? "Adicionando..."
            : "Adicionar questão"}
        </button>
      </form>
    );
  }