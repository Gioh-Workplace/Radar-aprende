import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AssessmentCreationForm } from "../components/AssessmentCreationForm";
import { DataSearch } from "../components/DataSearch";
import { TeacherPageHeader } from "../components/TeacherPageHeader";
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

interface StatusOption {
  value: AssessmentStatus | "";
  label: string;
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

function getStatusLabel(
  status: AssessmentStatus,
): string {
  const labels: Record<
    AssessmentStatus,
    string
  > = {
    DRAFT: "Rascunho",
    PUBLISHED: "Publicada",
    CLOSED: "Encerrada",
  };

  return labels[status];
}

function getStatusClassName(
  status: AssessmentStatus,
): string {
  const classNames: Record<
    AssessmentStatus,
    string
  > = {
    DRAFT: "is-draft",
    PUBLISHED: "is-published",
    CLOSED: "is-closed",
  };

  return classNames[status];
}

function getQuestionCountLabel(
  questionCount: number,
): string {
  return questionCount === 1
    ? "1 questão"
    : `${questionCount} questões`;
}

function formatAssessmentDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
}

function sortAssessments(
  assessments: TeacherAssessment[],
): TeacherAssessment[] {
  return [...assessments].sort(
    (firstAssessment, secondAssessment) =>
      new Date(
        secondAssessment.createdAt,
      ).getTime() -
      new Date(
        firstAssessment.createdAt,
      ).getTime(),
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
          getTeacherClassrooms(),
        ]);

        if (isCancelled) {
          return;
        }

        setAssessments(
          sortAssessments(
            assessmentList,
          ),
        );

        setClassrooms(classroomList);
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

  const classroomById = useMemo(
    () =>
      new Map(
        classrooms.map((classroom) => [
          classroom.id,
          classroom,
        ]),
      ),
    [classrooms],
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

          const searchableContent =
            normalizeSearch(
              [
                assessment.title,
                assessment.description,
                classroom?.name,
                classroom?.subject,
                getStatusLabel(
                  assessment.status,
                ),
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

  async function handleCreateAssessment(
    input: CreateTeacherAssessmentInput,
  ): Promise<boolean> {
    setManagementSuccess(null);
    setManagementError(null);

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

  const hasActiveFilters =
    Boolean(
      searchTerm ||
      statusFilter ||
      classroomFilter,
    );

  return (
    <>
      <TeacherPageHeader
        eyebrow="Diagnósticos"
        title="Avaliações"
        description="Crie avaliações diagnósticas, publique atividades e acompanhe os resultados."
      />

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

      <section className="teacher-panel">
        <div className="teacher-panel-header">
          <h2>Nova avaliação</h2>

          <p>
            Crie um rascunho e depois
            adicione as questões antes de
            publicá-lo.
          </p>
        </div>

        {classrooms.length === 0 &&
        !isLoading ? (
          <div className="teacher-empty-state">
            <h2>
              Cadastre uma turma primeiro
            </h2>

            <p>
              Uma avaliação precisa estar
              vinculada a uma turma.
            </p>
          </div>
        ) : (
          <AssessmentCreationForm
            classrooms={classrooms}
            onSubmit={
              handleCreateAssessment
            }
          />
        )}
      </section>

      {isLoading && (
        <section
          className="teacher-feedback"
          aria-live="polite"
        >
          <div>
            <strong>
              Carregando avaliações...
            </strong>

            <p>
              Estamos consultando os
              diagnósticos cadastrados.
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
              as avaliações
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
        assessments.length > 0 && (
          <>
            <DataSearch
              value={searchTerm}
              onChange={setSearchTerm}
              label="Pesquisar avaliações"
              placeholder="Buscar por título, descrição, turma ou disciplina..."
              resultCount={
                filteredAssessments.length
              }
              totalCount={
                assessments.length
              }
            />

            <div className="teacher-filter-row teacher-filter-row-multiple">
              <div className="teacher-filter-control">
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

              <div className="teacher-filter-control">
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
                      </option>
                    ),
                  )}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="teacher-secondary-action"
                  onClick={clearFilters}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </>
        )}

      {!isLoading &&
        !error &&
        assessments.length === 0 && (
          <section className="teacher-empty-state">
            <h2>
              Nenhuma avaliação cadastrada
            </h2>

            <p>
              Use o formulário acima para
              criar o primeiro diagnóstico.
            </p>
          </section>
        )}

      {!isLoading &&
        !error &&
        assessments.length > 0 &&
        filteredAssessments.length === 0 && (
          <section className="teacher-empty-state">
            <h2>
              Nenhuma avaliação encontrada
            </h2>

            <p>
              Não encontramos avaliações
              correspondentes aos filtros
              informados.
            </p>

            <button
              type="button"
              className="teacher-empty-action"
              onClick={clearFilters}
            >
              Limpar filtros
            </button>
          </section>
        )}

      {!isLoading &&
        !error &&
        filteredAssessments.length > 0 && (
          <section
            className="teacher-assessment-grid"
            aria-label="Avaliações cadastradas"
          >
            {filteredAssessments.map(
              (assessment) => {
                const classroom =
                  classroomById.get(
                    assessment.classroomId,
                  );

                return (
                  <article
                    key={assessment.id}
                    className="teacher-assessment-card"
                  >
                    <div className="teacher-assessment-card-header">
                      <span
                        className={[
                          "teacher-assessment-status",
                          getStatusClassName(
                            assessment.status,
                          ),
                        ].join(" ")}
                      >
                        {getStatusLabel(
                          assessment.status,
                        )}
                      </span>

                      <span className="teacher-assessment-date">
                        {formatAssessmentDate(
                          assessment.createdAt,
                        )}
                      </span>
                    </div>

                    <h2>
                      {assessment.title}
                    </h2>

                    <p className="teacher-assessment-description">
                      {assessment.description ??
                        "Nenhuma descrição informada."}
                    </p>

                    <dl className="teacher-assessment-metadata">
                      <div>
                        <dt>Turma</dt>

                        <dd>
                          {classroom?.name ??
                            "Turma não encontrada"}
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

                    <span className="teacher-assessment-next-step">
                      {assessment.status ===
                      "DRAFT"
                        ? "Pronta para adicionar questões"
                        : "Avaliação disponível para acompanhamento"}
                    </span>
                  </article>
                );
              },
            )}
          </section>
        )}
    </>
  );
}