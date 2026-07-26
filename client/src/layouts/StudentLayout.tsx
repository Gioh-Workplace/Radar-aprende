import {
    NavLink,
    Outlet,
  } from "react-router";
  
  import { useAuth } from "../hooks/use-auth";
  
  import "./StudentLayout.css";
  
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
        <header className="student-topbar">
          <NavLink
            to="/aluno"
            className="student-brand"
            aria-label="Ir para as avaliações"
          >
            <span
              className="student-brand-symbol"
              aria-hidden="true"
            >
              R
            </span>
  
            <span>RadarAprende</span>
          </NavLink>
  
          <nav
            className="student-navigation"
            aria-label="Navegação do estudante"
          >
            <NavLink
              to="/aluno"
              end
              className={({
                isActive,
              }) =>
                [
                  "student-navigation-link",
                  isActive
                    ? "is-active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              Minhas avaliações
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
            >
              Sair
            </button>
          </div>
        </header>
  
        <main className="student-content">
          <Outlet />
        </main>
      </div>
    );
  }