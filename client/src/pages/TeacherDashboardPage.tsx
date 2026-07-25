import { useAuth } from "../hooks/use-auth";

export function TeacherDashboardPage() {
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

          <h1>Painel do professor</h1>

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
        <h2>Fundação conectada</h2>

        <p>
          A próxima etapa trará turmas,
          estudantes, habilidades e avaliações.
        </p>
      </section>
    </main>
  );
}