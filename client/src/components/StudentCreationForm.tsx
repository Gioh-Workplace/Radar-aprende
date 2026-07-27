import {
    useState,
    type FormEvent,
  } from "react";
  
  import type {
    CreateTeacherStudentInput,
  } from "../types/teacher";
  
  interface StudentCreationFormProps {
    onSubmit(
      input: CreateTeacherStudentInput,
    ): Promise<boolean>;
  }
  
  export function StudentCreationForm({
    onSubmit,
  }: StudentCreationFormProps) {
    const [name, setName] =
      useState("");
  
    const [registration, setRegistration] =
      useState("");
  
    const [password, setPassword] =
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
          registration:
            registration.trim().toUpperCase(),
          password,
        });
  
        if (shouldReset) {
          setName("");
          setRegistration("");
          setPassword("");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  
    return (
      <form
        className="teacher-student-creation-form"
        onSubmit={handleSubmit}
      >
        <div className="teacher-form-field">
          <label htmlFor="student-name">
            Nome completo
          </label>
  
          <input
            id="student-name"
            name="name"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Nome do estudante"
            minLength={2}
            maxLength={120}
            autoComplete="name"
            disabled={isSubmitting}
            required
          />
        </div>
  
        <div className="teacher-form-field">
          <label htmlFor="student-registration">
            Matrícula
          </label>
  
          <input
            id="student-registration"
            name="registration"
            value={registration}
            onChange={(event) =>
              setRegistration(
                event.target.value.toUpperCase(),
              )
            }
            placeholder="Ex.: ALUNO091"
            minLength={3}
            maxLength={40}
            pattern="[A-Za-z0-9._-]+"
            title="Use apenas letras, números, ponto, hífen ou underline."
            autoComplete="off"
            disabled={isSubmitting}
            required
          />
        </div>
  
        <div className="teacher-form-field">
          <label htmlFor="student-password">
            Senha de acesso
          </label>
  
          <input
            id="student-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Mínimo de 6 caracteres"
            minLength={6}
            maxLength={72}
            autoComplete="new-password"
            disabled={isSubmitting}
            required
          />
        </div>
  
        <button
          type="submit"
          className="teacher-primary-button"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Cadastrando..."
            : "Cadastrar e adicionar"}
        </button>
      </form>
    );
  }