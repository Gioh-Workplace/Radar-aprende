import {
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Link2,
  LoaderCircle,
  RefreshCw,
  SearchX,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router";

import { StudentCreationForm } from "../components/StudentCreationForm";
import { Button } from "../components/ui/Button";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { PageHeader } from "../components/ui/PageHeader";
import { PageState } from "../components/ui/PageState";
import { SearchField } from "../components/ui/SearchField";
import { StatCard } from "../components/ui/StatCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { getErrorMessage } from "../lib/get-error-message";
import { normalizeSearch } from "../lib/normalize-search";
import {
  addTeacherStudentToClassroom,
  createTeacherStudent,
  getTeacherClassroom,
  getTeacherStudents,
  removeTeacherStudentFromClassroom,
} from "../services/teacher-api";
import type {
  CreateTeacherStudentInput,
  TeacherClassroomDetails,
  TeacherClassroomStudent,
  TeacherStudent,
} from "../types/teacher";

import "../styles/teacher-classroom-details.css";

type ManagementPanel =
  | "create"
  | "associate"
  | null;

function getStudentCountLabel(
  studentCount: number,
): string {
  return studentCount === 1
    ? "1 estudante associado"
    : `${studentCount} estudantes associados`;
}

function sortTeacherStudents(
  students: TeacherStudent[],
): TeacherStudent[] {
  return [...students].sort(
    (firstStudent, secondStudent) =>
      firstStudent.name.localeCompare(
        secondStudent.name,
        "pt-BR",
      ),
  );
}

function sortClassroomStudents(
  students: TeacherClassroomStudent[],
): TeacherClassroomStudent[] {
  return [...students].sort(
    (firstStudent, secondStudent) =>
      firstStudent.name.localeCompare(
        secondStudent.name,
        "pt-BR",
      ),
  );
}

function getStudentInitials(
  name: string,
): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
}

