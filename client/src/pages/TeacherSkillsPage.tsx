import {
  AlignLeft,
  BookOpenText,
  FilterX,
  LoaderCircle,
  Plus,
  RefreshCw,
  SearchX,
  Target,
  X,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import { SkillCreationForm } from "../components/SkillCreationForm";
import { Button } from "../components/ui/Button";
import { FeedbackBanner } from "../components/ui/FeedbackBanner";
import { PageHeader } from "../components/ui/PageHeader";
import { PageState } from "../components/ui/PageState";
import { SearchField } from "../components/ui/SearchField";
import { StatCard } from "../components/ui/StatCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { getErrorMessage } from "../lib/get-error-message";
import { normalizeSearch } from "../lib/normalize-search";
import {
  createTeacherSkill,
  getTeacherSkills,
} from "../services/teacher-api";
import type {
  CreateTeacherSkillInput,
  TeacherSkill,
} from "../types/teacher";

import "../styles/teacher-skills.css";

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

function getSkillCountLabel(
  count: number,
): string {
  return count === 1
    ? "1 habilidade"
    : `${count} habilidades`;
}

export function TeacherSkillsPage() {
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

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [subjectFilter, setSubjectFilter] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  const deferredSearchTerm =
    useDeferredValue(searchTerm);

  useEffect(() => {
    let isCancelled = false;

    async function loadSkills() {
      setIsLoading(true);
      setError(null);

      try {
        const skillList =
          await getTeacherSkills();

        if (!isCancelled) {
          setSkills(
            sortSkills(skillList),
          );
        }
      } catch (caughtError) {
        if (isCancelled) {
          return;
        }

        setError(
          getErrorMessage(
            caughtError,
            "Não foi possível carregar as habilidades.",
          ),
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSkills();

    return () => {
      isCancelled = true;
    };
  }, [reloadKey]);

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          skills.map(
            (skill) =>
              skill.subject,
          ),
        ),
      ).sort(
        (
          firstSubject,
          secondSubject,
        ) =>
          firstSubject.localeCompare(
            secondSubject,
            "pt-BR",
          ),
      ),
    [skills],
  );

  const filteredSkills =
    useMemo(() => {
      const normalizedTerm =
        normalizeSearch(
          deferredSearchTerm,
        );

      return skills.filter(
        (skill) => {
          if (
            subjectFilter &&
            skill.subject !==
              subjectFilter
          ) {
            return false;
          }

          if (!normalizedTerm) {
            return true;
          }

          const searchableContent =
            normalizeSearch(
              [
                skill.name,
                skill.subject,
                skill.description,
              ].join(" "),
            );

          return searchableContent.includes(
            normalizedTerm,
          );
        },
      );
    }, [
      skills,
      deferredSearchTerm,
      subjectFilter,
    ]);

  const describedSkillCount =
    useMemo(
      () =>
        skills.filter(
          (skill) =>
            Boolean(
              skill.description?.trim(),
            ),
        ).length,
      [skills],
    );

  const hasActiveFilters =
    Boolean(
      searchTerm ||
      subjectFilter,
    );

  async function handleCreateSkill(
    input: CreateTeacherSkillInput,
  ): Promise<boolean> {
    setManagementSuccess(null);
    setManagementError(null);

    try {
      const createdSkill =
        await createTeacherSkill(
          input,
        );

      setSkills(
        (currentSkills) =>
          sortSkills([
            ...currentSkills,
            createdSkill,
          ]),
      );

      setSearchTerm("");
      setSubjectFilter("");
      setIsCreateOpen(false);

      setManagementSuccess(
        `${createdSkill.name} foi cadastrada com sucesso.`,
      );

      return true;
    } catch (caughtError) {
      setManagementError(
        getErrorMessage(
          caughtError,
          "Não foi possível cadastrar a habilidade.",
        ),
      );

      return false;
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setSubjectFilter("");
  }

  function toggleCreationForm() {
    setIsCreateOpen(
      (currentValue) =>
        !currentValue,
    );

    setManagementError(null);
  }

  return (
    <div className="teacher-skills-page">
      <PageHeader
        eyebrow="Planejamento pedagógico"
        title="Habilidades"
        description="Organize os objetivos de aprendizagem utilizados nas questões e avaliações diagnósticas."
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
          >
            {isCreateOpen
              ? "Fechar formulário"
              : "Nova habilidade"}
          </Button>
        }
      />

      {managementSuccess && (
        <FeedbackBanner
          tone="success"
          title="Habilidade cadastrada"
          description={
            managementSuccess
          }
        />
      )}

      {managementError && (
        <FeedbackBanner
          tone="error"
          title="Não foi possível cadastrar a habilidade"
          description={
            managementError
          }
        />
      )}

      {isCreateOpen && (
        <section className="teacher-skills-creation">
          <div className="teacher-skills-creation-header">
            <h2>Nova habilidade</h2>

            <p>
              Cadastre um objetivo de
              aprendizagem que poderá ser
              vinculado às questões das
              avaliações diagnósticas.
            </p>
          </div>

          <SkillCreationForm
            onSubmit={
              handleCreateSkill
            }
            onCancel={() =>
              setIsCreateOpen(false)
            }
          />
        </section>
      )}

      {!isLoading &&
        !error &&
        skills.length > 0 && (
          <section
            className="teacher-skills-overview"
            aria-label="Resumo das habilidades"
          >
            <StatCard
              label="Habilidades"
              value={skills.length}
              description="Objetivos cadastrados"
              icon={Target}
              tone="primary"
            />

            <StatCard
              label="Disciplinas"
              value={subjects.length}
              description="Áreas representadas"
              icon={BookOpenText}
              tone="teal"
            />

            <StatCard
              label="Com descrição"
              value={
                describedSkillCount
              }
              description="Objetivos detalhados"
              icon={AlignLeft}
              tone="neutral"
            />
          </section>
        )}

      {isLoading && (
        <PageState
          icon={LoaderCircle}
          title="Carregando habilidades"
          description="Estamos consultando o catálogo pedagógico do RadarAprende."
          tone="primary"
          isLoading
        />
      )}

      {!isLoading && error && (
        <FeedbackBanner
          tone="error"
          title="Não foi possível carregar as habilidades"
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
        skills.length > 0 && (
          <section className="teacher-skills-toolbar">
            <SearchField
              id="skill-search"
              value={searchTerm}
              onChange={setSearchTerm}
              label="Pesquisar habilidades"
              placeholder="Buscar por nome, disciplina ou descrição..."
            />

            <div className="teacher-skills-filter">
              <label htmlFor="skill-subject-filter">
                Disciplina
              </label>

              <select
                id="skill-subject-filter"
                value={subjectFilter}
                onChange={(event) =>
                  setSubjectFilter(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Todas as disciplinas
                </option>

                {subjects.map(
                  (subject) => (
                    <option
                      key={subject}
                      value={subject}
                    >
                      {subject}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="teacher-skills-toolbar-action">
              <span
                className="teacher-skills-result-count"
                aria-live="polite"
              >
                {hasActiveFilters
                  ? `${filteredSkills.length} de ${skills.length}`
                  : getSkillCountLabel(
                      skills.length,
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
        skills.length === 0 && (
          <PageState
            icon={Target}
            title="Nenhuma habilidade cadastrada"
            description="Cadastre a primeira habilidade para começar a organizar os objetivos das avaliações."
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
                Nova habilidade
              </Button>
            }
          />
        )}

      {!isLoading &&
        !error &&
        skills.length > 0 &&
        filteredSkills.length === 0 && (
          <PageState
            icon={SearchX}
            title="Nenhuma habilidade corresponde aos filtros"
            description="Tente outro termo de pesquisa ou selecione uma disciplina diferente."
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
        filteredSkills.length > 0 && (
          <section
            className="teacher-skills-grid"
            aria-label="Habilidades cadastradas"
          >
            {filteredSkills.map(
              (skill) => {
                const hasDescription =
                  Boolean(
                    skill.description?.trim(),
                  );

                return (
                  <article
                    key={skill.id}
                    className="teacher-skills-card"
                  >
                    <div className="teacher-skills-card-top">
                      <span className="teacher-skills-subject">
                        {skill.subject}
                      </span>

                      <StatusBadge
                        tone={
                          skill.active
                            ? "success"
                            : "neutral"
                        }
                      >
                        {skill.active
                          ? "Ativa"
                          : "Inativa"}
                      </StatusBadge>
                    </div>

                    <h2>{skill.name}</h2>

                    <p
                      className={[
                        "teacher-skills-description",
                        hasDescription
                          ? ""
                          : "is-empty",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {skill.description ??
                        "Nenhuma descrição informada."}
                    </p>

                    <footer className="teacher-skills-card-footer">
                      <Target
                        size={15}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />

                      <span>
                        Disponível para questões
                        diagnósticas
                      </span>
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