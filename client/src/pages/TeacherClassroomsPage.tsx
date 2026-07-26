import {
    useEffect,
    useState,
  } from "react";
  
  import { TeacherPageHeader } from "../components/TeacherPageHeader";
  import { getErrorMessage } from "../lib/get-error-message";
  import { getTeacherClassrooms } from "../services/teacher-api";
  import type { TeacherClassroom } from "../types/teacher";
  
  function getStudentLabel(
    studentCount: number,
  ): string {
    return studentCount === 1
      ? "1 estudante"
      : `${studentCount} estudantes`;
  }
  
  export function TeacherClassroomsPage() {
    const [classrooms, setClassrooms] =
      useState<TeacherClassroom[]>([]);
  
    const [isLoading, setIsLoading] =
      useState(true);
  
    const [error, setError] =
      useState<string | null>(null);
  
    const [reloadKey, setReloadKey] =
      useState(0);
  
    useEffect(() => {
      let isCancelled = false;
  
      async function loadClassrooms() {
        setIsLoading(true);
        setError(null);
  
        try {
          const classroomList =
            await getTeacherClassrooms();
  
          if (!isCancelled) {
            setClassrooms(classroomList);
          }
        } catch (caughtError) {
          if (isCancelled) {
            return;
          }
  
          setError(
            getErrorMessage(
              caughtError,
              "Não foi possível carregar as turmas.",
            ),
          );
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      }
  
      void loadClassrooms();
  
      return () => {
        isCancelled = true;
      };
    }, [reloadKey]);
  
    return (
      <>
        <TeacherPageHeader
          eyebrow="Organização"
          title="Turmas"
          description="Consulte as turmas, acompanhe os estudantes e organize o contexto das avaliações."
        />
  
        {isLoading && (
          <section
            className="teacher-feedback"
            aria-live="polite"
          >
            <div>
              <strong>
                Carregando turmas...
              </strong>
  
              <p>
                Estamos consultando os dados
                do RadarAprende.
              </p>
            </div>
          </section>
        )}
  
        {!isLoading && error && (
          <section
            className="teacher-feedback is-error"
            role="alert"
          >
            <div>
              <strong>
                Não foi possível carregar
                as turmas
              </strong>
  
              <p>{error}</p>
            </div>
  
            <button
              type="button"
              className="teacher-retry-button"
              onClick={() =>
                setReloadKey(
                  (currentValue) =>
                    currentValue + 1,
                )
              }
            >
              Tentar novamente
            </button>
          </section>
        )}
  
        {!isLoading &&
          !error &&
          classrooms.length === 0 && (
            <section className="teacher-empty-state">
              <h2>
                Nenhuma turma encontrada
              </h2>
  
              <p>
                Cadastre a primeira turma para
                começar o acompanhamento dos
                estudantes.
              </p>
            </section>
          )}
  
        {!isLoading &&
          !error &&
          classrooms.length > 0 && (
            <section
              className="teacher-classroom-grid"
              aria-label="Turmas cadastradas"
            >
              {classrooms.map((classroom) => (
                <article
                  key={classroom.id}
                  className="teacher-classroom-card"
                >
                  <div className="teacher-classroom-card-header">
                    <span className="teacher-classroom-subject">
                      {classroom.subject}
                    </span>
  
                    <span className="teacher-status-badge">
                      Ativa
                    </span>
                  </div>
  
                  <h2>{classroom.name}</h2>
  
                  <dl className="teacher-classroom-metadata">
                    <div>
                      <dt>Ano escolar</dt>
  
                      <dd>
                        {classroom.schoolYear}
                      </dd>
                    </div>
  
                    <div>
                      <dt>Estudantes</dt>
  
                      <dd>
                        {getStudentLabel(
                          classroom.studentCount,
                        )}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </section>
          )}
      </>
    );
  }