export function TeacherClassroomDetailsPage() {
  const { classroomId } = useParams<{
    classroomId: string;
  }>();

  const [classroom, setClassroom] =
    useState<TeacherClassroomDetails | null>(
      null,
    );

  const [
    teacherStudents,
    setTeacherStudents,
  ] = useState<TeacherStudent[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    managementError,
    setManagementError,
  ] = useState<string | null>(null);

  const [
    managementSuccess,
    setManagementSuccess,
  ] = useState<string | null>(null);

  const [
    managementPanel,
    setManagementPanel,
  ] = useState<ManagementPanel>(null);

  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState("");

  const [isAssociating, setIsAssociating] =
    useState(false);

  const [
    removingStudentId,
    setRemovingStudentId,
  ] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

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
          getTeacherClassroom(
            classroomId,
          ),
          getTeacherStudents(),
        ]);

        if (isCancelled) {
          return;
        }

        setClassroom(classroomData);

        setTeacherStudents(
          sortTeacherStudents(
            studentList,
          ),
        );
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

  const classroomStudents =
    useMemo(
      () =>
        classroom
          ? sortClassroomStudents(
              classroom.students,
            )
          : [],
      [classroom],
    );

  const filteredStudents =
    useMemo(() => {
      const normalizedTerm =
        normalizeSearch(
          deferredSearchTerm,
        );

      if (!normalizedTerm) {
        return classroomStudents;
      }

      return classroomStudents.filter(
        (student) => {
          const searchableContent =
            normalizeSearch(
              [
                student.name,
                student.registration,
                student.active
                  ? "ativo"
                  : "inativo",
              ].join(" "),
            );

          return searchableContent.includes(
            normalizedTerm,
          );
        },
      );
    }, [
      classroomStudents,
      deferredSearchTerm,
    ]);

  const availableStudents =
    useMemo(() => {
      const associatedStudentIds =
        new Set(
          classroomStudents.map(
            (student) => student.id,
          ),
        );

      return teacherStudents.filter(
        (student) =>
          !associatedStudentIds.has(
            student.id,
          ),
      );
    }, [
      classroomStudents,
      teacherStudents,
    ]);

  const activeStudentCount =
    useMemo(
      () =>
        classroomStudents.filter(
          (student) =>
            student.active,
        ).length,
      [classroomStudents],
    );

  async function handleCreateStudent(
    input: CreateTeacherStudentInput,
  ): Promise<boolean> {
    if (
      !classroomId ||
      !classroom?.active
    ) {
      return false;
    }

    setManagementError(null);
    setManagementSuccess(null);

    let createdStudent:
      TeacherStudent | null = null;

    try {
      const newStudent =
        await createTeacherStudent(
          input,
        );

      createdStudent = newStudent;

      setTeacherStudents(
        (currentStudents) =>
          sortTeacherStudents([
            ...currentStudents,
            newStudent,
          ]),
      );

      const updatedClassroom =
        await addTeacherStudentToClassroom(
          classroomId,
          newStudent.id,
        );

      setClassroom(updatedClassroom);
      setManagementPanel(null);

      setManagementSuccess(
        `${newStudent.name} foi cadastrado e associado à turma.`,
      );

      return true;
    } catch (caughtError) {
      if (createdStudent) {
        setSelectedStudentId(
          createdStudent.id,
        );

        setManagementPanel(
          "associate",
        );

        setManagementError(
          `${createdStudent.name} foi cadastrado, mas não foi possível associá-lo automaticamente. O estudante já foi selecionado no formulário de associação.`,
        );

        return true;
      }

      setManagementError(
        getErrorMessage(
          caughtError,
          "Não foi possível cadastrar o estudante.",
        ),
      );

      return false;
    }
  }

  async function handleAddStudent() {
    if (
      !classroomId ||
      !classroom?.active ||
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
            student.id ===
            selectedStudentId,
        );

      const updatedClassroom =
        await addTeacherStudentToClassroom(
          classroomId,
          selectedStudentId,
        );

      setClassroom(updatedClassroom);
      setSelectedStudentId("");
      setManagementPanel(null);

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
    if (
      !classroomId ||
      !classroom?.active
    ) {
      return;
    }

    const shouldRemove =
      window.confirm(
        `Remover ${studentName} desta turma?\n\nO estudante continuará cadastrado no RadarAprende.`,
      );

    if (!shouldRemove) {
      return;
    }

    setRemovingStudentId(
      studentId,
    );

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

  function toggleManagementPanel(
    panel: Exclude<
      ManagementPanel,
      null
    >,
  ) {
    setManagementPanel(
      (currentPanel) =>
        currentPanel === panel
          ? null
          : panel,
    );

    setManagementError(null);
    setManagementSuccess(null);
  }

  if (isLoading) {
    return (
      <div className="teacher-classroom-details-page">
        <Breadcrumbs
          items={[
            {
              label: "Turmas",
              to: "/professor/turmas",
            },
            {
              label: "Carregando",
            },
          ]}
        />

        <PageState
          icon={LoaderCircle}
          title="Carregando turma"
          description="Estamos consultando os dados e os estudantes associados."
          tone="primary"
          isLoading
        />
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="teacher-classroom-details-page">
        <Breadcrumbs
          items={[
            {
              label: "Turmas",
              to: "/professor/turmas",
            },
            {
              label: "Turma indisponível",
            },
          ]}
        />

        <FeedbackBanner
          tone="error"
          title="Não foi possível abrir a turma"
          description={
            error ??
            "A turma não foi encontrada."
          }
          action={
            <Button
              variant="secondary"
              icon={
                <RefreshCw
                  size={16}
                  strokeWidth={1.9}
                />
              }
              onClick={() =>
                setReloadKey(
                  (currentValue) =>
                    currentValue + 1,
                )
              }
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="teacher-classroom-details-page">
      <Breadcrumbs
        items={[
          {
            label: "Turmas",
            to: "/professor/turmas",
          },
          {
            label: classroom.name,
          },
        ]}
      />

      <PageHeader
        eyebrow={classroom.subject}
        title={classroom.name}
        description={`${classroom.schoolYear} · ${getStudentCountLabel(
          classroom.studentCount,
        )}`}
        actions={
          <div className="teacher-classroom-details-header-actions">
            <StatusBadge
              tone={
                classroom.active
                  ? "success"
                  : "neutral"
              }
            >
              {classroom.active
                ? "Ativa"
                : "Arquivada"}
            </StatusBadge>

            {classroom.active && (
              <>
                <Button
                  variant="secondary"
                  icon={
                    managementPanel ===
                    "associate" ? (
                      <X
                        size={16}
                        strokeWidth={2}
                      />
                    ) : (
                      <Link2
                        size={16}
                        strokeWidth={1.9}
                      />
                    )
                  }
                  onClick={() =>
                    toggleManagementPanel(
                      "associate",
                    )
                  }
                >
                  {managementPanel ===
                  "associate"
                    ? "Fechar associação"
                    : "Associar existente"}
                </Button>

                <Button
                  variant={
                    managementPanel ===
                    "create"
                      ? "secondary"
                      : "primary"
                  }
                  icon={
                    managementPanel ===
                    "create" ? (
                      <X
                        size={16}
                        strokeWidth={2}
                      />
                    ) : (
                      <UserPlus
                        size={16}
                        strokeWidth={1.9}
                      />
                    )
                  }
                  onClick={() =>
                    toggleManagementPanel(
                      "create",
                    )
                  }
                >
                  {managementPanel ===
                  "create"
                    ? "Fechar cadastro"
                    : "Novo estudante"}
                </Button>
              </>
            )}
          </div>
        }
      />

      {!classroom.active && (
        <FeedbackBanner
          tone="info"
          title="Turma arquivada"
          description="Os estudantes e dados da turma permanecem disponíveis para consulta. Restaure a turma para cadastrar, associar ou remover estudantes."
        />
      )}

      {managementSuccess && (
        <FeedbackBanner
          tone="success"
          title="Gestão de estudantes atualizada"
          description={
            managementSuccess
          }
        />
      )}

      {managementError && (
        <FeedbackBanner
          tone="error"
          title="Não foi possível concluir a operação"
          description={managementError}
        />
      )}

      <section
        className="teacher-classroom-details-overview"
        aria-label="Resumo da turma"
      >
        <StatCard
          label="Disciplina"
          value={classroom.subject}
          description="Componente curricular"
          icon={BookOpenText}
          tone="primary"
        />

        <StatCard
          label="Ano letivo"
          value={classroom.schoolYear}
          description="Contexto da turma"
          icon={CalendarDays}
          tone="neutral"
        />

        <StatCard
          label="Estudantes"
          value={classroom.studentCount}
          description="Vínculos na turma"
          icon={UsersRound}
          tone="teal"
        />

        <StatCard
          label="Estudantes ativos"
          value={activeStudentCount}
          description="Acessos disponíveis"
          icon={CheckCircle2}
          tone={
            activeStudentCount > 0
              ? "neutral"
              : "warning"
          }
        />
      </section>

      {classroom.active &&
        managementPanel === "create" && (
          <section className="teacher-classroom-management-panel">
            <div className="teacher-classroom-panel-header">
              <div>
                <h2>
                  Cadastrar novo estudante
                </h2>

                <p>
                  Crie o acesso do
                  estudante e associe-o
                  automaticamente a esta
                  turma.
                </p>
              </div>
            </div>

            <StudentCreationForm
              onSubmit={
                handleCreateStudent
              }
              onCancel={() =>
                setManagementPanel(null)
              }
            />
          </section>
        )}

      {classroom.active &&
        managementPanel ===
          "associate" && (
          <section className="teacher-classroom-management-panel">
            <div className="teacher-classroom-panel-header">
              <div>
                <h2>
                  Associar estudante
                  existente
                </h2>

                <p>
                  Selecione um estudante
                  já cadastrado. Um mesmo
                  estudante pode participar
                  de mais de uma turma.
                </p>
              </div>

              <span className="teacher-classroom-panel-count">
                {availableStudents.length}{" "}
                disponíveis
              </span>
            </div>

            <div className="teacher-classroom-association">
              <div className="teacher-classroom-association-field">
                <label htmlFor="student-association">
                  Estudante disponível
                </label>

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
                    availableStudents.length ===
                      0
                  }
                  autoFocus
                >
                  <option value="">
                    {availableStudents.length >
                    0
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
                        {!student.active
                          ? " — Inativo"
                          : ""}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="teacher-classroom-association-actions">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setManagementPanel(
                      null,
                    )
                  }
                  disabled={isAssociating}
                >
                  Cancelar
                </Button>

                <Button
                  icon={
                    <Link2
                      size={16}
                      strokeWidth={1.9}
                    />
                  }
                  onClick={() =>
                    void handleAddStudent()
                  }
                  disabled={
                    !selectedStudentId ||
                    isAssociating
                  }
                >
                  {isAssociating
                    ? "Associando..."
                    : "Adicionar à turma"}
                </Button>
              </div>
            </div>
          </section>
        )}

      <section className="teacher-classroom-students-panel">
        <div className="teacher-classroom-panel-header">
          <div>
            <h2>
              Estudantes da turma
            </h2>

            <p>
              Consulte os estudantes
              associados e gerencie seus
              vínculos com esta turma.
            </p>
          </div>

          <span className="teacher-classroom-panel-count">
            {classroom.studentCount}{" "}
            {classroom.studentCount === 1
              ? "estudante"
              : "estudantes"}
          </span>
        </div>

        {classroomStudents.length >
          0 && (
          <div className="teacher-classroom-students-toolbar">
            <SearchField
              id="classroom-student-search"
              value={searchTerm}
              onChange={setSearchTerm}
              label="Pesquisar estudantes"
              placeholder="Buscar por nome, matrícula ou situação..."
              resultCount={
                filteredStudents.length
              }
              totalCount={
                classroomStudents.length
              }
            />
          </div>
        )}

        {classroomStudents.length ===
        0 ? (
          <PageState
            icon={GraduationCap}
            title="Nenhum estudante associado"
            description={
              classroom.active
                ? "Cadastre um estudante novo ou associe um estudante já existente."
                : "Esta turma foi arquivada sem estudantes associados."
            }
            tone="primary"
            action={
              classroom.active ? (
                <Button
                  icon={
                    <UserPlus
                      size={16}
                      strokeWidth={1.9}
                    />
                  }
                  onClick={() =>
                    setManagementPanel(
                      "create",
                    )
                  }
                >
                  Novo estudante
                </Button>
              ) : undefined
            }
          />
        ) : filteredStudents.length ===
          0 ? (
          <PageState
            icon={SearchX}
            title="Nenhum estudante encontrado"
            description={`Não encontramos estudantes correspondentes a “${searchTerm}”.`}
            action={
              <Button
                variant="secondary"
                onClick={() =>
                  setSearchTerm("")
                }
              >
                Limpar pesquisa
              </Button>
            }
          />
        ) : (
          <>
            <div className="teacher-classroom-student-table-wrapper">
              <table className="teacher-classroom-student-table">
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
                    (student) => {
                      const isRemoving =
                        removingStudentId ===
                        student.id;

                      return (
                        <tr
                          key={student.id}
                        >
                          <td>
                            <div className="teacher-classroom-student-identity">
                              <span
                                className="teacher-classroom-student-avatar"
                                aria-hidden="true"
                              >
                                {getStudentInitials(
                                  student.name,
                                )}
                              </span>

                              <div>
                                <strong>
                                  {
                                    student.name
                                  }
                                </strong>

                                <span>
                                  Estudante
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {student.registration ??
                              "Não informada"}
                          </td>

                          <td>
                            <StatusBadge
                              tone={
                                student.active
                                  ? "success"
                                  : "neutral"
                              }
                            >
                              {student.active
                                ? "Ativo"
                                : "Inativo"}
                            </StatusBadge>
                          </td>

                          <td>
                            {classroom.active ? (
                              <Button
                                variant="danger"
                                className="teacher-classroom-student-remove"
                                icon={
                                  <Trash2
                                    size={15}
                                    strokeWidth={1.9}
                                  />
                                }
                                disabled={
                                  removingStudentId !==
                                  null
                                }
                                onClick={() =>
                                  void handleRemoveStudent(
                                    student.id,
                                    student.name,
                                  )
                                }
                              >
                                {isRemoving
                                  ? "Removendo..."
                                  : "Remover vínculo"}
                              </Button>
                            ) : (
                              <span className="teacher-classroom-read-only">
                                Somente consulta
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            <div
              className="teacher-classroom-student-card-list"
              aria-label="Estudantes da turma"
            >
              {filteredStudents.map(
                (student) => {
                  const isRemoving =
                    removingStudentId ===
                    student.id;

                  return (
                    <article
                      key={student.id}
                      className="teacher-classroom-student-card"
                    >
                      <header className="teacher-classroom-student-card-header">
                        <div className="teacher-classroom-student-identity">
                          <span
                            className="teacher-classroom-student-avatar"
                            aria-hidden="true"
                          >
                            {getStudentInitials(
                              student.name,
                            )}
                          </span>

                          <div>
                            <strong>
                              {student.name}
                            </strong>

                            <span>
                              Estudante
                            </span>
                          </div>
                        </div>

                        <StatusBadge
                          tone={
                            student.active
                              ? "success"
                              : "neutral"
                          }
                        >
                          {student.active
                            ? "Ativo"
                            : "Inativo"}
                        </StatusBadge>
                      </header>

                      <dl className="teacher-classroom-student-card-metadata">
                        <div>
                          <dt>Matrícula</dt>

                          <dd>
                            {student.registration ??
                              "Não informada"}
                          </dd>
                        </div>

                        <div>
                          <dt>Vínculo</dt>

                          <dd>
                            {classroom.active
                              ? "Turma ativa"
                              : "Histórico preservado"}
                          </dd>
                        </div>
                      </dl>

                      {classroom.active && (
                        <footer className="teacher-classroom-student-card-footer">
                          <Button
                            variant="danger"
                            icon={
                              <Trash2
                                size={15}
                                strokeWidth={1.9}
                              />
                            }
                            disabled={
                              removingStudentId !==
                              null
                            }
                            onClick={() =>
                              void handleRemoveStudent(
                                student.id,
                                student.name,
                              )
                            }
                          >
                            {isRemoving
                              ? "Removendo..."
                              : "Remover da turma"}
                          </Button>
                        </footer>
                      )}
                    </article>
                  );
                },
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}