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
  
  import { DataSearch } from "../components/DataSearch";
  import { TeacherPageHeader } from "../components/TeacherPageHeader";
  import { getErrorMessage } from "../lib/get-error-message";
  import { normalizeSearch } from "../lib/normalize-search";
  import {
    addTeacherStudentToClassroom,
    getTeacherClassroom,
    getTeacherStudents,
    removeTeacherStudentFromClassroom,
  } from "../services/teacher-api";
  import type {
    TeacherClassroomDetails,
    TeacherStudent,
  } from "../types/teacher";
  
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
  
    const [teacherStudents, setTeacherStudents] =
      useState<TeacherStudent[]>([]);
  
    const [isLoading, setIsLoading] =
      useState(true);
  
    const [error, setError] =
      useState<string | null>(null);
  
    const [reloadKey, setReloadKey] =
      useState(0);
  
    const [searchTerm, setSearchTerm] =
      useState("");
  
    const [selectedStudentId, setSelectedStudentId] =
      useState("");
  
    const [isAssociating, setIsAssociating] =
      useState(false);
  
    const [removingStudentId, setRemovingStudentId] =
      useState<string | null>(null);
  
    const [managementError, setManagementError] =
      useState<string | null>(null);
  
    const [managementSuccess, setManagementSuccess] =
      useState<string | null>(null);
  
    const deferredSearchTerm =
      useDeferredValue(searchTerm);
  
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
          const [
            classroomData,
            studentList,
          ] = await Promise.all([
            getTeacherClassroom(classroomId),
            getTeacherStudents(),
          ]);
  
          if (isCancelled) {
            return;
          }
  
          setClassroom(classroomData);
          setTeacherStudents(studentList);
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
  
    const availableStudents = useMemo(() => {
      if (!classroom) {
        return [];
      }
  
      const associatedStudentIds = new Set(
        classroom.students.map(
          (student) => student.id,
        ),
      );
  
      return teacherStudents.filter(
        (student) =>
          !associatedStudentIds.has(student.id),
      );
    }, [
      classroom,
      teacherStudents,
    ]);
  
    async function handleAddStudent() {
      if (
        !classroomId ||
        !selectedStudentId
      ) {
        return;
      }
  
      setIsAssociating(true);
      setManagementError(null);
      setManagementSuccess(null);
  
      try {
        const selectedStudent =
          teacherStudents.find(
            (student) =>
              student.id === selectedStudentId,
          );
  
        const updatedClassroom =
          await addTeacherStudentToClassroom(
            classroomId,
            selectedStudentId,
          );
  
        setClassroom(updatedClassroom);
        setSelectedStudentId("");
  
        setManagementSuccess(
          selectedStudent
            ? `${selectedStudent.name} foi associado à turma.`
            : "Estudante associado à turma.",
        );
      } catch (caughtError) {
        setManagementError(
          getErrorMessage(
            caughtError,
            "Não foi possível associar o estudante.",
          ),
        );
      } finally {
        setIsAssociating(false);
      }
    }
  
    async function handleRemoveStudent(
      studentId: string,
      studentName: string,
    ) {
      if (!classroomId) {
        return;
      }
  
      const shouldRemove = window.confirm(
        `Remover ${studentName} desta turma?\n\nO estudante continuará cadastrado no RadarAprende.`,
      );
  
      if (!shouldRemove) {
        return;
      }
  
      setRemovingStudentId(studentId);
      setManagementError(null);
      setManagementSuccess(null);
  
      try {
        const updatedClassroom =
          await removeTeacherStudentFromClassroom(
            classroomId,
            studentId,
          );
  
        setClassroom(updatedClassroom);
  
        setManagementSuccess(
          `${studentName} foi removido desta turma.`,
        );
      } catch (caughtError) {
        setManagementError(
          getErrorMessage(
            caughtError,
            "Não foi possível remover o estudante da turma.",
          ),
        );
      } finally {
        setRemovingStudentId(null);
      }
    }
  
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
            <h2>Gerenciar estudantes</h2>
  
            <p>
              Associe estudantes já cadastrados
              a esta turma.
            </p>
          </div>
  
          <div className="teacher-student-management">
            <div>
              <label htmlFor="student-association">
                Estudante disponível
              </label>
  
              <p>
                Um estudante pode participar de
                mais de uma turma.
              </p>
            </div>
  
            <div className="teacher-student-association-controls">
              <select
                id="student-association"
                value={selectedStudentId}
                onChange={(event) =>
                  setSelectedStudentId(
                    event.target.value,
                  )
                }
                disabled={
                  isAssociating ||
                  availableStudents.length === 0
                }
              >
                <option value="">
                  {availableStudents.length > 0
                    ? "Selecione um estudante"
                    : "Todos já estão associados"}
                </option>
  
                {availableStudents.map(
                  (student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.name}
                      {student.registration
                        ? ` — ${student.registration}`
                        : ""}
                    </option>
                  ),
                )}
              </select>
  
              <button
                type="button"
                className="teacher-primary-button"
                onClick={() =>
                  void handleAddStudent()
                }
                disabled={
                  !selectedStudentId ||
                  isAssociating
                }
              >
                {isAssociating
                  ? "Adicionando..."
                  : "Adicionar à turma"}
              </button>
            </div>
          </div>
  
          {managementSuccess && (
            <div
              className="teacher-inline-feedback is-success"
              role="status"
            >
              {managementSuccess}
            </div>
          )}
  
          {managementError && (
            <div
              className="teacher-inline-feedback is-error"
              role="alert"
            >
              {managementError}
            </div>
          )}
        </section>
  
        <section className="teacher-panel">
          <div className="teacher-panel-header">
            <h2>Estudantes da turma</h2>
  
            <p>
              Consulte ou remova associações com
              esta turma.
            </p>
          </div>
  
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
  
          {classroom.students.length === 0 ? (
            <div className="teacher-empty-state">
              <h2>
                Nenhum estudante associado
              </h2>
  
              <p>
                Selecione um estudante acima para
                adicioná-lo à turma.
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
  
                    <th scope="col">
                      Ações
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
  
                        <td>
                          <button
                            type="button"
                            className="teacher-danger-button"
                            disabled={
                              removingStudentId ===
                              student.id
                            }
                            onClick={() =>
                              void handleRemoveStudent(
                                student.id,
                                student.name,
                              )
                            }
                          >
                            {removingStudentId ===
                            student.id
                              ? "Removendo..."
                              : "Remover da turma"}
                          </button>
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