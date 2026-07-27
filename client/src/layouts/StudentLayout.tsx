import {
  BookOpenCheck,
  LogOut,
} from "lucide-react";
import {
  NavLink,
  Outlet,
} from "react-router";

import { BrandMark } from "../components/ui/BrandMark";
import { useAuth } from "../hooks/use-auth";

import "./StudentLayout.css";
import "../styles/student-shell.css";

function getInitials(
  name: string | undefined,
): string {
  if (!name) {
    return "AL";
  }

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
}

export function StudentLayout() {
  const {
    user,
    logout,
  } = useAuth();

  return (
    <div className="student-shell">
      <a
        href="#student-main-content"
        className="app-skip-link"
      >
        Ir para o conteúdo principal
      </a>

      <header className="student-topbar">
        <NavLink
          to="/aluno"
          className="student-brand"
          aria-label="Ir para minhas avaliações"
        >
          <BrandMark compact />
        </NavLink>

        <nav
          className="student-navigation"
          aria-label="Navegação do estudante"
        >
          <NavLink
            to="/aluno"
            end
            className={({ isActive }) =>
              [
                "student-navigation-link",
                isActive ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
          >
            <BookOpenCheck
              size={18}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>
              Minhas avaliações
            </span>
          </NavLink>
        </nav>

        <div className="student-account">
          <div className="student-user">
            <span
              className="student-user-avatar"
              aria-hidden="true"
            >
              {getInitials(user?.name)}
            </span>

            <div>
              <strong>
                {user?.name ?? "Estudante"}
              </strong>

              <span>
                {user?.registration ??
                  "Estudante"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="student-logout-button"
            onClick={logout}
            aria-label="Sair da conta"
          >
            <LogOut
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>Sair</span>
          </button>
        </div>
      </header>

      <main
        id="student-main-content"
        className="student-content"
        tabIndex={-1}
      >
        <Outlet />
      </main>
    </div>
  );
}