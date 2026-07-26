import {
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
  } from "react";
  import {
    Link,
    useParams,
  } from "react-router";
  
  import { TeacherPageHeader } from "../components/TeacherPageHeader";
  import { getErrorMessage } from "../lib/get-error-message";
  import { getTeacherClassroom } from "../services/teacher-api";
  import type { TeacherClassroomDetails } from "../types/teacher";
  import { DataSearch } from "../components/DataSearch";
  import { normalizeSearch } from "../lib/normalize-search";
  
  function getStudentCountLabel(
    studentCount: number,
  ): string {
    return studentCount === 1
      ? "1 estudante associado"
      : `${studentCount} estudantes associados`;
  }
  
  export function TeacherClassroomDetailsPage() {
    const { classroomId } = useParams<{
      classroomId: string;
    }>();
  
    const [classroom, setClassroom] =
      useState<TeacherClassroomDetails | null>(
        null,
      );
  
    const [isLoading, setIsLoading] =
      useState(true);
  
    const [error, setError] =
      useState<string | null>(null);

      const [searchTerm, setSearchTerm] =
  useState("");

const deferredSearchTerm =
  useDeferredValue(searchTerm);

const filteredStudents = useMemo(() => {
  const normalizedTerm =
    normalizeSearch(deferredSearchTerm);

  if (!classroom) {
    return [];
  }

  if (!normalizedTerm) {
    return classroom.students;
  }

  return classroom.students.filter(
    (student) => {
      const status = student.active
        ? "ativo"
        : "inativo";

      const searchableContent =
        normalizeSearch(
          [
            student.name,
            student.registration,
            status,
          ].join(" "),
        );

        return searchableContent.includes(
            normalizedTerm,
        );
        },
    );
    }, [
    classroom,
    deferredSearchTerm,
    ]);
  
    const [reloadKey, setReloadKey] =
      useState(0);
  
    useEffect(() => {
      let isCancelled = false;
  
      async function loadClassroom() {
        if (!classroomId) {
          setError(
            "O identificador da turma não foi informado.",
          );
          setIsLoading(false);
          return;
        }
  
        setIsLoading(true);
        setError(null);
  
        try {
          const classroomData =
            await getTeacherClassroom(
              classroomId,
            );
  
          if (!isCancelled) {
            setClassroom(classroomData);
          }
        } catch (caughtError) {
          if (isCancelled) {
            return;
          }
  
          setClassroom(null);
  
          setError(
            getErrorMessage(
              caughtError,
              "Não foi possível carregar a turma.",
            ),
          );
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      }
  
      void loadClassroom();
  
      return () => {
        isCancelled = true;
      };
    }, [
      classroomId,
      reloadKey,
    ]);
  
    if (isLoading) {
      return (
        <>
          <Link
            to="/professor/turmas"
            className="teacher-back-link"
          >
            ← Voltar para turmas
          </Link>
  
          <section
            className="teacher-feedback"
            aria-live="polite"
          >
            <div>
              <strong>
                Carregando a turma...
              </strong>
  
              <p>
                Estamos consultando os estudantes
                associados.
              </p>
            </div>
          </section>
        </>
      );
    }
  
    if (error || !classroom) {
      return (
        <>
          <Link
            to="/professor/turmas"
            className="teacher-back-link"
          >
            ← Voltar para turmas
          </Link>
  
          <section
            className="teacher-feedback is-error"
            role="alert"
          >
            <div>
              <strong>
                Não foi possível abrir a turma
              </strong>
  
              <p>
                {error ??
                  "A turma não foi encontrada."}
              </p>
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
        </>
      );
    }
  
    return (
      <>
        <Link
          to="/professor/turmas"
          className="teacher-back-link"
        >
          ← Voltar para turmas
        </Link>
  
        <TeacherPageHeader
          eyebrow={classroom.subject}
          title={classroom.name}
          description={`${classroom.schoolYear} · ${getStudentCountLabel(
            classroom.studentCount,
          )}`}
        />
  
        <section
          className="teacher-classroom-overview"
          aria-label="Resumo da turma"
        >
          <article>
            <span>Disciplina</span>
            <strong>{classroom.subject}</strong>
          </article>
  
          <article>
            <span>Ano escolar</span>
            <strong>{classroom.schoolYear}</strong>
          </article>
  
          <article>
            <span>Estudantes</span>
            <strong>
              {classroom.studentCount}
            </strong>
          </article>
        </section>
  
        <section className="teacher-panel">
          <div className="teacher-panel-header">
          {classroom.students.length > 0 && (
            <DataSearch
                value={searchTerm}
                onChange={setSearchTerm}
                label="Pesquisar estudantes da turma"
                placeholder="Buscar por nome ou matrícula..."
                resultCount={filteredStudents.length}
                totalCount={classroom.students.length}
            />
            )}

            <h2>Estudantes da turma</h2>
  
            <p>
              Lista de estudantes associados a
              esta turma.
            </p>
          </div>
  
          {classroom.students.length === 0 ? (
            <div className="teacher-empty-state">
                <h2>
                Nenhum estudante associado
                </h2>

                <p>
                Esta turma ainda não possui
                estudantes cadastrados.
                </p>
            </div>
            ) : filteredStudents.length === 0 ? (
            <div className="teacher-empty-state">
                <h2>
                Nenhum estudante encontrado
                </h2>

                <p>
                Não encontramos estudantes
                correspondentes a “{searchTerm}”.
                </p>

                <button
                type="button"
                className="teacher-empty-action"
                onClick={() => setSearchTerm("")}
                >
                Limpar busca
                </button>
            </div>
            ) : (
            <div className="teacher-student-table-wrapper">
              <table className="teacher-student-table">
                <thead>
                  <tr>
                    <th scope="col">
                      Estudante
                    </th>
  
                    <th scope="col">
                      Matrícula
                    </th>
  
                    <th scope="col">
                      Situação
                    </th>
                  </tr>
                </thead>
  
                <tbody>
                  {filteredStudents.map(
                    (student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="teacher-student-identity">
                            <span
                              className="teacher-student-avatar"
                              aria-hidden="true"
                            >
                              {student.name
                                .charAt(0)
                                .toUpperCase()}
                            </span>
  
                            <strong>
                              {student.name}
                            </strong>
                          </div>
                        </td>
  
                        <td>
                          {student.registration ??
                            "Não informada"}
                        </td>
  
                        <td>
                          <span className="teacher-status-badge">
                            {student.active
                              ? "Ativo"
                              : "Inativo"}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </>
    );
  }