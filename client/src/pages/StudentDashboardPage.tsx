import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router";

import { DataSearch } from "../components/DataSearch";
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

type StudentStatusFilter =
  | "ALL"
  | "AVAILABLE"
  | "COMPLETED";

function formatPublishedDate(
  value: string | null,
): string {
  if (!value) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(new Date(value));
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

function sortAssessmentItems(
  items: StudentAssessmentListItem[],
): StudentAssessmentListItem[] {
  return [...items].sort(
    (firstItem, secondItem) => {
      const firstTime =
        firstItem.assessment.publishedAt
          ? new Date(
              firstItem.assessment.publishedAt,
            ).getTime()
          : 0;

      const secondTime =
        secondItem.assessment.publishedAt
          ? new Date(
              secondItem.assessment.publishedAt,
            ).getTime()
          : 0;

      return secondTime - firstTime;
    },
  );
}

export function StudentDashboardPage() {
  const { user } = useAuth();

  const [assessmentItems, setAssessmentItems] =
    useState<StudentAssessmentListItem[]>(
      [],
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StudentStatusFilter>("ALL");

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

        const items = await Promise.all(
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

  const completedCount = useMemo(
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

  const filteredItems = useMemo(() => {
    const normalizedTerm =
      normalizeSearch(
        deferredSearchTerm,
      );

    return assessmentItems.filter(
      (item) => {
        const isCompleted =
          item.submission !== null;

        if (
          statusFilter === "AVAILABLE" &&
          isCompleted
        ) {
          return false;
        }

        if (
          statusFilter === "COMPLETED" &&
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
              item.assessment.description,
              isCompleted
                ? "respondida concluida"
                : "disponivel pendente",
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

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
  }

  return (
    <>
      <header className="student-page-header">
        <span>Área do estudante</span>

        <h1>
          Olá,{" "}
          {user?.name?.split(" ")[0] ??
            "estudante"}.
        </h1>

        <p>
          Consulte as avaliações da sua turma,
          responda às atividades pendentes e
          acompanhe seus resultados.
        </p>
      </header>

      <section
        className="student-summary-grid"
        aria-label="Resumo das avaliações"
      >
        <article>
          <span>Avaliações disponíveis</span>
          <strong>
            {isLoading
              ? "…"
              : availableCount}
          </strong>
        </article>

        <article>
          <span>Avaliações respondidas</span>
          <strong>
            {isLoading
              ? "…"
              : completedCount}
          </strong>
        </article>

        <article>
          <span>Total publicado</span>
          <strong>
            {isLoading
              ? "…"
              : assessmentItems.length}
          </strong>
        </article>
      </section>

      {isLoading && (
        <section
          className="student-feedback"
          aria-live="polite"
        >
          <strong>
            Carregando avaliações...
          </strong>

          <p>
            Estamos verificando as atividades
            disponíveis para sua turma.
          </p>
        </section>
      )}

      {!isLoading && error && (
        <section
          className="student-feedback is-error"
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
        assessmentItems.length > 0 && (
          <>
            <DataSearch
              value={searchTerm}
              onChange={setSearchTerm}
              label="Pesquisar avaliações"
              placeholder="Buscar por título ou descrição..."
              resultCount={
                filteredItems.length
              }
              totalCount={
                assessmentItems.length
              }
            />

            <div className="student-filter-row">
              <div>
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
                    Disponíveis
                  </option>

                  <option value="COMPLETED">
                    Respondidas
                  </option>
                </select>
              </div>

              {(searchTerm ||
                statusFilter !== "ALL") && (
                <button
                  type="button"
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
        assessmentItems.length === 0 && (
          <section className="student-empty-state">
            <h2>
              Nenhuma avaliação disponível
            </h2>

            <p>
              Quando seu professor publicar uma
              avaliação, ela aparecerá aqui.
            </p>
          </section>
        )}

      {!isLoading &&
        !error &&
        assessmentItems.length > 0 &&
        filteredItems.length === 0 && (
          <section className="student-empty-state">
            <h2>
              Nenhuma avaliação encontrada
            </h2>

            <p>
              Não encontramos atividades
              correspondentes aos filtros.
            </p>

            <button
              type="button"
              onClick={clearFilters}
            >
              Limpar filtros
            </button>
          </section>
        )}

      {!isLoading &&
        !error &&
        filteredItems.length > 0 && (
          <section
            className="student-assessment-grid"
            aria-label="Avaliações"
          >
            {filteredItems.map((item) => {
              const {
                assessment,
                submission,
              } = item;

              const isCompleted =
                submission !== null;

              return (
                <article
                  key={assessment.id}
                  className="student-assessment-card"
                >
                  <div className="student-assessment-card-header">
                    <span
                      className={[
                        "student-assessment-status",
                        isCompleted
                          ? "is-completed"
                          : "is-available",
                      ].join(" ")}
                    >
                      {isCompleted
                        ? "Respondida"
                        : "Disponível"}
                    </span>

                    <span>
                      {formatPublishedDate(
                        assessment.publishedAt,
                      )}
                    </span>
                  </div>

                  <h2>
                    {assessment.title}
                  </h2>

                  <p>
                    {assessment.description ??
                      "Nenhuma descrição informada."}
                  </p>

                  <dl className="student-assessment-metadata">
                    <div>
                      <dt>Questões</dt>

                      <dd>
                        {assessment.questionCount}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        {isCompleted
                          ? "Resultado"
                          : "Situação"}
                      </dt>

                      <dd>
                        {submission
                          ? `${formatScore(
                              submission.score,
                            )}%`
                          : "Pendente"}
                      </dd>
                    </div>
                  </dl>

                  <Link
                    to={`/aluno/avaliacoes/${assessment.id}`}
                    className="student-assessment-action"
                  >
                    {isCompleted
                      ? "Ver resultado"
                      : "Responder avaliação"}
                  </Link>
                </article>
              );
            })}
          </section>
        )}
    </>
  );
}