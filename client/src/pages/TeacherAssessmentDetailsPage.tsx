import {
  ClipboardCheck,
  FilePenLine,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RefreshCw,
  Send,
  Target,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router";

import { AssessmentQuestionForm } from "../components/AssessmentQuestionForm";
import {
  Button,
  ButtonLink,
} from "../components/ui/Button";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { PageHeader } from "../components/ui/PageHeader";
import { PageState } from "../components/ui/PageState";
import { StatCard } from "../components/ui/StatCard";
import {
  StatusBadge,
  type StatusBadgeTone,
} from "../components/ui/StatusBadge";
import { AssessmentBuilderProgress } from "../features/assessment-builder/AssessmentBuilderProgress";
import { AssessmentQuestionCard } from "../features/assessment-builder/AssessmentQuestionCard";
import { getErrorMessage } from "../lib/get-error-message";
import {
  addTeacherAssessmentQuestion,
  getTeacherAssessment,
  getTeacherClassrooms,
  getTeacherSkills,
  publishTeacherAssessment,
  removeTeacherAssessmentQuestion,
} from "../services/teacher-api";
import type {
  AddTeacherAssessmentQuestionInput,
  AssessmentStatus,
  TeacherAssessmentDetails,
  TeacherClassroom,
  TeacherSkill,
} from "../types/teacher";

import "../styles/teacher-assessment-builder.css";

interface StatusPresentation {
  label: string;
  tone: StatusBadgeTone;
}

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
  count: number,
): string {
  return count === 1
    ? "1 questão cadastrada"
    : `${count} questões cadastradas`;
}

function sortSkills(
  skills: TeacherSkill[],
): TeacherSkill[] {
  return [...skills].sort(
    (firstSkill, secondSkill) => {
      const subjectComparison =
        firstSkill.subject.localeCompare(
          secondSkill.subject,
          "pt-BR",
        );

      if (subjectComparison !== 0) {
        return subjectComparison;
      }

      return firstSkill.name.localeCompare(
        secondSkill.name,
        "pt-BR",
      );
    },
  );
}

