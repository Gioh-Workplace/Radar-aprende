import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  Layers3,
  Plus,
  RotateCcw,
  Target,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router";

import {
  Button,
  ButtonLink,
} from "../components/ui/Button";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import {
  StatusBadge,
  type StatusBadgeTone,
} from "../components/ui/StatusBadge";
import { useAuth } from "../hooks/use-auth";
import { getErrorMessage } from "../lib/get-error-message";
import {
  getTeacherAssessments,
  getTeacherClassrooms,
  getTeacherSkills,
  getTeacherStudents,
} from "../services/teacher-api";
import type {
  AssessmentStatus,
  TeacherAssessment,
  TeacherClassroom,
  TeacherSkill,
  TeacherStudent,
} from "../types/teacher";

import "../styles/teacher-dashboard.css";

interface DashboardData {
  classrooms: TeacherClassroom[];
  students: TeacherStudent[];
  skills: TeacherSkill[];
  assessments: TeacherAssessment[];
}

interface AssessmentStatusPresentation {
  label: string;
  tone: StatusBadgeTone;
}

function getFirstName(
  name: string | undefined,
): string {
  if (!name) {
    return "professor";
  }

  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0] ??
    "professor"
  );
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

function formatDate(
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

function getAssessmentStatus(
  status: AssessmentStatus,
): AssessmentStatusPresentation {
  const presentations: Record<
    AssessmentStatus,
    AssessmentStatusPresentation
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
  count: number,
): string {
  return count === 1
    ? "1 questão"
    : `${count} questões`;
}

export function TeacherDashboardPage() {
  const { user } = useAuth();

  const [data, setData] =
    useState<DashboardData | null>(null);

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
          skills,
          assessments,
        ] = await Promise.all([
          getTeacherClassrooms(),
          getTeacherStudents(),
          getTeacherSkills(),
          getTeacherAssessments(),
        ]);

        if (isCancelled) {
          return;
        }

        setData({
          classrooms,
          students,
          skills,
          assessments,
        });
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setError(
          getErrorMessage(
            caughtError,
            "Não foi possível carregar o painel.",
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

  const dashboard = useMemo(() => {
    const classrooms =
      data?.classrooms ?? [];

    const students =
      data?.students ?? [];

    const skills =
      data?.skills ?? [];

    const assessments =
      data?.assessments ?? [];

    const publishedAssessments =
      assessments
        .filter(
          (assessment) =>
            assessment.status ===
            "PUBLISHED",
        )
        .sort(
          (firstAssessment, secondAssessment) =>
            getTimestamp(
              secondAssessment.createdAt,
            ) -
            getTimestamp(
              firstAssessment.createdAt,
            ),
        );

    const draftAssessments =
      assessments.filter(
        (assessment) =>
          assessment.status === "DRAFT",
      );

    const recentAssessments =
      [...assessments]
        .sort(
          (firstAssessment, secondAssessment) =>
            getTimestamp(
              secondAssessment.createdAt,
            ) -
            getTimestamp(
              firstAssessment.createdAt,
            ),
        )
        .slice(0, 4);

    const classroomById = new Map(
      classrooms.map((classroom) => [
        classroom.id,
        classroom,
      ]),
    );

    return {
      classrooms,
      students,
      skills,
      assessments,
      publishedAssessments,
      draftAssessments,
      recentAssessments,
      classroomById,
      latestPublishedAssessment:
        publishedAssessments[0] ?? null,
    };
  }, [data]);

  const firstName =
    getFirstName(user?.name);

  const draftCount =
    dashboard.draftAssessments.length;

  const latestPublished =
    dashboard.latestPublishedAssessment;

  return (
    <div className="teacher-dashboard">
      <section className="teacher-dashboard-hero">
        <PageHeader
          eyebrow="Visão geral"
          title={`Olá, ${firstName}.`}
          description="Veja o que merece sua atenção e continue o acompanhamento pedagógico das turmas."
          actions={
            <>
              <ButtonLink
                to="/professor/avaliacoes"
                icon={
                  <Plus
                    size={17}
                    strokeWidth={2}
                  />
                }
              >
                Nova avaliação
              </ButtonLink>

              <ButtonLink
                to="/professor/turmas"
                variant="secondary"
                icon={
                  <UsersRound
                    size={17}
                    strokeWidth={1.9}
                  />
                }
              >
                Ver turmas
              </ButtonLink>
            </>
          }
        />
      </section>

      {error && (
        <FeedbackBanner
          tone="error"
          title="Não foi possível atualizar o painel"
          description={error}
          action={
            <Button
              variant="secondary"
              icon={
                <RotateCcw
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

      <section
        className="teacher-dashboard-summary"
        aria-label="Resumo da plataforma"
        aria-busy={isLoading}
      >
        <StatCard
          label="Turmas"
          value={dashboard.classrooms.length}
          description="Turmas acompanhadas"
          icon={Layers3}
          tone="primary"
          isLoading={isLoading}
        />

        <StatCard
          label="Estudantes"
          value={dashboard.students.length}
          description="Alunos cadastrados"
          icon={UsersRound}
          tone="teal"
          isLoading={isLoading}
        />

        <StatCard
          label="Habilidades"
          value={dashboard.skills.length}
          description="Habilidades disponíveis"
          icon={Target}
          tone="neutral"
          isLoading={isLoading}
        />

        <StatCard
          label="Publicadas"
          value={
            dashboard
              .publishedAssessments
              .length
          }
          description="Avaliações disponíveis"
          icon={ClipboardCheck}
          tone="warning"
          isLoading={isLoading}
        />
      </section>

      <section className="teacher-dashboard-main-grid">
        <article className="teacher-dashboard-panel">
          <div className="teacher-dashboard-panel-header">
            <div>
              <h2>Próximos passos</h2>

              <p>
                Ações recomendadas para manter
                seu trabalho organizado.
              </p>
            </div>
          </div>

          <div className="teacher-dashboard-priority-list">
            <article className="teacher-dashboard-priority is-warning">
              <div className="teacher-dashboard-priority-header">
                <StatusBadge
                  tone={
                    draftCount > 0
                      ? "warning"
                      : "success"
                  }
                >
                  {draftCount > 0
                    ? "Ação recomendada"
                    : "Em dia"}
                </StatusBadge>
              </div>

              <h3>
                {draftCount > 0
                  ? `${draftCount} ${
                      draftCount === 1
                        ? "avaliação aguarda"
                        : "avaliações aguardam"
                    } finalização`
                  : "Nenhum rascunho pendente"}
              </h3>

              <p>
                {draftCount > 0
                  ? "Revise as questões e publique quando o diagnóstico estiver pronto."
                  : "Suas avaliações cadastradas não possuem rascunhos pendentes."}
              </p>

              <ButtonLink
                to="/professor/avaliacoes"
                variant="ghost"
                icon={
                  <ArrowRight
                    size={16}
                    strokeWidth={1.9}
                  />
                }
              >
                {draftCount > 0
                  ? "Revisar avaliações"
                  : "Criar avaliação"}
              </ButtonLink>
            </article>

            <article className="teacher-dashboard-priority is-primary">
              <div className="teacher-dashboard-priority-header">
                <StatusBadge tone="primary">
                  Resultados
                </StatusBadge>
              </div>

              <h3>
                {latestPublished
                  ? `Acompanhe “${latestPublished.title}”`
                  : "Publique sua primeira avaliação"}
              </h3>

              <p>
                {latestPublished
                  ? "Consulte participação, desempenho por habilidade e recomendações pedagógicas."
                  : "Após a publicação, os resultados e recomendações aparecerão aqui."}
              </p>

              <ButtonLink
                to={
                  latestPublished
                    ? `/professor/avaliacoes/${latestPublished.id}/resultados`
                    : "/professor/avaliacoes"
                }
                variant="ghost"
                icon={
                  <ArrowRight
                    size={16}
                    strokeWidth={1.9}
                  />
                }
              >
                {latestPublished
                  ? "Ver resultados"
                  : "Abrir avaliações"}
              </ButtonLink>
            </article>
          </div>
        </article>

        <article className="teacher-dashboard-panel">
          <div className="teacher-dashboard-panel-header">
            <div>
              <h2>Avaliações recentes</h2>

              <p>
                Continue de onde parou ou
                acompanhe os diagnósticos.
              </p>
            </div>

            <ButtonLink
              to="/professor/avaliacoes"
              variant="ghost"
            >
              Ver todas
            </ButtonLink>
          </div>

          {dashboard.recentAssessments.length >
          0 ? (
            <div className="teacher-dashboard-assessment-list">
              {dashboard.recentAssessments.map(
                (assessment) => {
                  const classroom =
                    dashboard.classroomById.get(
                      assessment.classroomId,
                    );

                  const status =
                    getAssessmentStatus(
                      assessment.status,
                    );

                  return (
                    <Link
                      key={assessment.id}
                      to={`/professor/avaliacoes/${assessment.id}`}
                      className="teacher-dashboard-assessment"
                    >
                      <div className="teacher-dashboard-assessment-copy">
                        <strong>
                          {assessment.title}
                        </strong>

                        <span>
                          {classroom?.name ??
                            "Turma indisponível"}
                          {" · "}
                          {getQuestionCountLabel(
                            assessment.questionCount,
                          )}
                          {" · "}
                          {formatDate(
                            assessment.createdAt,
                          )}
                        </span>
                      </div>

                      <StatusBadge
                        tone={status.tone}
                      >
                        {status.label}
                      </StatusBadge>

                      <span
                        className="teacher-dashboard-assessment-arrow"
                        aria-hidden="true"
                      >
                        <ArrowRight
                          size={17}
                          strokeWidth={1.9}
                        />
                      </span>
                    </Link>
                  );
                },
              )}
            </div>
          ) : (
            <div className="teacher-dashboard-empty">
              <h3>
                Nenhuma avaliação cadastrada
              </h3>

              <p>
                Crie a primeira avaliação
                diagnóstica para começar o
                acompanhamento.
              </p>

              <ButtonLink
                to="/professor/avaliacoes"
                icon={
                  <Plus
                    size={16}
                    strokeWidth={2}
                  />
                }
              >
                Criar avaliação
              </ButtonLink>
            </div>
          )}
        </article>
      </section>

      <section
        className="teacher-dashboard-shortcuts"
        aria-label="Atalhos de gestão"
      >
        <Link
          to="/professor/turmas"
          className="teacher-dashboard-shortcut"
        >
          <span
            className="teacher-dashboard-shortcut-icon"
            aria-hidden="true"
          >
            <UsersRound
              size={20}
              strokeWidth={1.9}
            />
          </span>

          <span className="teacher-dashboard-shortcut-copy">
            <strong>Gerenciar turmas</strong>
            <span>
              Consulte estudantes e vínculos.
            </span>
          </span>
        </Link>

        <Link
          to="/professor/habilidades"
          className="teacher-dashboard-shortcut"
        >
          <span
            className="teacher-dashboard-shortcut-icon"
            aria-hidden="true"
          >
            <Target
              size={20}
              strokeWidth={1.9}
            />
          </span>

          <span className="teacher-dashboard-shortcut-copy">
            <strong>Habilidades</strong>
            <span>
              Organize os objetivos avaliados.
            </span>
          </span>
        </Link>

        <Link
          to="/professor/avaliacoes"
          className="teacher-dashboard-shortcut"
        >
          <span
            className="teacher-dashboard-shortcut-icon"
            aria-hidden="true"
          >
            <BookOpenCheck
              size={20}
              strokeWidth={1.9}
            />
          </span>

          <span className="teacher-dashboard-shortcut-copy">
            <strong>Avaliações</strong>
            <span>
              Crie e acompanhe diagnósticos.
            </span>
          </span>
        </Link>
      </section>
    </div>
  );
}