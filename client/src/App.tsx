import "./App.css";

function App() {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero__content">
          <span className="hero__badge">Educação baseada em dados</span>

          <h1>
            Identifique dificuldades.
            <span> Transforme a aprendizagem.</span>
          </h1>

          <p>
            O RadarAprende ajuda professores a criarem avaliações
            diagnósticas, acompanharem o desempenho dos alunos por habilidade
            e planejarem intervenções pedagógicas.
          </p>

          <div className="hero__actions">
            <button className="button button--primary" type="button">
              Acessar como professor
            </button>

            <button className="button button--secondary" type="button">
              Acessar como aluno
            </button>
          </div>
        </div>

        <aside className="summary-card">
          <div className="summary-card__header">
            <div>
              <span>Visão geral da turma</span>
              <strong>7º Ano A</strong>
            </div>

            <span className="summary-card__status">Atualizado</span>
          </div>

          <div className="summary-card__score">
            <span>Desempenho médio</span>
            <strong>68%</strong>
          </div>

          <div className="skill">
            <div className="skill__header">
              <span>Interpretação de texto</span>
              <strong>82%</strong>
            </div>
            <div className="skill__progress">
              <div style={{ width: "82%" }} />
            </div>
          </div>

          <div className="skill">
            <div className="skill__header">
              <span>Raciocínio lógico</span>
              <strong>64%</strong>
            </div>
            <div className="skill__progress">
              <div style={{ width: "64%" }} />
            </div>
          </div>

          <div className="skill">
            <div className="skill__header">
              <span>Frações</span>
              <strong>38%</strong>
            </div>
            <div className="skill__progress">
              <div style={{ width: "38%" }} />
            </div>
          </div>

          <p className="summary-card__recommendation">
            Frações requer atenção. Recomenda-se uma atividade de revisão
            guiada.
          </p>
        </aside>
      </section>
    </main>
  );
}

export default App;