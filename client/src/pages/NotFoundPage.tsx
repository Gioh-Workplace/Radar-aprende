import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <h1>Página não encontrada</h1>

      <Link to="/">
        Voltar ao início
      </Link>
    </main>
  );
}