import {
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
  } from "react";
  import {
    Link,
    useParams,
  } from "react-router";
  
  import { DataSearch } from "../components/DataSearch";
  import {
    ResultProgressBar,
    type ResultProgressTone,
  } from "../components/ResultProgressBar";
  import { TeacherPageHeader } from "../components/TeacherPageHeader";
  import { getErrorMessage } from "../lib/get-error-message";
  import { normalizeSearch } from "../lib/normalize-search";
  import {
    getTeacherAssessmentResults,
    getTeacherClassrooms,
  } from "../services/teacher-api";
  import type {
    SkillPerformanceLevel,
    TeacherAssessmentResults,
    TeacherClassroom,
    TeacherResultStudentStatus,
  } from "../types/teacher";
  
  type StudentResultFilter =
    | "ALL"
    | TeacherResultStudentStatus;
  
  interface CompletionChartStyle
    extends CSSProperties {
    "--completion-angle": string;
  }
  
  function formatPercentage(
    value: number,
  ): string {
    return new Intl.NumberFormat(
      "pt-BR",
      {
        maximumFractionDigits: 2,
      },
    ).format(value);
  }
  
  function formatOptionalPercentage(
    value: number | null,
  ): string {
    if (value === null) {
      return "Sem dados";
    }
  
    return `${formatPercentage(value)}%`;
  }
  
  function formatSubmissionDate(
    value: string | null,
  ): string {
    if (!value) {
      return "—";
    }
  
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(new Date(value));
  }
  
  function getLevelLabel(
    level: SkillPerformanceLevel,
  ): string {
    const labels: Record<
      SkillPerformanceLevel,
      string
    > = {
      CRITICAL: "Crítica",
      DEVELOPING: "Em desenvolvimento",
      CONSOLIDATED: "Consolidada",
      NO_DATA: "Sem dados",
    };
  
    return labels[level];
  }
  
  function getLevelClassName(
    level: SkillPerformanceLevel,
  ): string {
    const classNames: Record<
      SkillPerformanceLevel,
      string
    > = {
      CRITICAL: "is-critical",
      DEVELOPING: "is-developing",
      CONSOLIDATED: "is-consolidated",
      NO_DATA: "is-neutral",
    };
  
    return classNames[level];
  }
  
  function getLevelTone(
    level: SkillPerformanceLevel,
  ): ResultProgressTone {
    const tones: Record<
      SkillPerformanceLevel,
      ResultProgressTone
    > = {
      CRITICAL: "critical",
      DEVELOPING: "developing",
      CONSOLIDATED: "consolidated",
      NO_DATA: "neutral",
    };
  
    return tones[level];
  }
  
  function getAccuracyTone(
    accuracyRate: number,
    totalAnswers: number,
  ): ResultProgressTone {
    if (totalAnswers === 0) {
      return "neutral";
    }
  
    if (accuracyRate < 50) {
      return "critical";
    }
  
    if (accuracyRate < 70) {
      return "developing";
    }
  
    return "consolidated";
  }
  
  function getScoreClassName(
    score: number | null,
  ): string {
    if (score === null) {
      return "is-neutral";
    }
  
    if (score < 50) {
      return "is-critical";
    }
  
    if (score < 70) {
      return "is-developing";
    }
  
    return "is-consolidated";
  }
  
  export function TeacherAssessmentResultsPage() {
    const { assessmentId } = useParams<{
      assessmentId: string;
    }>();
  
    const [results, setResults] =
      useState<TeacherAssessmentResults | null>(
        null,
      );
  
    const [classrooms, setClassrooms] =
      useState<TeacherClassroom[]>([]);
  
    const [isLoading, setIsLoading] =
      useState(true);
  
    const [error, setError] =
      useState<string | null>(null);
  
    const [reloadKey, setReloadKey] =
      useState(0);
  
    const [searchTerm, setSearchTerm] =
      useState("");
  
    const [
      studentStatusFilter,
      setStudentStatusFilter,
    ] = useState<StudentResultFilter>("ALL");
  
    const deferredSearchTerm =
      useDeferredValue(searchTerm);
  
    useEffect(() => {
      let isCancelled = false;
  
      async function loadResults() {
        if (!assessmentId) {
          setError(
            "O identificador da avaliação não foi informado.",
          );
          setIsLoading(false);
          return;
        }
  
        setIsLoading(true);
        setError(null);
  
        try {
          const [
            resultData,
            classroomList,
          ] = await Promise.all([
            getTeacherAssessmentResults(
              assessmentId,
            ),
            getTeacherClassrooms(),
          ]);
  
          if (isCancelled) {
            return;
          }
  
          setResults(resultData);
          setClassrooms(classroomList);
        } catch (caughtError) {
          if (isCancelled) {
            return;
          }
  
          setResults(null);
  
          setError(
            getErrorMessage(
              caughtError,
              "Não foi possível carregar os resultados da avaliação.",
            ),
          );
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      }
  
      void loadResults();
  
      return () => {
        isCancelled = true;
      };
    }, [
      assessmentId,
      reloadKey,
    ]);
  
    const classroom = useMemo(() => {
      if (!results) {
        return null;
      }
  
      return (
        classrooms.find(
          (item) =>
            item.id ===
            results.assessment.classroomId,
        ) ?? null
      );
    }, [
      classrooms,
      results,
    ]);
  
    const filteredStudents = useMemo(() => {
      if (!results) {
        return [];
      }
  
      const normalizedTerm =
        normalizeSearch(
          deferredSearchTerm,
        );
  
      return results.students.filter(
        (student) => {
          if (
            studentStatusFilter !== "ALL" &&
            student.status !==
              studentStatusFilter
          ) {
            return false;
          }
  
          if (!normalizedTerm) {
            return true;
          }
  
          const searchableContent =
            normalizeSearch(
              [
                student.name,
                student.registration,
                student.status === "SUBMITTED"
                  ? "respondido enviado concluido"
                  : "pendente nao respondido",
                student.score === null
                  ? ""
                  : `${student.score}`,
              ].join(" "),
            );
  
          return searchableContent.includes(
            normalizedTerm,
          );
        },
      );
    }, [
      deferredSearchTerm,
      results,
      studentStatusFilter,
    ]);
  
    function clearStudentFilters() {
      setSearchTerm("");
      setStudentStatusFilter("ALL");
    }
  
    if (isLoading) {
      return (
        <>
          <Link
            to="/professor/avaliacoes"
            className="teacher-back-link"
          >
            ← Voltar para avaliações
          </Link>
  
          <section
            className="teacher-feedback"
            aria-live="polite"
          >
            <div>
              <strong>
                Calculando os resultados...
              </strong>
  
              <p>
                Estamos analisando respostas,
                habilidades e participação da
                turma.
              </p>
            </div>
          </section>
        </>
      );
    }
  
    if (error || !results) {
      return (
        <>
          <Link
            to="/professor/avaliacoes"
            className="teacher-back-link"
          >
            ← Voltar para avaliações
          </Link>
  
          <section
            className="teacher-feedback is-error"
            role="alert"
          >
            <div>
              <strong>
                Não foi possível abrir
                os resultados
              </strong>
  
              <p>
                {error ??
                  "Os resultados não foram encontrados."}
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
  
    const {
      summary,
      recommendationSummary,
    } = results;
  
    const completionRate =
      Math.min(
        100,
        Math.max(
          0,
          summary.completionRate,
        ),
      );
  
    const completionChartStyle:
      CompletionChartStyle = {
        "--completion-angle":
          `${completionRate * 3.6}deg`,
      };
  
    const hasStudentFilters =
      Boolean(
        searchTerm ||
        studentStatusFilter !== "ALL",
      );
  
    return (
      <>
        <Link
          to={`/professor/avaliacoes/${results.assessment.id}`}
          className="teacher-back-link"
        >
          ← Voltar para avaliação
        </Link>
  
        <TeacherPageHeader
          eyebrow="Análise diagnóstica"
          title={results.assessment.title}
          description={
            classroom
              ? `Resultados da turma ${classroom.name} · ${classroom.subject}`
              : "Resultados consolidados da avaliação."
          }
        />
  
        <section
          className="teacher-results-summary"
          aria-label="Resumo dos resultados"
        >
          <article className="teacher-completion-card">
            <div
              className="teacher-completion-donut"
              style={completionChartStyle}
              role="img"
              aria-label={`${formatPercentage(
                summary.completionRate,
              )}% de participação`}
            >
              <div>
                <strong>
                  {formatPercentage(
                    summary.completionRate,
                  )}
                  %
                </strong>
  
                <span>participação</span>
              </div>
            </div>
  
            <div>
              <span>
                Participação da turma
              </span>
  
              <strong>
                {summary.totalSubmissions} de{" "}
                {summary.totalStudents}
              </strong>
  
              <p>
                {summary.pendingStudents === 0
                  ? "Todos os estudantes responderam."
                  : `${summary.pendingStudents} estudantes ainda estão pendentes.`}
              </p>
            </div>
          </article>
  
          <div className="teacher-result-metric-grid">
            <article>
              <span>Média da turma</span>
  
              <strong>
                {formatOptionalPercentage(
                  summary.averageScore,
                )}
              </strong>
            </article>
  
            <article>
              <span>Maior resultado</span>
  
              <strong>
                {formatOptionalPercentage(
                  summary.highestScore,
                )}
              </strong>
            </article>
  
            <article>
              <span>Menor resultado</span>
  
              <strong>
                {formatOptionalPercentage(
                  summary.lowestScore,
                )}
              </strong>
            </article>
  
            <article>
              <span>Questões</span>
  
              <strong>
                {results.assessment.questionCount}
              </strong>
            </article>
          </div>
        </section>
  
        <section className="teacher-panel">
          <div className="teacher-panel-header">
            <h2>Desempenho por habilidade</h2>
  
            <p>
              Identifique quais habilidades
              precisam de intervenção, reforço
              ou aprofundamento.
            </p>
          </div>
  
          <div
            className="teacher-recommendation-summary"
            aria-label="Classificação das habilidades"
          >
            <article className="is-critical">
              <span>Críticas</span>
  
              <strong>
                {
                  recommendationSummary
                    .criticalSkills
                }
              </strong>
            </article>
  
            <article className="is-developing">
              <span>Em desenvolvimento</span>
  
              <strong>
                {
                  recommendationSummary
                    .developingSkills
                }
              </strong>
            </article>
  
            <article className="is-consolidated">
              <span>Consolidadas</span>
  
              <strong>
                {
                  recommendationSummary
                    .consolidatedSkills
                }
              </strong>
            </article>
  
            <article className="is-neutral">
              <span>Sem dados</span>
  
              <strong>
                {
                  recommendationSummary
                    .skillsWithoutData
                }
              </strong>
            </article>
          </div>
  
          {results.skills.length === 0 ? (
            <div className="teacher-empty-state">
              <h2>
                Nenhuma habilidade disponível
              </h2>
  
              <p>
                Esta avaliação não possui
                habilidades suficientes para a
                análise.
              </p>
            </div>
          ) : (
            <div className="teacher-result-chart-list">
              {results.skills.map((skill) => (
                <article
                  key={skill.skillId}
                  className="teacher-result-chart-card"
                >
                  <div className="teacher-result-chart-card-header">
                    <div>
                      <span>
                        {skill.subject}
                      </span>
  
                      <h3>{skill.name}</h3>
                    </div>
  
                    <span
                      className={[
                        "teacher-result-level",
                        getLevelClassName(
                          skill.level,
                        ),
                      ].join(" ")}
                    >
                      {getLevelLabel(
                        skill.level,
                      )}
                    </span>
                  </div>
  
                  <ResultProgressBar
                    label="Taxa de acerto"
                    value={skill.accuracyRate}
                    detail={`${skill.correctAnswers} acertos em ${skill.totalAnswers} respostas · ${skill.questionCount} questões`}
                    tone={getLevelTone(
                      skill.level,
                    )}
                  />
                </article>
              ))}
            </div>
          )}
        </section>
  
        <section className="teacher-panel">
          <div className="teacher-panel-header">
            <h2>Recomendações pedagógicas</h2>
  
            <p>
              Sugestões automáticas baseadas no
              desempenho observado em cada
              habilidade.
            </p>
          </div>
  
          {results.recommendations.length === 0 ? (
            <div className="teacher-empty-state">
              <h2>
                Nenhuma recomendação disponível
              </h2>
  
              <p>
                As recomendações aparecerão
                quando houver habilidades na
                avaliação.
              </p>
            </div>
          ) : (
            <div className="teacher-recommendation-grid">
              {results.recommendations.map(
                (recommendation) => (
                  <article
                    key={recommendation.skillId}
                    className={[
                      "teacher-recommendation-card",
                      getLevelClassName(
                        recommendation.level,
                      ),
                    ].join(" ")}
                  >
                    <div className="teacher-recommendation-card-header">
                      <div>
                        <span>
                          Prioridade{" "}
                          {recommendation.priority}
                        </span>
  
                        <h3>
                          {recommendation.title}
                        </h3>
                      </div>
  
                      <strong>
                        {formatPercentage(
                          recommendation.accuracyRate,
                        )}
                        %
                      </strong>
                    </div>
  
                    <h4>
                      {recommendation.skillName}
                    </h4>
  
                    <p>
                      {
                        recommendation.description
                      }
                    </p>
  
                    <strong className="teacher-recommendation-actions-title">
                      Ações sugeridas
                    </strong>
  
                    <ul>
                      {recommendation.actions.map(
                        (action) => (
                          <li key={action}>
                            {action}
                          </li>
                        ),
                      )}
                    </ul>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
  
        <section className="teacher-panel">
          <div className="teacher-panel-header">
            <h2>Desempenho por questão</h2>
  
            <p>
              Compare as taxas de acerto e
              localize os enunciados que geraram
              mais dificuldade.
            </p>
          </div>
  
          {results.questions.length === 0 ? (
            <div className="teacher-empty-state">
              <h2>
                Nenhuma questão disponível
              </h2>
  
              <p>
                Não existem questões para
                analisar nesta avaliação.
              </p>
            </div>
          ) : (
            <div className="teacher-question-result-list">
              {results.questions.map(
                (question) => (
                  <article
                    key={question.questionId}
                    className="teacher-question-result-card"
                  >
                    <div>
                      <span>
                        Questão{" "}
                        {question.position}
                      </span>
  
                      <h3>
                        {question.statement}
                      </h3>
                    </div>
  
                    <ResultProgressBar
                      label="Taxa de acerto"
                      value={
                        question.accuracyRate
                      }
                      detail={`${question.correctAnswers} acertos em ${question.totalAnswers} respostas`}
                      tone={getAccuracyTone(
                        question.accuracyRate,
                        question.totalAnswers,
                      )}
                    />
                  </article>
                ),
              )}
            </div>
          )}
        </section>
  
        <section className="teacher-panel">
          <div className="teacher-panel-header">
            <h2>Resultados por estudante</h2>
  
            <p>
              Consulte as notas individuais e
              identifique quem ainda não respondeu.
            </p>
          </div>
  
          {results.students.length > 0 && (
            <>
              <DataSearch
                value={searchTerm}
                onChange={setSearchTerm}
                label="Pesquisar estudantes"
                placeholder="Buscar por nome, matrícula ou resultado..."
                resultCount={
                  filteredStudents.length
                }
                totalCount={
                  results.students.length
                }
              />
  
              <div className="teacher-filter-row teacher-results-filter-row">
                <div className="teacher-filter-control">
                  <label htmlFor="student-result-status">
                    Situação
                  </label>
  
                  <select
                    id="student-result-status"
                    value={
                      studentStatusFilter
                    }
                    onChange={(event) =>
                      setStudentStatusFilter(
                        event.target
                          .value as
                          StudentResultFilter,
                      )
                    }
                  >
                    <option value="ALL">
                      Todos os estudantes
                    </option>
  
                    <option value="SUBMITTED">
                      Respondidos
                    </option>
  
                    <option value="PENDING">
                      Pendentes
                    </option>
                  </select>
                </div>
  
                {hasStudentFilters && (
                  <button
                    type="button"
                    className="teacher-secondary-action"
                    onClick={
                      clearStudentFilters
                    }
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </>
          )}
  
          {results.students.length === 0 ? (
            <div className="teacher-empty-state">
              <h2>
                Nenhum estudante na turma
              </h2>
  
              <p>
                Não existem estudantes associados
                à turma desta avaliação.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="teacher-empty-state">
              <h2>
                Nenhum estudante encontrado
              </h2>
  
              <p>
                Não encontramos estudantes
                correspondentes aos filtros
                informados.
              </p>
  
              <button
                type="button"
                className="teacher-empty-action"
                onClick={
                  clearStudentFilters
                }
              >
                Limpar filtros
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
                      Acertos
                    </th>
  
                    <th scope="col">
                      Resultado
                    </th>
  
                    <th scope="col">
                      Envio
                    </th>
                  </tr>
                </thead>
  
                <tbody>
                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={student.studentId}
                      >
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
                          <span
                            className={[
                              "teacher-result-student-status",
                              student.status ===
                              "SUBMITTED"
                                ? "is-submitted"
                                : "is-pending",
                            ].join(" ")}
                          >
                            {student.status ===
                            "SUBMITTED"
                              ? "Respondida"
                              : "Pendente"}
                          </span>
                        </td>
  
                        <td>
                          {student.correctAnswers ===
                          null
                            ? "—"
                            : `${student.correctAnswers}/${student.totalQuestions}`}
                        </td>
  
                        <td>
                          <span
                            className={[
                              "teacher-result-score",
                              getScoreClassName(
                                student.score,
                              ),
                            ].join(" ")}
                          >
                            {student.score === null
                              ? "—"
                              : `${formatPercentage(
                                  student.score,
                                )}%`}
                          </span>
                        </td>
  
                        <td>
                          {formatSubmissionDate(
                            student.submittedAt,
                          )}
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