import { Link } from "react-router";

import { TeacherPageHeader } from "../components/TeacherPageHeader";
import { useAuth } from "../hooks/use-auth";

const summaryCards = [
  {
    label: "Turmas ativas",
    description:
      "Turmas vinculadas ao professor.",
  },
  {
    label: "Estudantes",
    description:
      "Alunos acompanhados nas turmas.",
  },
  {
    label: "Avaliações publicadas",
    description:
      "Diagnósticos disponíveis aos alunos.",
  },
];

export function TeacherDashboardPage() {
  const { user } = useAuth();

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
      >
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="teacher-summary-card"
          >
            <span>{card.label}</span>

            <strong>—</strong>

            <p>{card.description}</p>
          </article>
        ))}
      </section>

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
            <strong>Consultar habilidades</strong>

            <span>
              Organize as habilidades utilizadas
              nas avaliações diagnósticas.
            </span>
          </Link>

          <Link
            to="/professor/avaliacoes"
            className="teacher-action-card"
          >
            <strong>Gerenciar avaliações</strong>

            <span>
              Crie, publique e acompanhe
              avaliações.
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}