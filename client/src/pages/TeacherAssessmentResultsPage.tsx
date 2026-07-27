import {
    ArrowLeft,
    BarChart3,
    ClipboardList,
    FilterX,
    Gauge,
    GraduationCap,
    LoaderCircle,
    RefreshCw,
    SearchX,
    Target,
    UsersRound,
  } from "lucide-react";
  import {
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
  } from "react";
  import { useParams } from "react-router";
  
  import {
    Button,
    ButtonLink,
  } from "../components/ui/Button";
  import { Breadcrumbs } from "../components/ui/Breadcrumbs";
  import { FeedbackBanner } from "../components/ui/FeedbackBanner";
  import {
    PageTabs,
    type PageTab,
  } from "../components/ui/PageTabs";
  import { PageHeader } from "../components/ui/PageHeader";
  import { PageState } from "../components/ui/PageState";
  import { SearchField } from "../components/ui/SearchField";
  import { StatCard } from "../components/ui/StatCard";
  import {
    StatusBadge,
    type StatusBadgeTone,
  } from "../components/ui/StatusBadge";
  import {
    ResultProgressBar,
    type ResultProgressTone,
  } from "../components/ResultProgressBar";
  import { PedagogicalPriorityCard } from "../features/assessment-results/PedagogicalPriorityCard";
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
  import { StudentResultCard } from "../features/assessment-results/StudentResultCard";


  import "../styles/teacher-assessment-results.css";
  
  type ResultsTab =
    | "overview"
    | "skills"
    | "questions"
    | "students";
  
  type StudentResultFilter =
    | "ALL"
    | TeacherResultStudentStatus;
  
  const resultTabs: PageTab[] = [
    {
      id: "overview",
      label: "Visão geral",
      icon: Gauge,
    },
    {
      id: "skills",
      label: "Habilidades",
      icon: Target,
    },
    {
      id: "questions",
      label: "Questões",
      icon: ClipboardList,
    },
    {
      id: "students",
      label: "Estudantes",
      icon: UsersRound,
    },
  ];
  
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
    return value === null
      ? "Sem dados"
      : `${formatPercentage(value)}%`;
  }
  
  function formatSubmissionDate(
    value: string | null,
  ): string {
    if (!value) {
      return "—";
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
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(date);
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
  
  function getLevelBadgeTone(
    level: SkillPerformanceLevel,
  ): StatusBadgeTone {
    const tones: Record<
      SkillPerformanceLevel,
      StatusBadgeTone
    > = {
      CRITICAL: "danger",
      DEVELOPING: "warning",
      CONSOLIDATED: "success",
      NO_DATA: "neutral",
    };
  
    return tones[level];
  }
  
  function getLevelProgressTone(
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
  
  function getScoreBadgeTone(
    score: number | null,
  ): StatusBadgeTone {
    if (score === null) {
      return "neutral";
    }
  
    if (score < 50) {
      return "danger";
    }
  
    if (score < 70) {
      return "warning";
    }
  
    return "success";
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
  
    const [activeTab, setActiveTab] =
      useState<ResultsTab>("overview");
  
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
            getTeacherClassrooms("all"),
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
          (currentClassroom) =>
            currentClassroom.id ===
            results.assessment.classroomId,
        ) ?? null
      );
    }, [
      classrooms,
      results,
    ]);
  
    const filteredStudents =
      useMemo(() => {
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
              studentStatusFilter !==
                "ALL" &&
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
                  student.status ===
                  "SUBMITTED"
                    ? "respondido concluido"
                    : "pendente",
                  student.score ?? "",
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
        <div className="teacher-assessment-results-page">
          <Breadcrumbs
            items={[
              {
                label: "Avaliações",
                to: "/professor/avaliacoes",
              },
              {
                label: "Resultados",
              },
            ]}
          />
  
          <PageState
            icon={LoaderCircle}
            title="Calculando os resultados"
            description="Estamos analisando participação, respostas e habilidades da turma."
            tone="primary"
            isLoading
          />
        </div>
      );
    }
  
    if (error || !results) {
      return (
        <div className="teacher-assessment-results-page">
          <Breadcrumbs
            items={[
              {
                label: "Avaliações",
                to: "/professor/avaliacoes",
              },
              {
                label: "Resultados indisponíveis",
              },
            ]}
          />
  
          <FeedbackBanner
            tone="error"
            title="Não foi possível abrir os resultados"
            description={
              error ??
              "Os resultados não foram encontrados."
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
  
    const {
      summary,
      recommendationSummary,
    } = results;
  
    const priorityRecommendations =
    results.recommendations
      .filter(
        (recommendation) =>
          recommendation.level ===
            "CRITICAL" ||
          recommendation.level ===
            "DEVELOPING",
      )
      .sort(
        (
          firstRecommendation,
          secondRecommendation,
        ) =>
          firstRecommendation.priority -
          secondRecommendation.priority,
      );
  
  const topRecommendations =
    priorityRecommendations.slice(
      0,
      3,
    );
  
    const hasStudentFilters =
      Boolean(
        searchTerm ||
        studentStatusFilter !== "ALL",
      );
  
    const tabs = resultTabs.map(
      (tab) => ({
        ...tab,
  
        count:
          tab.id === "skills"
            ? results.skills.length
            : tab.id === "questions"
              ? results.questions.length
              : tab.id === "students"
                ? results.students.length
                : undefined,
      }),
    );
  
    return (
      <div className="teacher-assessment-results-page">
        <Breadcrumbs
          items={[
            {
              label: "Avaliações",
              to: "/professor/avaliacoes",
            },
            {
              label: results.assessment.title,
              to: `/professor/avaliacoes/${results.assessment.id}`,
            },
            {
              label: "Resultados",
            },
          ]}
        />
  
        <PageHeader
          eyebrow="Análise diagnóstica"
          title={results.assessment.title}
          description={
            classroom
              ? `Resultados da turma ${classroom.name} · ${classroom.subject}`
              : "Resultados consolidados da avaliação."
          }
          actions={
            <div className="teacher-assessment-results-header-actions">
              <ButtonLink
                to={`/professor/avaliacoes/${results.assessment.id}`}
                variant="secondary"
                icon={
                  <ArrowLeft
                    size={16}
                    strokeWidth={1.9}
                  />
                }
              >
                Voltar à avaliação
              </ButtonLink>
            </div>
          }
        />
  
        <section
          className="teacher-assessment-results-stats"
          aria-label="Resumo dos resultados"
        >
          <StatCard
            label="Participação"
            value={`${formatPercentage(
              summary.completionRate,
            )}%`}
            description={`${summary.totalSubmissions} de ${summary.totalStudents} responderam`}
            icon={UsersRound}
            tone="primary"
          />
  
          <StatCard
            label="Média da turma"
            value={formatOptionalPercentage(
              summary.averageScore,
            )}
            description="Desempenho médio"
            icon={BarChart3}
            tone="teal"
          />
  
          <StatCard
            label="Pendentes"
            value={summary.pendingStudents}
            description="Ainda não responderam"
            icon={GraduationCap}
            tone={
              summary.pendingStudents > 0
                ? "warning"
                : "neutral"
            }
          />
  
          <StatCard
            label="Prioridades"
            value={
              recommendationSummary
                .criticalSkills +
              recommendationSummary
                .developingSkills
            }
            description="Habilidades para intervenção"
            icon={Target}
            tone="warning"
          />
        </section>
  
        {summary.totalSubmissions === 0 && (
        <FeedbackBanner
            tone="info"
            title="A avaliação ainda não recebeu respostas"
            description="Os dados estruturais já estão disponíveis, mas taxas de desempenho e prioridades pedagógicas serão calculadas após os primeiros envios."
            action={
            <Button
                variant="secondary"
                onClick={() =>
                setActiveTab(
                    "students",
                )
                }
            >
                Ver estudantes pendentes
            </Button>
            }
        />
        )}

        <PageTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) =>
            setActiveTab(
              tabId as ResultsTab,
            )
          }
        />
  
        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
        >
          {activeTab === "overview" && (
            <div className="teacher-assessment-results-overview">
              <div className="teacher-assessment-results-overview-main">
                <section className="teacher-assessment-results-panel">
                  <div className="teacher-assessment-results-panel-header">
                    <div>
                      <h2>
                        Prioridades pedagógicas
                      </h2>
  
                      <p>
                        Comece pelas
                        habilidades que
                        demandam intervenção
                        ou reforço mais
                        imediato.
                      </p>
                    </div>
                  </div>
  
                  {topRecommendations.length >
                  0 ? (
                    <div className="assessment-results-priority-grid">
                      {topRecommendations.map(
                        (recommendation) => (
                          <PedagogicalPriorityCard
                            key={
                              recommendation.skillId
                            }
                            recommendation={
                              recommendation
                            }
                          />
                        ),
                      )}
                    </div>
                  ) : (
                    <PageState
                        icon={Target}
                        title="Nenhuma intervenção prioritária"
                        description={
                            summary.totalSubmissions === 0
                            ? "As prioridades serão calculadas após o recebimento das primeiras respostas."
                            : "Nenhuma habilidade foi classificada como crítica ou em desenvolvimento."
                        }
                    />
                  )}
                </section>
              </div>
  
              <aside className="teacher-assessment-results-overview-side">
                <section className="teacher-assessment-results-panel teacher-results-participation-card">
                  <div className="teacher-assessment-results-panel-header">
                    <div>
                      <h2>Participação</h2>
  
                      <p>
                        Acompanhamento das
                        respostas da turma.
                      </p>
                    </div>
                  </div>
  
                  <ResultProgressBar
                    label="Participação da turma"
                    value={
                      summary.completionRate
                    }
                    detail={`${summary.totalSubmissions} respostas recebidas`}
                    tone={
                      summary.completionRate >=
                      70
                        ? "consolidated"
                        : summary.completionRate >=
                            50
                          ? "developing"
                          : "critical"
                    }
                  />
  
                  <div className="teacher-results-participation-detail">
                    <div>
                      <span>Responderam</span>
                      <strong>
                        {
                          summary.totalSubmissions
                        }
                      </strong>
                    </div>
  
                    <div>
                      <span>Pendentes</span>
                      <strong>
                        {
                          summary.pendingStudents
                        }
                      </strong>
                    </div>
                  </div>
                </section>
  
                <section className="teacher-assessment-results-panel">
                  <div className="teacher-assessment-results-panel-header">
                    <div>
                      <h2>
                        Habilidades
                      </h2>
  
                      <p>
                        Distribuição por
                        nível de desempenho.
                      </p>
                    </div>
                  </div>
  
                  <div className="teacher-results-level-grid">
                    <article className="teacher-results-level-card is-critical">
                      <span>Críticas</span>
                      <strong>
                        {
                          recommendationSummary
                            .criticalSkills
                        }
                      </strong>
                    </article>
  
                    <article className="teacher-results-level-card is-developing">
                      <span>
                        Em desenvolvimento
                      </span>
                      <strong>
                        {
                          recommendationSummary
                            .developingSkills
                        }
                      </strong>
                    </article>
  
                    <article className="teacher-results-level-card is-consolidated">
                      <span>
                        Consolidadas
                      </span>
                      <strong>
                        {
                          recommendationSummary
                            .consolidatedSkills
                        }
                      </strong>
                    </article>
  
                    <article className="teacher-results-level-card">
                      <span>Sem dados</span>
                      <strong>
                        {
                          recommendationSummary
                            .skillsWithoutData
                        }
                      </strong>
                    </article>
                  </div>
                </section>
              </aside>
            </div>
          )}
  
          {activeTab === "skills" && (
            <section className="teacher-assessment-results-panel">
              <div className="teacher-assessment-results-panel-header">
                <div>
                  <h2>
                    Desempenho por habilidade
                  </h2>
  
                  <p>
                    Compare taxas de acerto,
                    classificações e ações
                    pedagógicas sugeridas.
                  </p>
                </div>
              </div>
  
              {results.skills.length ===
              0 ? (
                <PageState
                  icon={Target}
                  title="Nenhuma habilidade disponível"
                  description="Esta avaliação não possui habilidades suficientes para análise."
                />
              ) : (
                <div className="teacher-results-skill-list">
                  {results.skills.map(
                    (skill) => (
                      <article
                        key={skill.skillId}
                        className="teacher-results-skill-card"
                      >
                        <header className="teacher-results-skill-card-header">
                          <div>
                            <span>
                              {skill.subject}
                            </span>
  
                            <h3>
                              {skill.name}
                            </h3>
                          </div>
  
                          <StatusBadge
                            tone={getLevelBadgeTone(
                              skill.level,
                            )}
                          >
                            {getLevelLabel(
                              skill.level,
                            )}
                          </StatusBadge>
                        </header>
  
                        <ResultProgressBar
                          label="Taxa de acerto"
                          value={
                            skill.accuracyRate
                          }
                          detail={`${skill.correctAnswers} acertos em ${skill.totalAnswers} respostas · ${skill.questionCount} questões`}
                          tone={getLevelProgressTone(
                            skill.level,
                          )}
                        />
                      </article>
                    ),
                  )}
                </div>
              )}
  
              {results.recommendations.length >
                0 && (
                <section className="teacher-results-recommendation-section">
                  <h3>
                    Recomendações completas
                  </h3>
  
                  <p>
                    Ações sugeridas para cada
                    habilidade analisada.
                  </p>
  
                  <div className="assessment-results-priority-grid">
                    {[...results.recommendations]
                      .sort(
                        (
                          firstRecommendation,
                          secondRecommendation,
                        ) =>
                          firstRecommendation.priority -
                          secondRecommendation.priority,
                      )
                      .map(
                        (recommendation) => (
                          <PedagogicalPriorityCard
                            key={
                              recommendation.skillId
                            }
                            recommendation={
                              recommendation
                            }
                          />
                        ),
                      )}
                  </div>
                </section>
              )}
            </section>
          )}
  
          {activeTab === "questions" && (
            <section className="teacher-assessment-results-panel">
              <div className="teacher-assessment-results-panel-header">
                <div>
                  <h2>
                    Desempenho por questão
                  </h2>
  
                  <p>
                    Localize os enunciados
                    que causaram maior
                    dificuldade.
                  </p>
                </div>
              </div>
  
              {results.questions.length ===
              0 ? (
                <PageState
                  icon={ClipboardList}
                  title="Nenhuma questão disponível"
                  description="Não existem questões para analisar nesta avaliação."
                />
              ) : (
                <div className="teacher-results-question-list">
                  {results.questions.map(
                    (question) => (
                      <article
                        key={
                          question.questionId
                        }
                        className="teacher-results-question-card"
                      >
                        <header className="teacher-results-question-card-header">
                          <div>
                            <span className="teacher-results-question-position">
                              Questão{" "}
                              {
                                question.position
                              }
                            </span>
  
                            <h3>
                              {
                                question.statement
                              }
                            </h3>
                          </div>
                        </header>
  
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
          )}
  
          {activeTab === "students" && (
            <section className="teacher-assessment-results-panel">
              <div className="teacher-assessment-results-panel-header">
                <div>
                  <h2>
                    Resultados por estudante
                  </h2>
  
                  <p>
                    Consulte resultados
                    individuais e identifique
                    quem ainda não respondeu.
                  </p>
                </div>
              </div>
  
              {results.students.length >
                0 && (
                <div className="teacher-results-student-toolbar">
                  <SearchField
                    id="student-result-search"
                    value={searchTerm}
                    onChange={setSearchTerm}
                    label="Pesquisar estudantes"
                    placeholder="Buscar por nome, matrícula ou resultado..."
                  />
  
                  <div className="teacher-results-student-filter">
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
                        Todos
                      </option>
  
                      <option value="SUBMITTED">
                        Respondidos
                      </option>
  
                      <option value="PENDING">
                        Pendentes
                      </option>
                    </select>
                  </div>
  
                  <div className="teacher-results-student-count">
                    <span aria-live="polite">
                      {hasStudentFilters
                        ? `${filteredStudents.length} de ${results.students.length}`
                        : `${results.students.length} estudantes`}
                    </span>
  
                    {hasStudentFilters && (
                      <Button
                        variant="secondary"
                        icon={
                          <FilterX
                            size={16}
                            strokeWidth={1.9}
                          />
                        }
                        onClick={
                          clearStudentFilters
                        }
                      >
                        Limpar filtros
                      </Button>
                    )}
                  </div>
                </div>
              )}
  
              {results.students.length ===
              0 ? (
                <PageState
                  icon={UsersRound}
                  title="Nenhum estudante na turma"
                  description="Não existem estudantes associados à turma desta avaliação."
                />
              ) : filteredStudents.length ===
                0 ? (
                <PageState
                  icon={SearchX}
                  title="Nenhum estudante encontrado"
                  description="Não encontramos estudantes correspondentes aos filtros."
                  action={
                    <Button
                      variant="secondary"
                      onClick={
                        clearStudentFilters
                      }
                    >
                      Limpar filtros
                    </Button>
                  }
                />
            ) : (
                <>
                  <div className="teacher-results-table-wrapper">
                  <table className="teacher-results-table">
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
                            key={
                              student.studentId
                            }
                          >
                            <td>
                              <div className="teacher-results-student-name">
                                <span
                                  className="teacher-results-student-avatar"
                                  aria-hidden="true"
                                >
                                  {student.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
  
                                <strong>
                                  {
                                    student.name
                                  }
                                </strong>
                              </div>
                            </td>
  
                            <td>
                              {student.registration ??
                                "Não informada"}
                            </td>
  
                            <td>
                              <StatusBadge
                                tone={
                                  student.status ===
                                  "SUBMITTED"
                                    ? "success"
                                    : "warning"
                                }
                              >
                                {student.status ===
                                "SUBMITTED"
                                  ? "Respondida"
                                  : "Pendente"}
                              </StatusBadge>
                            </td>
  
                            <td>
                              {student.correctAnswers ===
                              null
                                ? "—"
                                : `${student.correctAnswers}/${student.totalQuestions}`}
                            </td>
  
                            <td>
                              <StatusBadge
                                tone={getScoreBadgeTone(
                                  student.score,
                                )}
                              >
                                {student.score ===
                                null
                                  ? "—"
                                  : `${formatPercentage(
                                      student.score,
                                    )}%`}
                              </StatusBadge>
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
                <div
                    className="teacher-results-student-card-list"
                    aria-label="Resultados dos estudantes"
                >
                    {filteredStudents.map(
                    (student) => (
                        <StudentResultCard
                        key={student.studentId}
                        student={student}
                        />
                    ),
                    )}
                </div>
                </>
              )}
            </section>
          )}
        </div>
      </div>
    );
  }