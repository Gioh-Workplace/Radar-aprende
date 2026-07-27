import {
    useState,
    type FormEvent,
  } from "react";
  
  import type {
    CreateTeacherAssessmentInput,
    TeacherClassroom,
  } from "../types/teacher";
  
  interface AssessmentCreationFormProps {
    classrooms: TeacherClassroom[];
  
    onSubmit(
      input: CreateTeacherAssessmentInput,
    ): Promise<boolean>;
  }
  
  export function AssessmentCreationForm({
    classrooms,
    onSubmit,
  }: AssessmentCreationFormProps) {
    const [title, setTitle] =
      useState("");
  
    const [description, setDescription] =
      useState("");
  
    const [classroomId, setClassroomId] =
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
          title: title.trim(),
          description:
            description.trim() || undefined,
          classroomId,
        });
  
        if (shouldReset) {
          setTitle("");
          setDescription("");
          setClassroomId("");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  
    return (
      <form
        className="teacher-assessment-creation-form"
        onSubmit={handleSubmit}
      >
        <div className="teacher-form-field">
          <label htmlFor="assessment-title">
            Título da avaliação
          </label>
  
          <input
            id="assessment-title"
            name="title"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Ex.: Diagnóstico de frações"
            minLength={3}
            maxLength={150}
            disabled={isSubmitting}
            required
          />
        </div>
  
        <div className="teacher-form-field">
          <label htmlFor="assessment-classroom">
            Turma
          </label>
  
          <select
            id="assessment-classroom"
            name="classroomId"
            value={classroomId}
            onChange={(event) =>
              setClassroomId(event.target.value)
            }
            disabled={
              isSubmitting ||
              classrooms.length === 0
            }
            required
          >
            <option value="">
              Selecione uma turma
            </option>
  
            {classrooms.map((classroom) => (
              <option
                key={classroom.id}
                value={classroom.id}
              >
                {classroom.name} —{" "}
                {classroom.subject}
              </option>
            ))}
          </select>
        </div>
  
        <div className="teacher-form-field teacher-form-field-wide">
          <label htmlFor="assessment-description">
            Descrição
          </label>
  
          <textarea
            id="assessment-description"
            name="description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            placeholder="Explique o objetivo desta avaliação diagnóstica."
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
          disabled={
            isSubmitting ||
            classrooms.length === 0
          }
        >
          {isSubmitting
            ? "Criando..."
            : "Criar avaliação"}
        </button>
      </form>
    );
  }