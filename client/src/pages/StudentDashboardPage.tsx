import { useAuth } from "../hooks/use-auth";

export function StudentDashboardPage() {
  const {
    user,
    logout,
  } = useAuth();

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="brand-mark">
            RadarAprende
          </span>

          <h1>Painel do estudante</h1>

          <p>
            Olá, {user?.name}.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={logout}
          type="button"
        >
          Sair
        </button>
      </header>

      <section className="dashboard-placeholder">
        <h2>Avaliações disponíveis</h2>

        <p>
          Na próxima etapa exibiremos as
          avaliações publicadas para sua turma.
        </p>
      </section>
    </main>
  );
}