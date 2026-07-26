import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  import {
    Link,
    useParams,
  } from "react-router";
  
  import { AssessmentQuestionForm } from "../components/AssessmentQuestionForm";
  import { TeacherPageHeader } from "../components/TeacherPageHeader";
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
    count: number,
  ): string {
    return count === 1
      ? "1 questão"
      : `${count} questões`;
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
            getTeacherClassrooms(),
            getTeacherSkills(),
          ]);
  
          if (isCancelled) {
            return;
          }
  
          setAssessment(assessmentData);
          setClassrooms(classroomList);
          setSkills(skillList);
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
          classrooms.map((classroom) => [
            classroom.id,
            classroom,
          ]),
        ),
      [classrooms],
    );
  
    const skillById = useMemo(
      () =>
        new Map(
          skills.map((skill) => [
            skill.id,
            skill,
          ]),
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
  
      const shouldRemove = window.confirm(
        `Remover a questão ${questionNumber} desta avaliação?`,
      );
  
      if (!shouldRemove) {
        return;
      }
  
      setRemovingQuestionId(questionId);
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
  
      const shouldPublish = window.confirm(
        "Publicar esta avaliação?\n\nDepois da publicação, as questões não poderão mais ser alteradas.",
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
                Carregando avaliação...
              </strong>
  
              <p>
                Estamos consultando as questões
                e habilidades vinculadas.
              </p>
            </div>
          </section>
        </>
      );
    }
  
    if (error || !assessment) {
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
                a avaliação
              </strong>
  
              <p>
                {error ??
                  "A avaliação não foi encontrada."}
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
  
    const classroom =
      classroomById.get(
        assessment.classroomId,
      );
  
    const isDraft =
      assessment.status === "DRAFT";
  
    return (
      <>
        <Link
          to="/professor/avaliacoes"
          className="teacher-back-link"
        >
          ← Voltar para avaliações
        </Link>
  
        <div className="teacher-assessment-title-row">
          <TeacherPageHeader
            eyebrow="Avaliação diagnóstica"
            title={assessment.title}
            description={
              assessment.description ??
              "Nenhuma descrição informada."
            }
          />
  
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
        </div>
  
        <section className="teacher-classroom-overview">
          <article>
            <span>Turma</span>
  
            <strong>
              {classroom?.name ??
                "Turma não encontrada"}
            </strong>
          </article>
  
          <article>
            <span>Disciplina</span>
  
            <strong>
              {classroom?.subject ?? "—"}
            </strong>
          </article>
  
          <article>
            <span>Questões</span>
  
            <strong>
              {getQuestionCountLabel(
                assessment.questionCount,
              )}
            </strong>
          </article>
        </section>
  
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
  
        {isDraft ? (
          <>
            <section className="teacher-panel">
              <div className="teacher-panel-header">
                <h2>Adicionar questão</h2>
  
                <p>
                  Escolha a habilidade, escreva
                  o enunciado e defina a resposta
                  correta.
                </p>
              </div>
  
              <AssessmentQuestionForm
                skills={skills}
                onSubmit={handleAddQuestion}
              />
            </section>
  
            <section className="teacher-publish-panel">
              <div>
                <strong>
                  Publicar avaliação
                </strong>
  
                <p>
                  Após a publicação, os estudantes
                  da turma poderão responder e as
                  questões ficarão bloqueadas para
                  alterações.
                </p>
              </div>
  
              <button
                type="button"
                className="teacher-primary-button"
                onClick={() =>
                  void handlePublish()
                }
                disabled={
                  isPublishing ||
                  assessment.questionCount === 0
                }
              >
                {isPublishing
                  ? "Publicando..."
                  : "Publicar avaliação"}
              </button>
            </section>
          </>
        ) : (
          <section className="teacher-feedback">
            <div>
              <strong>
                Avaliação em modo de leitura
              </strong>
  
              <p>
                Avaliações publicadas ou
                encerradas não podem ter suas
                questões alteradas.
              </p>
            </div>
          </section>
        )}
  
        <section className="teacher-panel">
          <div className="teacher-panel-header">
            <h2>Questões da avaliação</h2>
  
            <p>
              {getQuestionCountLabel(
                assessment.questionCount,
              )} cadastradas nesta avaliação.
            </p>
          </div>
  
          {assessment.questions.length === 0 ? (
            <div className="teacher-empty-state">
              <h2>
                Nenhuma questão cadastrada
              </h2>
  
              <p>
                Use o formulário acima para
                adicionar a primeira questão.
              </p>
            </div>
          ) : (
            <div className="teacher-question-list">
              {assessment.questions.map(
                (question, questionIndex) => {
                  const skill =
                    skillById.get(
                      question.skillId,
                    );
  
                  return (
                    <article
                      key={question.id}
                      className="teacher-question-card"
                    >
                      <div className="teacher-question-card-header">
                        <div>
                          <span className="teacher-question-number">
                            Questão{" "}
                            {questionIndex + 1}
                          </span>
  
                          <span className="teacher-question-skill">
                            {skill?.name ??
                              "Habilidade indisponível"}
                          </span>
                        </div>
  
                        {isDraft && (
                          <button
                            type="button"
                            className="teacher-danger-button"
                            disabled={
                              removingQuestionId ===
                              question.id
                            }
                            onClick={() =>
                              void handleRemoveQuestion(
                                question.id,
                                questionIndex + 1,
                              )
                            }
                          >
                            {removingQuestionId ===
                            question.id
                              ? "Removendo..."
                              : "Remover questão"}
                          </button>
                        )}
                      </div>
  
                      <h3>
                        {question.statement}
                      </h3>
  
                      <ol className="teacher-question-alternatives">
                        {question.alternatives.map(
                          (alternative) => (
                            <li
                              key={alternative.id}
                              className={
                                alternative.isCorrect
                                  ? "is-correct"
                                  : ""
                              }
                            >
                              <span>
                                {alternative.text}
                              </span>
  
                              {alternative.isCorrect && (
                                <strong>
                                  Resposta correta
                                </strong>
                              )}
                            </li>
                          ),
                        )}
                      </ol>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      </>
    );
  }