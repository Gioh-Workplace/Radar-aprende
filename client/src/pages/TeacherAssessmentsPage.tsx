import { TeacherPageHeader } from "../components/TeacherPageHeader";

export function TeacherAssessmentsPage() {
  return (
    <>
      <TeacherPageHeader
        eyebrow="Diagnósticos"
        title="Avaliações"
        description="Crie avaliações diagnósticas, publique atividades e acompanhe os resultados."
      />

      <section className="teacher-empty-state">
        <h2>Área de avaliações preparada</h2>

        <p>
          A listagem e o construtor de avaliações
          serão adicionados após a integração
          das turmas.
        </p>
      </section>
    </>
  );
}