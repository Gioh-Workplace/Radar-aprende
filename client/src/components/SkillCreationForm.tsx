import {
  useState,
  type FormEvent,
} from "react";

import type {
  CreateTeacherSkillInput,
} from "../types/teacher";
import { Button } from "./ui/Button";

interface SkillCreationFormProps {
  onSubmit(
    input: CreateTeacherSkillInput,
  ): Promise<boolean>;

  onCancel(): void;
}

export function SkillCreationForm({
  onSubmit,
  onCancel,
}: SkillCreationFormProps) {
  const [name, setName] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const shouldReset =
        await onSubmit({
          name: name.trim(),
          subject: subject.trim(),
          description:
            description.trim() ||
            undefined,
        });

      if (shouldReset) {
        setName("");
        setSubject("");
        setDescription("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="teacher-skill-form"
      onSubmit={handleSubmit}
    >
      <div className="teacher-skill-form-field">
        <label htmlFor="skill-name">
          Nome da habilidade
        </label>

        <input
          id="skill-name"
          name="name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          placeholder="Ex.: Resolver problemas com frações"
          minLength={2}
          maxLength={120}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="teacher-skill-form-field">
        <label htmlFor="skill-subject">
          Disciplina
        </label>

        <input
          id="skill-subject"
          name="subject"
          value={subject}
          onChange={(event) =>
            setSubject(event.target.value)
          }
          placeholder="Ex.: Matemática"
          minLength={2}
          maxLength={100}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="teacher-skill-form-field is-wide">
        <div className="teacher-skill-form-label-row">
          <label htmlFor="skill-description">
            Descrição
          </label>

          <span>
            Opcional
          </span>
        </div>

        <textarea
          id="skill-description"
          name="description"
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value,
            )
          }
          placeholder="Descreva o que será observado nesta habilidade."
          maxLength={500}
          rows={4}
          disabled={isSubmitting}
        />

        <span className="teacher-skill-form-counter">
          {description.length}/500
        </span>
      </div>

      <div className="teacher-skill-form-actions">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Cadastrando..."
            : "Cadastrar habilidade"}
        </Button>
      </div>
    </form>
  );
}