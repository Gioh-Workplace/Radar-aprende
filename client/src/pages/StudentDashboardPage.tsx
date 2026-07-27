import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  FilterX,
  LoaderCircle,
  PlayCircle,
  RefreshCw,
  SearchX,
  Sparkles,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

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
import { useAuth } from "../hooks/use-auth";
import { getErrorMessage } from "../lib/get-error-message";
import { normalizeSearch } from "../lib/normalize-search";
import {
  getStudentAssessments,
  getStudentSubmissionOrNull,
} from "../services/student-api";
import type {
  StudentAssessmentListItem,
} from "../types/student";

import "../styles/student-dashboard.css";

type StudentStatusFilter =
  | "ALL"
  | "AVAILABLE"
  | "COMPLETED";

function getPublishedTimestamp(
  value: string | null,
): number {
  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}

function formatPublishedDate(
  value: string | null,
): string {
  if (!value) {
    return "Data não informada";
  }

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

function formatScore(
  score: number,
): string {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      maximumFractionDigits: 2,
    },
  ).format(score);
}

function getScoreTone(
  score: number,
): StatusBadgeTone {
  if (score < 50) {
    return "danger";
  }

  if (score < 70) {
    return "warning";
  }

  return "success";
}

function sortAssessmentItems(
  items: StudentAssessmentListItem[],
): StudentAssessmentListItem[] {
  return [...items].sort(
    (firstItem, secondItem) => {
      const firstIsCompleted =
        firstItem.submission !== null;

      const secondIsCompleted =
        secondItem.submission !== null;

      if (
        firstIsCompleted !==
        secondIsCompleted
      ) {
        return firstIsCompleted
          ? 1
          : -1;
      }

      return (
        getPublishedTimestamp(
          secondItem.assessment
            .publishedAt,
        ) -
        getPublishedTimestamp(
          firstItem.assessment
            .publishedAt,
        )
      );
    },
  );
}

function getAssessmentCountLabel(
  count: number,
): string {
  return count === 1
    ? "1 avaliação"
    : `${count} avaliações`;
}

