import { TeacherPageHeader } from "../components/TeacherPageHeader";

export function TeacherClassroomsPage() {
  return (
    <>
      <TeacherPageHeader
        eyebrow="Organização"
        title="Turmas"
        description="Consulte as turmas, acompanhe os estudantes e organize o contexto das avaliações."
      />

      <section className="teacher-empty-state">
        <h2>Integração de turmas preparada</h2>

        <p>
          No próximo checkpoint esta página
          será conectada ao endpoint de turmas
          do back-end.
        </p>
      </section>
    </>
  );
}