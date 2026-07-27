import {
    useState,
    type FormEvent,
  } from "react";
  
  import type {
    CreateTeacherClassroomInput,
  } from "../types/teacher";
  import { Button } from "./ui/Button";
  
  interface ClassroomCreationFormProps {
    onSubmit(
      input: CreateTeacherClassroomInput,
    ): Promise<boolean>;
  
    onCancel(): void;
  }
  
  export function ClassroomCreationForm({
    onSubmit,
    onCancel,
  }: ClassroomCreationFormProps) {
    const [name, setName] =
      useState("");
  
    const [subject, setSubject] =
      useState("");
  
    const [schoolYear, setSchoolYear] =
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
            schoolYear:
              schoolYear.trim(),
          });
  
        if (shouldReset) {
          setName("");
          setSubject("");
          setSchoolYear("");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  
    return (
      <form
        className="teacher-classroom-form"
        onSubmit={handleSubmit}
      >
        <div className="teacher-classroom-form-field">
          <label htmlFor="classroom-name">
            Nome da turma
          </label>
  
          <input
            id="classroom-name"
            name="name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Ex.: 9º Ano A"
            minLength={2}
            maxLength={100}
            disabled={isSubmitting}
            required
          />
        </div>
  
        <div className="teacher-classroom-form-field">
          <label htmlFor="classroom-subject">
            Disciplina
          </label>
  
          <input
            id="classroom-subject"
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
  
        <div className="teacher-classroom-form-field">
          <label htmlFor="classroom-school-year">
            Ano letivo
          </label>
  
          <input
            id="classroom-school-year"
            name="schoolYear"
            value={schoolYear}
            onChange={(event) =>
              setSchoolYear(
                event.target.value,
              )
            }
            placeholder="Ex.: 2026"
            minLength={2}
            maxLength={40}
            disabled={isSubmitting}
            required
          />
        </div>
  
        <div className="teacher-classroom-form-actions">
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
              ? "Criando..."
              : "Criar turma"}
          </Button>
        </div>
      </form>
    );
  }