export function StudentDashboardPage() {
  const { user } = useAuth();

  const [
    assessmentItems,
    setAssessmentItems,
  ] = useState<
    StudentAssessmentListItem[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StudentStatusFilter>(
    "ALL",
  );

  const [reloadKey, setReloadKey] =
    useState(0);

  const deferredSearchTerm =
    useDeferredValue(searchTerm);

  useEffect(() => {
    let isCancelled = false;

    async function loadAssessments() {
      setIsLoading(true);
      setError(null);

      try {
        const assessments =
          await getStudentAssessments();

        const items =
          await Promise.all(
            assessments.map(
              async (assessment) => ({
                assessment,

                submission:
                  await getStudentSubmissionOrNull(
                    assessment.id,
                  ),
              }),
            ),
          );

        if (!isCancelled) {
          setAssessmentItems(
            sortAssessmentItems(items),
          );
        }
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setError(
          getErrorMessage(
            caughtError,
            "Não foi possível carregar suas avaliações.",
          ),
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAssessments();

    return () => {
      isCancelled = true;
    };
  }, [reloadKey]);

  const completedCount =
    useMemo(
      () =>
        assessmentItems.filter(
          (item) =>
            item.submission !== null,
        ).length,
      [assessmentItems],
    );

  const availableCount =
    assessmentItems.length -
    completedCount;

  const completionRate =
    assessmentItems.length > 0
      ? Math.round(
          (completedCount /
            assessmentItems.length) *
            100,
        )
      : 0;

  const nextAssessment =
    useMemo(
      () =>
        assessmentItems.find(
          (item) =>
            item.submission === null,
        ) ?? null,
      [assessmentItems],
    );

  const filteredItems =
    useMemo(() => {
      const normalizedTerm =
        normalizeSearch(
          deferredSearchTerm,
        );

      return assessmentItems.filter(
        (item) => {
          const isCompleted =
            item.submission !== null;

          if (
            statusFilter ===
              "AVAILABLE" &&
            isCompleted
          ) {
            return false;
          }

          if (
            statusFilter ===
              "COMPLETED" &&
            !isCompleted
          ) {
            return false;
          }

          if (!normalizedTerm) {
            return true;
          }

          const searchableContent =
            normalizeSearch(
              [
                item.assessment.title,
                item.assessment
                  .description,
                isCompleted
                  ? "respondida concluida resultado"
                  : "disponivel pendente responder",
                item.submission?.score ??
                  "",
              ].join(" "),
            );

          return searchableContent.includes(
            normalizedTerm,
          );
        },
      );
    }, [
      assessmentItems,
      deferredSearchTerm,
      statusFilter,
    ]);

  const hasActiveFilters =
    Boolean(
      searchTerm ||
      statusFilter !== "ALL",
    );

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
  }

  return (
    <div className="student-dashboard-page">
      <PageHeader
        eyebrow="Área do estudante"
        title={`Olá, ${
          user?.name?.split(" ")[0] ??
          "estudante"
        }.`}
        description="Veja suas avaliações, responda às atividades pendentes e acompanhe os resultados já obtidos."
      />

      {!isLoading &&
        !error &&
        nextAssessment && (
          <section className="student-dashboard-next-card">
            <span
              className="student-dashboard-next-icon"
              aria-hidden="true"
            >
              <Sparkles
                size={22}
                strokeWidth={1.9}
              />
            </span>

            <div className="student-dashboard-next-copy">
              <span>
                Próxima atividade
              </span>

              <h2>
                {
                  nextAssessment
                    .assessment.title
                }
              </h2>

              <p>
                {
                  nextAssessment
                    .assessment
                    .questionCount
                }{" "}
                {nextAssessment
                  .assessment
                  .questionCount === 1
                  ? "questão"
                  : "questões"}{" "}
                · publicada em{" "}
                {formatPublishedDate(
                  nextAssessment
                    .assessment
                    .publishedAt,
                )}
              </p>
            </div>

            <ButtonLink
              to={`/aluno/avaliacoes/${nextAssessment.assessment.id}`}
              icon={
                <PlayCircle
                  size={17}
                  strokeWidth={1.9}
                />
              }
            >
              Responder agora
            </ButtonLink>
          </section>
        )}

      {!isLoading && !error && (
        <section
          className="student-dashboard-overview"
          aria-label="Resumo das avaliações"
        >
          <StatCard
            label="Para responder"
            value={availableCount}
            description="Atividades pendentes"
            icon={ClipboardList}
            tone={
              availableCount > 0
                ? "warning"
                : "neutral"
            }
          />

          <StatCard
            label="Respondidas"
            value={completedCount}
            description="Avaliações concluídas"
            icon={CheckCircle2}
            tone="teal"
          />

          <StatCard
            label="Progresso"
            value={`${completionRate}%`}
            description="Do total publicado"
            icon={BookOpenCheck}
            tone="primary"
          />
        </section>
      )}

      {isLoading && (
        <PageState
          icon={LoaderCircle}
          title="Carregando avaliações"
          description="Estamos verificando as atividades disponíveis para sua turma."
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
        assessmentItems.length >
          0 && (
          <section className="student-dashboard-toolbar">
            <SearchField
              id="student-assessment-search"
              value={searchTerm}
              onChange={setSearchTerm}
              label="Pesquisar avaliações"
              placeholder="Buscar por título, descrição ou resultado..."
            />

            <div className="student-dashboard-filter">
              <label htmlFor="student-status-filter">
                Situação
              </label>

              <select
                id="student-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as
                      StudentStatusFilter,
                  )
                }
              >
                <option value="ALL">
                  Todas
                </option>

                <option value="AVAILABLE">
                  Para responder
                </option>

                <option value="COMPLETED">
                  Respondidas
                </option>
              </select>
            </div>

            <div className="student-dashboard-toolbar-action">
              <span aria-live="polite">
                {hasActiveFilters
                  ? `${filteredItems.length} de ${assessmentItems.length}`
                  : getAssessmentCountLabel(
                      assessmentItems.length,
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
        assessmentItems.length ===
          0 && (
          <PageState
            icon={BookOpenCheck}
            title="Nenhuma avaliação disponível"
            description="Quando seu professor publicar uma avaliação para sua turma, ela aparecerá aqui."
            tone="primary"
          />
        )}

      {!isLoading &&
        !error &&
        assessmentItems.length > 0 &&
        filteredItems.length === 0 && (
          <PageState
            icon={SearchX}
            title="Nenhuma avaliação corresponde aos filtros"
            description="Tente outro termo de pesquisa ou selecione uma situação diferente."
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
        filteredItems.length > 0 && (
          <section
            className="student-dashboard-assessment-grid"
            aria-label="Avaliações"
          >
            {filteredItems.map(
              (item) => {
                const {
                  assessment,
                  submission,
                } = item;

                const isCompleted =
                  submission !== null;

                const hasDescription =
                  Boolean(
                    assessment.description
                      ?.trim(),
                  );

                return (
                  <article
                    key={assessment.id}
                    className={[
                      "student-dashboard-assessment-card",
                      isCompleted
                        ? "is-completed"
                        : "is-available",
                    ].join(" ")}
                  >
                    <header className="student-dashboard-assessment-card-header">
                      <StatusBadge
                        tone={
                          isCompleted
                            ? "success"
                            : "warning"
                        }
                      >
                        {isCompleted
                          ? "Respondida"
                          : "Para responder"}
                      </StatusBadge>

                      <span className="student-dashboard-assessment-date">
                        {formatPublishedDate(
                          assessment.publishedAt,
                        )}
                      </span>
                    </header>

                    <h2>
                      {assessment.title}
                    </h2>

                    <p
                      className={[
                        "student-dashboard-assessment-description",
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

                    <dl className="student-dashboard-assessment-metadata">
                      <div>
                        <dt>Questões</dt>

                        <dd>
                          {
                            assessment.questionCount
                          }
                        </dd>
                      </div>

                      <div>
                        <dt>
                          {isCompleted
                            ? "Resultado"
                            : "Situação"}
                        </dt>

                        <dd>
                          {submission ? (
                            <StatusBadge
                              tone={getScoreTone(
                                submission.score,
                              )}
                            >
                              {formatScore(
                                submission.score,
                              )}
                              %
                            </StatusBadge>
                          ) : (
                            "Aguardando resposta"
                          )}
                        </dd>
                      </div>
                    </dl>

                    <footer className="student-dashboard-assessment-footer">
                      <span>
                        {isCompleted
                          ? "Consulte suas respostas e o desempenho obtido."
                          : "Responda todas as questões antes de enviar."}
                      </span>

                      <ButtonLink
                        to={`/aluno/avaliacoes/${assessment.id}`}
                        variant={
                          isCompleted
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
                        {isCompleted
                          ? "Ver resultado"
                          : "Responder"}
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