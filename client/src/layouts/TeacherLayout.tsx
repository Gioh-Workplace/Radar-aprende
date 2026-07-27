import {
    NavLink,
    Outlet,
  } from "react-router";
  
  import { useAuth } from "../hooks/use-auth";
  
  import "./TeacherLayout.css";
  
  interface NavigationItem {
    to: string;
    label: string;
    abbreviation: string;
    end?: boolean;
  }
  
  const navigationItems: NavigationItem[] = [
    {
      to: "/professor",
      label: "Visão geral",
      abbreviation: "IN",
      end: true,
    },
    {
      to: "/professor/turmas",
      label: "Turmas",
      abbreviation: "TU",
    },
    {
      to: "/professor/habilidades",
      label: "Habilidades",
      abbreviation: "HA",
    },
    {
      to: "/professor/avaliacoes",
      label: "Avaliações",
      abbreviation: "AV",
    },
  ];
  
  function getInitials(
    name: string | undefined,
  ): string {
    if (!name) {
      return "PR";
    }
  
    const nameParts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  
    return nameParts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }
  
  export function TeacherLayout() {
    const {
      user,
      logout,
    } = useAuth();
  
    const initials = getInitials(user?.name);
  
    return (
      <div className="teacher-shell">
        <a
          href="#teacher-main-content"
          className="app-skip-link"
        >
          Ir para o conteúdo principal
        </a>
    
        <aside className="teacher-sidebar">
          <div className="teacher-sidebar-header">
            <NavLink
              to="/professor"
              className="teacher-brand"
              aria-label="Ir para o início"
            >
              <span
                className="teacher-brand-symbol"
                aria-hidden="true"
              >
                R
              </span>
  
              <span>
                RadarAprende
              </span>
            </NavLink>
  
            <p>
              Decisões pedagógicas orientadas
              por evidências.
            </p>
          </div>
  
          <nav
            className="teacher-navigation"
            aria-label="Navegação do professor"
          >
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({
                  isActive,
                }) =>
                  [
                    "teacher-nav-link",
                    isActive
                      ? "is-active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                <span
                  className="teacher-nav-icon"
                  aria-hidden="true"
                >
                  {item.abbreviation}
                </span>
  
                <span>
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>
  
          <div className="teacher-sidebar-footer">
            <div className="teacher-user">
              <span
                className="teacher-user-avatar"
                aria-hidden="true"
              >
                {initials}
              </span>
  
              <div className="teacher-user-information">
                <strong>
                  {user?.name ?? "Professor"}
                </strong>
  
                <span>
                  Professor
                </span>
              </div>
            </div>
  
            <button
              type="button"
              className="teacher-logout-button"
              onClick={logout}
            >
              Sair da conta
            </button>
          </div>
        </aside>
  
        <main
          id="teacher-main-content"
          className="teacher-content"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    );
  }