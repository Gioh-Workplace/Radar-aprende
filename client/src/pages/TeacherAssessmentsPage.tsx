import {
  Archive,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FilePenLine,
  FileText,
  FilterX,
  LoaderCircle,
  Plus,
  RefreshCw,
  SearchX,
  Send,
  X,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router";

import { AssessmentCreationForm } from "../components/AssessmentCreationForm";
import {
  Button,
  ButtonLink,
} from "../components/ui/Button";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { PageHeader } from "../components/ui/PageHeader";
import { PageState } from "../components/ui/PageState";
import { SearchField } from "../components/ui/SearchField";
import { StatCard } from "../components/ui/StatCard";
import {
  StatusBadge,
  type StatusBadgeTone,
} from "../components/ui/StatusBadge";
import { getErrorMessage } from "../lib/get-error-message";
import { normalizeSearch } from "../lib/normalize-search";
import {
  createTeacherAssessment,
  getTeacherAssessments,
  getTeacherClassrooms,
} from "../services/teacher-api";
import type {
  AssessmentStatus,
  CreateTeacherAssessmentInput,
  TeacherAssessment,
  TeacherClassroom,
} from "../types/teacher";

import "../styles/teacher-assessments.css";

interface StatusOption {
  value: AssessmentStatus | "";
  label: string;
}

interface StatusPresentation {
  label: string;
  tone: StatusBadgeTone;
}

const statusOptions: StatusOption[] = [
  {
    value: "",
    label: "Todos os status",
  },
  {
    value: "DRAFT",
    label: "Rascunho",
  },
  {
    value: "PUBLISHED",
    label: "Publicada",
  },
  {
    value: "CLOSED",
    label: "Encerrada",
  },
];

function getStatusPresentation(
  status: AssessmentStatus,
): StatusPresentation {
  const presentations: Record<
    AssessmentStatus,
    StatusPresentation
  > = {
    DRAFT: {
      label: "Rascunho",
      tone: "warning",
    },
    PUBLISHED: {
      label: "Publicada",
      tone: "success",
    },
    CLOSED: {
      label: "Encerrada",
      tone: "neutral",
    },
  };

  return presentations[status];
}

function getQuestionCountLabel(
  questionCount: number,
): string {
  return questionCount === 1
    ? "1 questão"
    : `${questionCount} questões`;
}

function getAssessmentCountLabel(
  assessmentCount: number,
): string {
  return assessmentCount === 1
    ? "1 avaliação"
    : `${assessmentCount} avaliações`;
}

function getAssessmentNextStep(
  status: AssessmentStatus,
): string {
  const nextSteps: Record<
    AssessmentStatus,
    string
  > = {
    DRAFT:
      "Adicione questões, revise o conteúdo e publique quando estiver pronta.",
    PUBLISHED:
      "Acompanhe participação, desempenho e recomendações pedagógicas.",
    CLOSED:
      "Consulte os resultados e o histórico preservado desta avaliação.",
  };

  return nextSteps[status];
}

function formatAssessmentDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function getTimestamp(
  value: string,
): number {
  const timestamp =
    new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}

function sortAssessments(
  assessments: TeacherAssessment[],
): TeacherAssessment[] {
  return [...assessments].sort(
    (firstAssessment, secondAssessment) =>
      getTimestamp(
        secondAssessment.createdAt,
      ) -
      getTimestamp(
        firstAssessment.createdAt,
      ),
  );
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

export function TeacherAssessmentsPage() {
  const [assessments, setAssessments] =
    useState<TeacherAssessment[]>([]);

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

  const [
    createdAssessmentId,
    setCreatedAssessmentId,
  ] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<AssessmentStatus | "">("");

  const [
    classroomFilter,
    setClassroomFilter,
  ] = useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  const deferredSearchTerm =
    useDeferredValue(searchTerm);

  useEffect(() => {
    let isCancelled = false;

    async function loadAssessmentsPage() {
      setIsLoading(true);
      setError(null);

      try {
        const [
          assessmentList,
          classroomList,
        ] = await Promise.all([
          getTeacherAssessments(),
          getTeacherClassrooms("all"),
        ]);

        if (isCancelled) {
          return;
        }

        setAssessments(
          sortAssessments(
            assessmentList,
          ),
        );

        setClassrooms(
          sortClassrooms(
            classroomList,
          ),
        );
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setError(
          getErrorMessage(
            caughtError,
            "Não foi possível carregar as avaliações.",
          ),
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAssessmentsPage();

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

  const classroomById =
    useMemo(
      () =>
        new Map(
          classrooms.map(
            (classroom) => [
              classroom.id,
              classroom,
            ],
          ),
        ),
      [classrooms],
    );

  const assessmentCounts =
    useMemo(
      () => ({
        drafts: assessments.filter(
          (assessment) =>
            assessment.status ===
            "DRAFT",
        ).length,

        published: assessments.filter(
          (assessment) =>
            assessment.status ===
            "PUBLISHED",
        ).length,

        closed: assessments.filter(
          (assessment) =>
            assessment.status ===
            "CLOSED",
        ).length,
      }),
      [assessments],
    );

  const filteredAssessments =
    useMemo(() => {
      const normalizedTerm =
        normalizeSearch(
          deferredSearchTerm,
        );

      return assessments.filter(
        (assessment) => {
          if (
            statusFilter &&
            assessment.status !==
              statusFilter
          ) {
            return false;
          }

          if (
            classroomFilter &&
            assessment.classroomId !==
              classroomFilter
          ) {
            return false;
          }

          if (!normalizedTerm) {
            return true;
          }

          const classroom =
            classroomById.get(
              assessment.classroomId,
            );

          const status =
            getStatusPresentation(
              assessment.status,
            );

          const searchableContent =
            normalizeSearch(
              [
                assessment.title,
                assessment.description,
                classroom?.name,
                classroom?.subject,
                status.label,
              ].join(" "),
            );

          return searchableContent.includes(
            normalizedTerm,
          );
        },
      );
    }, [
      assessments,
      classroomById,
      classroomFilter,
      deferredSearchTerm,
      statusFilter,
    ]);

  const hasActiveFilters =
    Boolean(
      searchTerm ||
      statusFilter ||
      classroomFilter,
    );

  async function handleCreateAssessment(
    input: CreateTeacherAssessmentInput,
  ): Promise<boolean> {
    setManagementSuccess(null);
    setManagementError(null);
    setCreatedAssessmentId(null);

    try {
      const createdAssessment =
        await createTeacherAssessment(
          input,
        );

      setAssessments(
        (currentAssessments) =>
          sortAssessments([
            createdAssessment,
            ...currentAssessments,
          ]),
      );

      const classroom =
        classroomById.get(
          createdAssessment.classroomId,
        );

      setManagementSuccess(
        `${createdAssessment.title} foi criada como rascunho${
          classroom
            ? ` para ${classroom.name}`
            : ""
        }.`,
      );

      setCreatedAssessmentId(
        createdAssessment.id,
      );

      setSearchTerm("");
      setStatusFilter("");
      setClassroomFilter("");
      setIsCreateOpen(false);

      return true;
    } catch (caughtError) {
      setManagementError(
        getErrorMessage(
          caughtError,
          "Não foi possível criar a avaliação.",
        ),
      );

      return false;
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("");
    setClassroomFilter("");
  }

  function toggleCreationForm() {
    setIsCreateOpen(
      (currentValue) =>
        !currentValue,
    );

    setManagementError(null);
  }

  return (
    <div className="teacher-assessments-page">
      <PageHeader
        eyebrow="Diagnósticos"
        title="Avaliações"
        description="Crie avaliações diagnósticas, organize os rascunhos e acompanhe os resultados das turmas."
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
            onClick={
              toggleCreationForm
            }
            disabled={isLoading}
          >
            {isCreateOpen
              ? "Fechar formulário"
              : "Nova avaliação"}
          </Button>
        }
      />

      {managementSuccess && (
        <FeedbackBanner
          tone="success"
          title="Rascunho criado"
          description={
            managementSuccess
          }
          action={
            createdAssessmentId ? (
              <ButtonLink
                to={`/professor/avaliacoes/${createdAssessmentId}`}
                variant="secondary"
                icon={
                  <ArrowRight
                    size={16}
                    strokeWidth={1.9}
                  />
                }
              >
                Adicionar questões
              </ButtonLink>
            ) : undefined
          }
        />
      )}

      {managementError && (
        <FeedbackBanner
          tone="error"
          title="Não foi possível criar a avaliação"
          description={
            managementError
          }
        />
      )}

      {isCreateOpen && (
        <section className="teacher-assessments-creation">
          <div className="teacher-assessments-creation-header">
            <h2>Nova avaliação</h2>

            <p>
              Crie o rascunho com as
              informações principais. As
              questões serão adicionadas na
              próxima etapa.
            </p>
          </div>

          {activeClassrooms.length >
          0 ? (
            <AssessmentCreationForm
              classrooms={
                activeClassrooms
              }
              onSubmit={
                handleCreateAssessment
              }
              onCancel={() =>
                setIsCreateOpen(false)
              }
            />
          ) : (
            <div className="teacher-assessments-no-classroom">
              <strong>
                Nenhuma turma ativa
              </strong>

              <p>
                Restaure uma turma
                arquivada ou crie uma nova
                turma antes de cadastrar a
                avaliação.
              </p>
            </div>
          )}
        </section>
      )}

      {!isLoading && !error && (
        <section
          className="teacher-assessments-overview"
          aria-label="Resumo das avaliações"
        >
          <StatCard
            label="Avaliações"
            value={assessments.length}
            description="Diagnósticos cadastrados"
            icon={FileText}
            tone="primary"
          />

          <StatCard
            label="Rascunhos"
            value={
              assessmentCounts.drafts
            }
            description="Aguardando conclusão"
            icon={FilePenLine}
            tone="warning"
          />

          <StatCard
            label="Publicadas"
            value={
              assessmentCounts.published
            }
            description="Disponíveis aos alunos"
            icon={Send}
            tone="teal"
          />

          <StatCard
            label="Encerradas"
            value={
              assessmentCounts.closed
            }
            description="Histórico preservado"
            icon={Archive}
            tone="neutral"
          />
        </section>
      )}

      {isLoading && (
        <PageState
          icon={LoaderCircle}
          title="Carregando avaliações"
          description="Estamos consultando os diagnósticos cadastrados no RadarAprende."
          tone="primary"
          isLoading
        />
      )}

      {!isLoading && error && (
        <FeedbackBanner
          tone="error"
          title="Não foi possível carregar as avaliações"
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
        assessments.length > 0 && (
          <section className="teacher-assessments-toolbar">
            <SearchField
              id="assessment-search"
              value={searchTerm}
              onChange={setSearchTerm}
              label="Pesquisar avaliações"
              placeholder="Buscar por título, turma, disciplina ou descrição..."
            />

            <div className="teacher-assessments-filter">
              <label htmlFor="assessment-status-filter">
                Status
              </label>

              <select
                id="assessment-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | AssessmentStatus
                      | "",
                  )
                }
              >
                {statusOptions.map(
                  (option) => (
                    <option
                      key={
                        option.value ||
                        "all"
                      }
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="teacher-assessments-filter">
              <label htmlFor="assessment-classroom-filter">
                Turma
              </label>

              <select
                id="assessment-classroom-filter"
                value={classroomFilter}
                onChange={(event) =>
                  setClassroomFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Todas as turmas
                </option>

                {classrooms.map(
                  (classroom) => (
                    <option
                      key={classroom.id}
                      value={classroom.id}
                    >
                      {classroom.name}
                      {!classroom.active
                        ? " — Arquivada"
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="teacher-assessments-toolbar-action">
              <span
                className="teacher-assessments-result-count"
                aria-live="polite"
              >
                {hasActiveFilters
                  ? `${filteredAssessments.length} de ${assessments.length}`
                  : getAssessmentCountLabel(
                      assessments.length,
                    )}
              </span>

              {hasActiveFilters && (
                <Button
                  variant="secondary"
                  icon={
                    <FilterX
                      size={16}
                      strokeWidth={1.9}
                    />
                  }
                  onClick={clearFilters}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </section>
        )}

      {!isLoading &&
        !error &&
        assessments.length === 0 && (
          <PageState
            icon={ClipboardCheck}
            title="Nenhuma avaliação cadastrada"
            description="Crie o primeiro diagnóstico para começar a avaliar as habilidades das turmas."
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
                Nova avaliação
              </Button>
            }
          />
        )}

      {!isLoading &&
        !error &&
        assessments.length > 0 &&
        filteredAssessments.length ===
          0 && (
          <PageState
            icon={SearchX}
            title="Nenhuma avaliação corresponde aos filtros"
            description="Tente outro termo, status ou turma."
            action={
              <Button
                variant="secondary"
                icon={
                  <FilterX
                    size={16}
                    strokeWidth={1.9}
                  />
                }
                onClick={clearFilters}
              >
                Limpar filtros
              </Button>
            }
          />
        )}

      {!isLoading &&
        !error &&
        filteredAssessments.length >
          0 && (
          <section
            className="teacher-assessments-grid"
            aria-label="Avaliações cadastradas"
          >
            {filteredAssessments.map(
              (assessment) => {
                const classroom =
                  classroomById.get(
                    assessment.classroomId,
                  );

                const status =
                  getStatusPresentation(
                    assessment.status,
                  );

                const hasDescription =
                  Boolean(
                    assessment.description?.trim(),
                  );

                const isDraft =
                  assessment.status ===
                  "DRAFT";

                return (
                  <article
                    key={assessment.id}
                    className="teacher-assessments-card"
                  >
                    <div className="teacher-assessments-card-top">
                      <div className="teacher-assessments-card-badges">
                        <StatusBadge
                          tone={status.tone}
                        >
                          {status.label}
                        </StatusBadge>

                        {classroom &&
                          !classroom.active && (
                            <StatusBadge tone="neutral">
                              Turma arquivada
                            </StatusBadge>
                          )}
                      </div>

                      <span className="teacher-assessments-date">
                        <CalendarDays
                          size={14}
                          strokeWidth={1.9}
                          aria-hidden="true"
                        />

                        {formatAssessmentDate(
                          assessment.createdAt,
                        )}
                      </span>
                    </div>

                    <Link
                      to={`/professor/avaliacoes/${assessment.id}`}
                      className="teacher-assessments-title-link"
                      aria-label={`Abrir ${assessment.title}`}
                    >
                      <h2>{assessment.title}</h2>
                    </Link>

                    <p
                      className={[
                        "teacher-assessments-description",
                        hasDescription
                          ? ""
                          : "is-empty",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {assessment.description ??
                        "Nenhuma descrição informada."}
                    </p>

                    <dl className="teacher-assessments-metadata">
                      <div>
                        <dt>Turma</dt>

                        <dd>
                          {classroom?.name ??
                            "Turma indisponível"}
                        </dd>
                      </div>

                      <div>
                        <dt>Questões</dt>

                        <dd>
                          {getQuestionCountLabel(
                            assessment.questionCount,
                          )}
                        </dd>
                      </div>
                    </dl>

                    <div className="teacher-assessments-next-step">
                      {isDraft ? (
                        <FilePenLine
                          size={16}
                          strokeWidth={1.9}
                          aria-hidden="true"
                        />
                      ) : (
                        <BarChart3
                          size={16}
                          strokeWidth={1.9}
                          aria-hidden="true"
                        />
                      )}

                      <span>
                        {getAssessmentNextStep(
                          assessment.status,
                        )}
                      </span>
                    </div>

                    <footer className="teacher-assessments-card-footer">
                      <ButtonLink
                        to={
                          isDraft
                            ? `/professor/avaliacoes/${assessment.id}`
                            : `/professor/avaliacoes/${assessment.id}/resultados`
                        }
                        variant={
                          isDraft
                            ? "secondary"
                            : "primary"
                        }
                        icon={
                          <ArrowRight
                            size={16}
                            strokeWidth={1.9}
                          />
                        }
                      >
                        {isDraft
                          ? "Continuar edição"
                          : "Ver resultados"}
                      </ButtonLink>
                    </footer>
                  </article>
                );
              },
            )}
          </section>
        )}
    </div>
  );
}