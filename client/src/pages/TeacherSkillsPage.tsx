import { TeacherPageHeader } from "../components/TeacherPageHeader";

export function TeacherSkillsPage() {
  return (
    <>
      <TeacherPageHeader
        eyebrow="Planejamento pedagógico"
        title="Habilidades"
        description="Consulte e organize as habilidades utilizadas para diagnosticar a aprendizagem."
      />

      <section className="teacher-empty-state">
        <h2>Catálogo de habilidades</h2>

        <p>
          Aqui serão exibidas as habilidades
          cadastradas pelo professor.
        </p>
      </section>
    </>
  );
}