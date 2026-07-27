import {
  Archive,
  ArrowRight,
  Layers3,
  LoaderCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  SearchX,
  UsersRound,
  X,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router";

import { ClassroomCreationForm } from "../components/ClassroomCreationForm";
import { Button } from "../components/ui/Button";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { PageHeader } from "../components/ui/PageHeader";
import { PageState } from "../components/ui/PageState";
import { SearchField } from "../components/ui/SearchField";
import { StatCard } from "../components/ui/StatCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { getErrorMessage } from "../lib/get-error-message";
import { normalizeSearch } from "../lib/normalize-search";
import {
  createTeacherClassroom,
  getTeacherClassrooms,
  updateTeacherClassroomStatus,
} from "../services/teacher-api";
import type {
  CreateTeacherClassroomInput,
  TeacherClassroom,
} from "../types/teacher";

import "../styles/teacher-classrooms.css";

type ClassroomView =
  | "active"
  | "archived";

function getStudentLabel(
  studentCount: number,
): string {
  return studentCount === 1
    ? "1 estudante"
    : `${studentCount} estudantes`;
}

function sortClassrooms(
  classrooms: TeacherClassroom[],
): TeacherClassroom[] {
  return [...classrooms].sort(
    (firstClassroom, secondClassroom) =>
      firstClassroom.name.localeCompare(
        secondClassroom.name,
        "pt-BR",
      ),
  );
}

export function TeacherClassroomsPage() {
  const [classrooms, setClassrooms] =
    useState<TeacherClassroom[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    managementSuccess,
    setManagementSuccess,
  ] = useState<string | null>(null);

  const [
    managementError,
    setManagementError,
  ] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [classroomView, setClassroomView] =
    useState<ClassroomView>("active");

  const [
    updatingClassroomId,
    setUpdatingClassroomId,
  ] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  const deferredSearchTerm =
    useDeferredValue(searchTerm);

  useEffect(() => {
    let isCancelled = false;

    async function loadClassrooms() {
      setIsLoading(true);
      setError(null);

      try {
        const classroomList =
          await getTeacherClassrooms(
            "all",
          );

        if (!isCancelled) {
          setClassrooms(
            sortClassrooms(classroomList),
          );
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

  const activeClassrooms =
    useMemo(
      () =>
        classrooms.filter(
          (classroom) =>
            classroom.active,
        ),
      [classrooms],
    );

  const archivedClassrooms =
    useMemo(
      () =>
        classrooms.filter(
          (classroom) =>
            !classroom.active,
        ),
      [classrooms],
    );

  const classroomsInCurrentView =
    classroomView === "active"
      ? activeClassrooms
      : archivedClassrooms;

  const filteredClassrooms =
    useMemo(() => {
      const normalizedTerm =
        normalizeSearch(
          deferredSearchTerm,
        );

      if (!normalizedTerm) {
        return classroomsInCurrentView;
      }

      return classroomsInCurrentView.filter(
        (classroom) => {
          const searchableContent =
            normalizeSearch(
              [
                classroom.name,
                classroom.subject,
                classroom.schoolYear,
              ].join(" "),
            );

          return searchableContent.includes(
            normalizedTerm,
          );
        },
      );
    }, [
      classroomsInCurrentView,
      deferredSearchTerm,
    ]);

  const activeStudentCount =
    useMemo(
      () =>
        activeClassrooms.reduce(
          (total, classroom) =>
            total +
            classroom.studentCount,
          0,
        ),
      [activeClassrooms],
    );

  async function handleCreateClassroom(
    input: CreateTeacherClassroomInput,
  ): Promise<boolean> {
    setManagementSuccess(null);
    setManagementError(null);

    try {
      const createdClassroom =
        await createTeacherClassroom(
          input,
        );

      setClassrooms(
        (currentClassrooms) =>
          sortClassrooms([
            ...currentClassrooms,
            createdClassroom,
          ]),
      );

      setClassroomView("active");
      setSearchTerm("");
      setIsCreateOpen(false);

      setManagementSuccess(
        `${createdClassroom.name} foi criada com sucesso.`,
      );

      return true;
    } catch (caughtError) {
      setManagementError(
        getErrorMessage(
          caughtError,
          "Não foi possível criar a turma.",
        ),
      );

      return false;
    }
  }

  async function handleStatusChange(
    classroom: TeacherClassroom,
    active: boolean,
  ) {
    const actionLabel = active
      ? "restaurar"
      : "arquivar";

    const confirmationMessage = active
      ? `Restaurar a turma ${classroom.name}?\n\nEla voltará a aparecer para gestão e suas avaliações poderão ficar disponíveis aos estudantes.`
      : `Arquivar a turma ${classroom.name}?\n\nA turma sairá da lista ativa, mas estudantes, avaliações e resultados serão preservados.`;

    const shouldContinue =
      window.confirm(
        confirmationMessage,
      );

    if (!shouldContinue) {
      return;
    }

    setUpdatingClassroomId(
      classroom.id,
    );

    setManagementSuccess(null);
    setManagementError(null);

    try {
      const updatedClassroom =
        await updateTeacherClassroomStatus(
          classroom.id,
          active,
        );

      setClassrooms(
        (currentClassrooms) =>
          sortClassrooms(
            currentClassrooms.map(
              (currentClassroom) =>
                currentClassroom.id ===
                updatedClassroom.id
                  ? updatedClassroom
                  : currentClassroom,
            ),
          ),
      );

      setManagementSuccess(
        active
          ? `${classroom.name} foi restaurada com sucesso.`
          : `${classroom.name} foi arquivada com sucesso.`,
      );
    } catch (caughtError) {
      setManagementError(
        getErrorMessage(
          caughtError,
          `Não foi possível ${actionLabel} a turma.`,
        ),
      );
    } finally {
      setUpdatingClassroomId(null);
    }
  }

  function changeClassroomView(
    view: ClassroomView,
  ) {
    setClassroomView(view);
    setSearchTerm("");
    setManagementSuccess(null);
    setManagementError(null);
  }

  function toggleCreationForm() {
    setIsCreateOpen(
      (currentValue) =>
        !currentValue,
    );

    setManagementError(null);
  }

  return (
    <div className="teacher-classrooms-page">
      <PageHeader
        eyebrow="Gestão de turmas"
        title="Turmas"
        description="Consulte as turmas acompanhadas, seus contextos pedagógicos e os estudantes vinculados."
        actions={
          <Button
            variant={
              isCreateOpen
                ? "secondary"
                : "primary"
            }
            icon={
              isCreateOpen ? (
                <X
                  size={17}
                  strokeWidth={2}
                />
              ) : (
                <Plus
                  size={17}
                  strokeWidth={2}
                />
              )
            }
            onClick={toggleCreationForm}
          >
            {isCreateOpen
              ? "Fechar formulário"
              : "Nova turma"}
          </Button>
        }
      />

      {managementSuccess && (
        <FeedbackBanner
          tone="success"
          title="Gestão de turmas atualizada"
          description={managementSuccess}
        />
      )}

      {managementError && (
        <FeedbackBanner
          tone="error"
          title="Não foi possível concluir a operação"
          description={managementError}
        />
      )}

      {isCreateOpen && (
        <section className="teacher-classrooms-creation">
          <div className="teacher-classrooms-creation-header">
            <h2>Nova turma</h2>

            <p>
              Informe o contexto básico da
              turma. Os estudantes poderão
              ser vinculados depois.
            </p>
          </div>

          <ClassroomCreationForm
            onSubmit={
              handleCreateClassroom
            }
            onCancel={() =>
              setIsCreateOpen(false)
            }
          />
        </section>
      )}

      {!isLoading &&
        !error &&
        classrooms.length > 0 && (
          <section
            className="teacher-classrooms-overview"
            aria-label="Resumo das turmas"
          >
            <StatCard
              label="Turmas ativas"
              value={
                activeClassrooms.length
              }
              description="Disponíveis para gestão"
              icon={Layers3}
              tone="primary"
            />

            <StatCard
              label="Turmas arquivadas"
              value={
                archivedClassrooms.length
              }
              description="Histórico preservado"
              icon={Archive}
              tone="neutral"
            />

            <StatCard
              label="Estudantes vinculados"
              value={activeStudentCount}
              description="Nas turmas ativas"
              icon={UsersRound}
              tone="teal"
            />
          </section>
        )}

      {!isLoading &&
        !error &&
        classrooms.length > 0 && (
          <>
            <section
              className="teacher-classrooms-view-switcher"
              aria-label="Situação das turmas"
            >
              <button
                type="button"
                className={
                  classroomView ===
                  "active"
                    ? "is-active"
                    : ""
                }
                aria-pressed={
                  classroomView ===
                  "active"
                }
                onClick={() =>
                  changeClassroomView(
                    "active",
                  )
                }
              >
                Ativas
                <span>
                  {activeClassrooms.length}
                </span>
              </button>

              <button
                type="button"
                className={
                  classroomView ===
                  "archived"
                    ? "is-active"
                    : ""
                }
                aria-pressed={
                  classroomView ===
                  "archived"
                }
                onClick={() =>
                  changeClassroomView(
                    "archived",
                  )
                }
              >
                Arquivadas
                <span>
                  {
                    archivedClassrooms.length
                  }
                </span>
              </button>
            </section>

            {classroomsInCurrentView.length >
              0 && (
              <section className="teacher-classrooms-toolbar">
                <SearchField
                  id="classroom-search"
                  value={searchTerm}
                  onChange={setSearchTerm}
                  label="Pesquisar turmas"
                  placeholder="Buscar por turma, disciplina ou ano escolar..."
                  resultCount={
                    filteredClassrooms.length
                  }
                  totalCount={
                    classroomsInCurrentView.length
                  }
                />
              </section>
            )}
          </>
        )}

      {isLoading && (
        <PageState
          icon={LoaderCircle}
          title="Carregando turmas"
          description="Estamos consultando as turmas e seus estudantes no RadarAprende."
          tone="primary"
          isLoading
        />
      )}

      {!isLoading && error && (
        <FeedbackBanner
          tone="error"
          title="Não foi possível carregar as turmas"
          description={error}
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
      )}

      {!isLoading &&
        !error &&
        classrooms.length === 0 && (
          <PageState
            icon={Layers3}
            title="Nenhuma turma encontrada"
            description="Crie sua primeira turma para começar a organizar estudantes e avaliações."
            tone="primary"
            action={
              <Button
                icon={
                  <Plus
                    size={16}
                    strokeWidth={2}
                  />
                }
                onClick={() =>
                  setIsCreateOpen(true)
                }
              >
                Nova turma
              </Button>
            }
          />
        )}

      {!isLoading &&
        !error &&
        classrooms.length > 0 &&
        classroomsInCurrentView.length ===
          0 && (
          <PageState
            icon={
              classroomView === "active"
                ? Layers3
                : Archive
            }
            title={
              classroomView === "active"
                ? "Nenhuma turma ativa"
                : "Nenhuma turma arquivada"
            }
            description={
              classroomView === "active"
                ? "Restaure uma turma arquivada ou crie uma nova turma."
                : "As turmas arquivadas aparecerão aqui com seus históricos preservados."
            }
            tone={
              classroomView === "active"
                ? "primary"
                : "neutral"
            }
          />
        )}

      {!isLoading &&
        !error &&
        classroomsInCurrentView.length >
          0 &&
        filteredClassrooms.length ===
          0 && (
          <PageState
            icon={SearchX}
            title="Nenhuma turma corresponde à pesquisa"
            description={`Não encontramos resultados para “${searchTerm}”. Tente outro nome, disciplina ou ano escolar.`}
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
        )}

      {!isLoading &&
        !error &&
        filteredClassrooms.length >
          0 && (
          <section
            className="teacher-classrooms-grid"
            aria-label={
              classroomView === "active"
                ? "Turmas ativas"
                : "Turmas arquivadas"
            }
          >
            {filteredClassrooms.map(
              (classroom) => {
                const isUpdating =
                  updatingClassroomId ===
                  classroom.id;

                return (
                  <article
                    key={classroom.id}
                    className={[
                      "teacher-classrooms-card",
                      classroom.active
                        ? ""
                        : "is-archived",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="teacher-classrooms-card-top">
                      <span className="teacher-classrooms-subject">
                        {classroom.subject}
                      </span>

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
                    </div>

                    <h2>
                      {classroom.name}
                    </h2>

                    <p className="teacher-classrooms-card-description">
                      {classroom.active
                        ? "Acompanhe os estudantes e o contexto desta turma."
                        : "Turma preservada para consulta de histórico."}
                    </p>

                    <dl className="teacher-classrooms-metadata">
                      <div>
                        <dt>Ano escolar</dt>

                        <dd>
                          {
                            classroom.schoolYear
                          }
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

                    <div className="teacher-classrooms-card-footer">
                      {classroom.active ? (
                        <Link
                          to={`/professor/turmas/${classroom.id}`}
                          className="teacher-classrooms-card-link"
                        >
                          Ver detalhes

                          <ArrowRight
                            size={16}
                            strokeWidth={1.9}
                            aria-hidden="true"
                          />
                        </Link>
                      ) : (
                        <span className="teacher-classrooms-card-archive-note">
                          Histórico preservado
                        </span>
                      )}

                      <Button
                        variant={
                          classroom.active
                            ? "secondary"
                            : "primary"
                        }
                        className="teacher-classrooms-card-action"
                        icon={
                          classroom.active ? (
                            <Archive
                              size={15}
                              strokeWidth={1.9}
                            />
                          ) : (
                            <RotateCcw
                              size={15}
                              strokeWidth={1.9}
                            />
                          )
                        }
                        disabled={
                          updatingClassroomId !==
                          null
                        }
                        onClick={() =>
                          void handleStatusChange(
                            classroom,
                            !classroom.active,
                          )
                        }
                      >
                        {isUpdating
                          ? classroom.active
                            ? "Arquivando..."
                            : "Restaurando..."
                          : classroom.active
                            ? "Arquivar"
                            : "Restaurar"}
                      </Button>
                    </div>
                  </article>
                );
              },
            )}
          </section>
        )}
    </div>
  );
}