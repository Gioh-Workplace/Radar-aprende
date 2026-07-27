import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import { DataSearch } from "../components/DataSearch";
import { SkillCreationForm } from "../components/SkillCreationForm";
import { TeacherPageHeader } from "../components/TeacherPageHeader";
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

export function TeacherSkillsPage() {
  const [skills, setSkills] =
    useState<TeacherSkill[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [managementSuccess, setManagementSuccess] =
    useState<string | null>(null);

  const [managementError, setManagementError] =
    useState<string | null>(null);

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
          setSkills(sortSkills(skillList));
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
            (skill) => skill.subject,
          ),
        ),
      ).sort((firstSubject, secondSubject) =>
        firstSubject.localeCompare(
          secondSubject,
          "pt-BR",
        ),
      ),
    [skills],
  );

  const filteredSkills = useMemo(() => {
    const normalizedTerm =
      normalizeSearch(deferredSearchTerm);

    return skills.filter((skill) => {
      if (
        subjectFilter &&
        skill.subject !== subjectFilter
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
    });
  }, [
    skills,
    deferredSearchTerm,
    subjectFilter,
  ]);

  async function handleCreateSkill(
    input: CreateTeacherSkillInput,
  ): Promise<boolean> {
    setManagementSuccess(null);
    setManagementError(null);

    try {
      const createdSkill =
        await createTeacherSkill(input);

      setSkills((currentSkills) =>
        sortSkills([
          ...currentSkills,
          createdSkill,
        ]),
      );

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

  return (
    <>
      <TeacherPageHeader
        eyebrow="Planejamento pedagógico"
        title="Habilidades"
        description="Consulte e organize as habilidades utilizadas para diagnosticar a aprendizagem."
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
          <h2>Cadastrar habilidade</h2>

          <p>
            Registre uma habilidade que poderá
            ser vinculada às questões das
            avaliações diagnósticas.
          </p>
        </div>

        <SkillCreationForm
          onSubmit={handleCreateSkill}
        />
      </section>

      {isLoading && (
        <section
          className="teacher-feedback"
          aria-live="polite"
        >
          <div>
            <strong>
              Carregando habilidades...
            </strong>

            <p>
              Estamos consultando o catálogo
              pedagógico.
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
              as habilidades
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
        skills.length > 0 && (
          <>
            <DataSearch
              value={searchTerm}
              onChange={setSearchTerm}
              label="Pesquisar habilidades"
              placeholder="Buscar por nome, disciplina ou descrição..."
              resultCount={filteredSkills.length}
              totalCount={skills.length}
            />

            <div className="teacher-filter-row">
              <div className="teacher-filter-control">
                <label htmlFor="skill-subject-filter">
                  Filtrar por disciplina
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

                  {subjects.map((subject) => (
                    <option
                      key={subject}
                      value={subject}
                    >
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              {(searchTerm ||
                subjectFilter) && (
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
        skills.length === 0 && (
          <section className="teacher-empty-state">
            <h2>
              Nenhuma habilidade cadastrada
            </h2>

            <p>
              Use o formulário acima para
              cadastrar a primeira habilidade.
            </p>
          </section>
        )}

      {!isLoading &&
        !error &&
        skills.length > 0 &&
        filteredSkills.length === 0 && (
          <section className="teacher-empty-state">
            <h2>
              Nenhuma habilidade encontrada
            </h2>

            <p>
              Não encontramos habilidades
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
        filteredSkills.length > 0 && (
          <section
            className="teacher-skill-grid"
            aria-label="Habilidades cadastradas"
          >
            {filteredSkills.map((skill) => (
              <article
                key={skill.id}
                className="teacher-skill-card"
              >
                <div className="teacher-skill-card-header">
                  <span className="teacher-skill-subject">
                    {skill.subject}
                  </span>

                  <span className="teacher-status-badge">
                    Ativa
                  </span>
                </div>

                <h2>{skill.name}</h2>

                <p>
                  {skill.description ??
                    "Nenhuma descrição informada."}
                </p>
              </article>
            ))}
          </section>
        )}
    </>
  );
}