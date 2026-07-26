import {
    useEffect,
    useState,
  } from "react";
  import { Link } from "react-router";
  
  import { TeacherPageHeader } from "../components/TeacherPageHeader";
  import { useAuth } from "../hooks/use-auth";
  import { getErrorMessage } from "../lib/get-error-message";
  import {
    getTeacherAssessments,
    getTeacherClassrooms,
    getTeacherStudents,
  } from "../services/teacher-api";
  
  interface DashboardSummary {
    classroomCount: number;
    studentCount: number;
    publishedAssessmentCount: number;
  }
  
  interface SummaryCard {
    label: string;
    value: number | null;
    description: string;
  }
  
  export function TeacherDashboardPage() {
    const { user } = useAuth();
  
    const [summary, setSummary] =
      useState<DashboardSummary | null>(null);
  
    const [isLoading, setIsLoading] =
      useState(true);
  
    const [error, setError] =
      useState<string | null>(null);
  
    const [reloadKey, setReloadKey] =
      useState(0);
  
    useEffect(() => {
      let isCancelled = false;
  
      async function loadDashboard() {
        setIsLoading(true);
        setError(null);
  
        try {
          const [
            classrooms,
            students,
            assessments,
          ] = await Promise.all([
            getTeacherClassrooms(),
            getTeacherStudents(),
            getTeacherAssessments(),
          ]);
  
          if (isCancelled) {
            return;
          }
  
          const publishedAssessmentCount =
            assessments.filter(
              (assessment) =>
                assessment.status ===
                "PUBLISHED",
            ).length;
  
          setSummary({
            classroomCount:
              classrooms.length,
  
            studentCount:
              students.length,
  
            publishedAssessmentCount,
          });
        } catch (caughtError) {
          if (isCancelled) {
            return;
          }
  
          setError(
            getErrorMessage(
              caughtError,
              "Não foi possível carregar o resumo.",
            ),
          );
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      }
  
      void loadDashboard();
  
      return () => {
        isCancelled = true;
      };
    }, [reloadKey]);
  
    const summaryCards: SummaryCard[] = [
      {
        label: "Turmas ativas",
        value:
          summary?.classroomCount ??
          null,
  
        description:
          "Turmas vinculadas ao professor.",
      },
      {
        label: "Estudantes",
        value:
          summary?.studentCount ??
          null,
  
        description:
          "Alunos acompanhados pelo professor.",
      },
      {
        label: "Avaliações publicadas",
        value:
          summary?.publishedAssessmentCount ??
          null,
  
        description:
          "Diagnósticos disponíveis aos alunos.",
      },
    ];
  
    return (
      <>
        <TeacherPageHeader
          eyebrow="Visão geral"
          title={`Olá, ${
            user?.name?.split(" ")[0] ??
            "professor"
          }.`}
          description="Acompanhe suas turmas, avaliações e habilidades prioritárias em um só lugar."
        />
  
        <section
          className="teacher-summary-grid"
          aria-label="Resumo da plataforma"
          aria-busy={isLoading}
        >
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="teacher-summary-card"
            >
              <span>{card.label}</span>
  
              <strong>
                {isLoading
                  ? "…"
                  : card.value ?? "—"}
              </strong>
  
              <p>{card.description}</p>
            </article>
          ))}
        </section>
  
        {error && (
          <section
            className="teacher-feedback is-error"
            role="alert"
          >
            <div>
              <strong>
                Não foi possível atualizar
                o painel
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
  
        <section className="teacher-panel">
          <div className="teacher-panel-header">
            <h2>Acessos rápidos</h2>
  
            <p>
              Escolha uma área para continuar
              o acompanhamento pedagógico.
            </p>
          </div>
  
          <div className="teacher-action-grid">
            <Link
              to="/professor/turmas"
              className="teacher-action-card"
            >
              <strong>Gerenciar turmas</strong>
  
              <span>
                Consulte estudantes e organize
                as turmas acompanhadas.
              </span>
            </Link>
  
            <Link
              to="/professor/habilidades"
              className="teacher-action-card"
            >
              <strong>
                Consultar habilidades
              </strong>
  
              <span>
                Organize as habilidades
                utilizadas nas avaliações.
              </span>
            </Link>
  
            <Link
              to="/professor/avaliacoes"
              className="teacher-action-card"
            >
              <strong>
                Gerenciar avaliações
              </strong>
  
              <span>
                Crie, publique e acompanhe
                avaliações diagnósticas.
              </span>
            </Link>
          </div>
        </section>
      </>
    );
  }