import {
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
  } from "react";
  import { Link } from "react-router";
  
  import { DataSearch } from "../components/DataSearch";
  import { TeacherPageHeader } from "../components/TeacherPageHeader";
  import { getErrorMessage } from "../lib/get-error-message";
  import { normalizeSearch } from "../lib/normalize-search";
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

      const [searchTerm, setSearchTerm] =
        useState("");

        const deferredSearchTerm =
        useDeferredValue(searchTerm);

        const filteredClassrooms = useMemo(() => {
        const normalizedTerm =
            normalizeSearch(deferredSearchTerm);

        if (!normalizedTerm) {
            return classrooms;
        }

        return classrooms.filter((classroom) => {
            const searchableContent = normalizeSearch(
            [
                classroom.name,
                classroom.subject,
                classroom.schoolYear,
            ].join(" "),
            );

            return searchableContent.includes(
            normalizedTerm,
            );
        });
        }, [
        classrooms,
        deferredSearchTerm,
        ]);
  
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

        {!isLoading &&
        !error &&
        classrooms.length > 0 && (
            <DataSearch
            value={searchTerm}
            onChange={setSearchTerm}
            label="Pesquisar turmas"
            placeholder="Buscar por nome, disciplina ou ano escolar..."
            resultCount={filteredClassrooms.length}
            totalCount={classrooms.length}
            />
        )}
  
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
        classrooms.length > 0 &&
        filteredClassrooms.length === 0 && (
            <section className="teacher-empty-state">
            <h2>
                Nenhuma turma encontrada
            </h2>

            <p>
                Não encontramos turmas correspondentes
                a “{searchTerm}”. Tente outro nome,
                disciplina ou ano escolar.
            </p>

            <button
                type="button"
                className="teacher-empty-action"
                onClick={() => setSearchTerm("")}
            >
                Limpar busca
            </button>
            </section>
        )}
  
        {!isLoading &&
          !error &&
          filteredClassrooms.length > 0 && (
            <section
              className="teacher-classroom-grid"
              aria-label="Turmas cadastradas"
            >
              {filteredClassrooms.map((classroom) => (
                    <Link
                    key={classroom.id}
                    to={`/professor/turmas/${classroom.id}`}
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
                  <span className="teacher-classroom-link-label">
                    Ver detalhes da turma
                  </span>
                </Link>
              ))}
            </section>
          )}
      </>
    );
  }