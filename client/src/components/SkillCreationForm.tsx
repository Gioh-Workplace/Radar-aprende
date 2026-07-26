import {
    useState,
    type FormEvent,
  } from "react";
  
  import type {
    CreateTeacherSkillInput,
  } from "../types/teacher";
  
  interface SkillCreationFormProps {
    onSubmit(
      input: CreateTeacherSkillInput,
    ): Promise<boolean>;
  }
  
  export function SkillCreationForm({
    onSubmit,
  }: SkillCreationFormProps) {
    const [name, setName] = useState("");
    const [subject, setSubject] = useState("");
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
        const shouldReset = await onSubmit({
          name: name.trim(),
          subject: subject.trim(),
          description:
            description.trim() || undefined,
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
        className="teacher-skill-creation-form"
        onSubmit={handleSubmit}
      >
        <div className="teacher-form-field">
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
  
        <div className="teacher-form-field">
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
  
        <div className="teacher-form-field teacher-form-field-wide">
          <label htmlFor="skill-description">
            Descrição
          </label>
  
          <textarea
            id="skill-description"
            name="description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Descreva o que será observado nesta habilidade."
            maxLength={500}
            rows={3}
            disabled={isSubmitting}
          />
  
          <span className="teacher-character-count">
            {description.length}/500
          </span>
        </div>
  
        <button
          type="submit"
          className="teacher-primary-button"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Cadastrando..."
            : "Cadastrar habilidade"}
        </button>
      </form>
    );
  }