export function TeacherAssessmentDetailsPage() {
  const { assessmentId } = useParams<{
    assessmentId: string;
  }>();

  const [assessment, setAssessment] =
    useState<TeacherAssessmentDetails | null>(
      null,
    );

  const [classrooms, setClassrooms] =
    useState<TeacherClassroom[]>([]);

  const [skills, setSkills] =
    useState<TeacherSkill[]>([]);

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
    removingQuestionId,
    setRemovingQuestionId,
  ] = useState<string | null>(null);

  const [
    isQuestionFormOpen,
    setIsQuestionFormOpen,
  ] = useState(false);

  const [isPublishing, setIsPublishing] =
    useState(false);

  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadPage() {
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
          assessmentData,
          classroomList,
          skillList,
        ] = await Promise.all([
          getTeacherAssessment(
            assessmentId,
          ),
          getTeacherClassrooms("all"),
          getTeacherSkills(),
        ]);

        if (isCancelled) {
          return;
        }

        setAssessment(assessmentData);
        setClassrooms(classroomList);
        setSkills(
          sortSkills(skillList),
        );
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setAssessment(null);

        setError(
          getErrorMessage(
            caughtError,
            "Não foi possível carregar a avaliação.",
          ),
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      isCancelled = true;
    };
  }, [
    assessmentId,
    reloadKey,
  ]);

  const classroomById = useMemo(
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

  const skillById = useMemo(
    () =>
      new Map(
        skills.map(
          (skill) => [
            skill.id,
            skill,
          ],
        ),
      ),
    [skills],
  );

  async function handleAddQuestion(
    input: AddTeacherAssessmentQuestionInput,
  ): Promise<boolean> {
    if (!assessmentId) {
      return false;
    }

    setManagementSuccess(null);
    setManagementError(null);

    try {
      const updatedAssessment =
        await addTeacherAssessmentQuestion(
          assessmentId,
          input,
        );

      setAssessment(updatedAssessment);

      setManagementSuccess(
        "Questão adicionada à avaliação.",
      );

      return true;
    } catch (caughtError) {
      setManagementError(
        getErrorMessage(
          caughtError,
          "Não foi possível adicionar a questão.",
        ),
      );

      return false;
    }
  }

  async function handleRemoveQuestion(
    questionId: string,
    questionNumber: number,
  ) {
    if (!assessmentId) {
      return;
    }

    const shouldRemove =
      window.confirm(
        `Remover a questão ${questionNumber} desta avaliação?\n\nEsta ação não poderá ser desfeita.`,
      );

    if (!shouldRemove) {
      return;
    }

    setRemovingQuestionId(
      questionId,
    );

    setManagementSuccess(null);
    setManagementError(null);

    try {
      const updatedAssessment =
        await removeTeacherAssessmentQuestion(
          assessmentId,
          questionId,
        );

      setAssessment(updatedAssessment);

      setManagementSuccess(
        `Questão ${questionNumber} removida.`,
      );
    } catch (caughtError) {
      setManagementError(
        getErrorMessage(
          caughtError,
          "Não foi possível remover a questão.",
        ),
      );
    } finally {
      setRemovingQuestionId(null);
    }
  }

  async function handlePublish() {
    if (
      !assessmentId ||
      !assessment
    ) {
      return;
    }

    const shouldPublish =
      window.confirm(
        `Publicar “${assessment.title}”?\n\nOs estudantes da turma poderão responder e as questões não poderão mais ser alteradas.`,
      );

    if (!shouldPublish) {
      return;
    }

    setIsPublishing(true);
    setManagementSuccess(null);
    setManagementError(null);

    try {
      const updatedAssessment =
        await publishTeacherAssessment(
          assessmentId,
        );

      setAssessment(updatedAssessment);
      setIsQuestionFormOpen(false);

      setManagementSuccess(
        "Avaliação publicada com sucesso.",
      );
    } catch (caughtError) {
      setManagementError(
        getErrorMessage(
          caughtError,
          "Não foi possível publicar a avaliação.",
        ),
      );
    } finally {
      setIsPublishing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="teacher-assessment-builder-page">
        <Breadcrumbs
          items={[
            {
              label: "Avaliações",
              to: "/professor/avaliacoes",
            },
            {
              label: "Carregando",
            },
          ]}
        />

        <PageState
          icon={LoaderCircle}
          title="Carregando avaliação"
          description="Estamos consultando as questões e habilidades vinculadas."
          tone="primary"
          isLoading
        />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="teacher-assessment-builder-page">
        <Breadcrumbs
          items={[
            {
              label: "Avaliações",
              to: "/professor/avaliacoes",
            },
            {
              label: "Avaliação indisponível",
            },
          ]}
        />

        <FeedbackBanner
          tone="error"
          title="Não foi possível abrir a avaliação"
          description={
            error ??
            "A avaliação não foi encontrada."
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

  const classroom =
    classroomById.get(
      assessment.classroomId,
    );

  const isDraft =
    assessment.status === "DRAFT";

  const status =
    getStatusPresentation(
      assessment.status,
    );

  const canPublish =
    isDraft &&
    assessment.questionCount > 0 &&
    !isPublishing;

  return (
    <div className="teacher-assessment-builder-page">
      <Breadcrumbs
        items={[
          {
            label: "Avaliações",
            to: "/professor/avaliacoes",
          },
          {
            label: assessment.title,
          },
        ]}
      />

      <PageHeader
        eyebrow={
          isDraft
            ? "Construtor de avaliação"
            : "Avaliação diagnóstica"
        }
        title={assessment.title}
        description={
          assessment.description ??
          "Nenhuma descrição informada."
        }
        actions={
          <div className="teacher-assessment-builder-header-actions">
            <StatusBadge tone={status.tone}>
              {status.label}
            </StatusBadge>

            {isDraft ? (
              <Button
                variant={
                  isQuestionFormOpen
                    ? "secondary"
                    : "primary"
                }
                icon={
                  isQuestionFormOpen ? (
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
                onClick={() =>
                  setIsQuestionFormOpen(
                    (currentValue) =>
                      !currentValue,
                  )
                }
              >
                {isQuestionFormOpen
                  ? "Fechar editor"
                  : "Adicionar questão"}
              </Button>
            ) : (
              <ButtonLink
                to={`/professor/avaliacoes/${assessment.id}/resultados`}
                icon={
                  <ClipboardCheck
                    size={17}
                    strokeWidth={1.9}
                  />
                }
              >
                Ver resultados
              </ButtonLink>
            )}
          </div>
        }
      />

      {managementSuccess && (
        <FeedbackBanner
          tone="success"
          title="Avaliação atualizada"
          description={
            managementSuccess
          }
        />
      )}

      {managementError && (
        <FeedbackBanner
          tone="error"
          title="Não foi possível concluir a operação"
          description={
            managementError
          }
        />
      )}

      <section
        className="teacher-assessment-builder-overview"
        aria-label="Resumo da avaliação"
      >
        <StatCard
          label="Turma"
          value={
            classroom?.name ??
            "Indisponível"
          }
          description={
            classroom?.active === false
              ? "Turma arquivada"
              : "Turma vinculada"
          }
          icon={Layers3}
          tone="primary"
        />

        <StatCard
          label="Disciplina"
          value={
            classroom?.subject ?? "—"
          }
          description="Contexto pedagógico"
          icon={Target}
          tone="teal"
        />

        <StatCard
          label="Questões"
          value={
            assessment.questionCount
          }
          description={getQuestionCountLabel(
            assessment.questionCount,
          )}
          icon={
            isDraft
              ? FilePenLine
              : ClipboardCheck
          }
          tone={
            assessment.questionCount > 0
              ? "neutral"
              : "warning"
          }
        />
      </section>

      <section className="teacher-assessment-builder-layout">
        <div className="teacher-assessment-builder-main">
          <section className="teacher-assessment-builder-panel">
            <div className="teacher-assessment-builder-panel-header">
              <div>
                <h2>
                  Questões da avaliação
                </h2>

                <p>
                  {getQuestionCountLabel(
                    assessment.questionCount,
                  )}.
                </p>
              </div>

              {isDraft &&
                !isQuestionFormOpen && (
                  <Button
                    variant="secondary"
                    icon={
                      <Plus
                        size={16}
                        strokeWidth={2}
                      />
                    }
                    onClick={() =>
                      setIsQuestionFormOpen(
                        true,
                      )
                    }
                  >
                    Nova questão
                  </Button>
                )}
            </div>

            {isDraft &&
              isQuestionFormOpen && (
                <section className="teacher-assessment-question-editor">
                  <div className="teacher-assessment-question-editor-header">
                    <div>
                      <h3>
                        Adicionar questão
                      </h3>

                      <p>
                        Escolha a habilidade,
                        escreva o enunciado e
                        marque a resposta correta.
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      icon={
                        <X
                          size={16}
                          strokeWidth={2}
                        />
                      }
                      onClick={() =>
                        setIsQuestionFormOpen(
                          false,
                        )
                      }
                    >
                      Fechar
                    </Button>
                  </div>

                  {skills.length > 0 ? (
                    <AssessmentQuestionForm
                      skills={skills}
                      onSubmit={
                        handleAddQuestion
                      }
                    />
                  ) : (
                    <FeedbackBanner
                      tone="info"
                      title="Nenhuma habilidade disponível"
                      description="Cadastre uma habilidade antes de criar questões."
                      action={
                        <ButtonLink
                          to="/professor/habilidades"
                          variant="secondary"
                        >
                          Abrir habilidades
                        </ButtonLink>
                      }
                    />
                  )}
                </section>
              )}

            {assessment.questions.length ===
            0 ? (
              <PageState
                icon={FilePenLine}
                title="Nenhuma questão cadastrada"
                description="Adicione a primeira questão para preparar esta avaliação para publicação."
                tone="primary"
                action={
                  isDraft ? (
                    <Button
                      icon={
                        <Plus
                          size={16}
                          strokeWidth={2}
                        />
                      }
                      onClick={() =>
                        setIsQuestionFormOpen(
                          true,
                        )
                      }
                    >
                      Adicionar questão
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="teacher-assessment-question-list">
                {assessment.questions.map(
                  (
                    question,
                    questionIndex,
                  ) => (
                    <AssessmentQuestionCard
                      key={question.id}
                      question={question}
                      questionNumber={
                        questionIndex + 1
                      }
                      skill={skillById.get(
                        question.skillId,
                      )}
                      canEdit={isDraft}
                      isRemoving={
                        removingQuestionId ===
                        question.id
                      }
                      onRemove={() =>
                        void handleRemoveQuestion(
                          question.id,
                          questionIndex +
                            1,
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="teacher-assessment-builder-sidebar">
          <AssessmentBuilderProgress
            status={assessment.status}
            questionCount={
              assessment.questionCount
            }
          />

          {isDraft ? (
            <section className="teacher-assessment-publish-card">
              <h2>
                Revisar e publicar
              </h2>

              <p>
                Confirme as questões e
                disponibilize a avaliação
                para os estudantes.
              </p>

              <Button
                icon={
                  <Send
                    size={16}
                    strokeWidth={1.9}
                  />
                }
                disabled={!canPublish}
                onClick={() =>
                  void handlePublish()
                }
              >
                {isPublishing
                  ? "Publicando..."
                  : "Publicar avaliação"}
              </Button>

              {assessment.questionCount ===
                0 && (
                <p>
                  Cadastre pelo menos uma
                  questão para habilitar a
                  publicação.
                </p>
              )}

              <div className="teacher-assessment-publication-note">
                <LockKeyhole
                  size={15}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  Após publicar, as questões
                  não poderão mais ser
                  alteradas.
                </span>
              </div>
            </section>
          ) : (
            <section className="teacher-assessment-results-card">
              <h2>
                Resultados da avaliação
              </h2>

              <p>
                Consulte participação,
                desempenho por habilidade e
                recomendações pedagógicas.
              </p>

              <ButtonLink
                to={`/professor/avaliacoes/${assessment.id}/resultados`}
                icon={
                  <ClipboardCheck
                    size={16}
                    strokeWidth={1.9}
                  />
                }
              >
                Ver resultados
              </ButtonLink>
            </section>
          )}
        </aside>
      </section>
    </div>
  );
}