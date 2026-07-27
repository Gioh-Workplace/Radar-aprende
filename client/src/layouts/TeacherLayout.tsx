import {
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Target,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  NavLink,
  Outlet,
} from "react-router";

import { BrandMark } from "../components/ui/BrandMark";
import { useAuth } from "../hooks/use-auth";

import "../styles/teacher-shell.css";

interface NavigationItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const primaryNavigation: NavigationItem[] = [
  {
    to: "/professor",
    label: "Visão geral",
    icon: LayoutDashboard,
    end: true,
  },
];

const managementNavigation: NavigationItem[] = [
  {
    to: "/professor/turmas",
    label: "Turmas",
    icon: UsersRound,
  },
  {
    to: "/professor/habilidades",
    label: "Habilidades",
    icon: Target,
  },
  {
    to: "/professor/avaliacoes",
    label: "Avaliações",
    icon: ClipboardCheck,
  },
];

function getInitials(
  name: string | undefined,
): string {
  if (!name) {
    return "PR";
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

function NavigationLink({
  item,
}: {
  item: NavigationItem;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        [
          "teacher-nav-link",
          isActive ? "is-active" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      <span
        className="teacher-nav-icon"
        aria-hidden="true"
      >
        <Icon
          size={18}
          strokeWidth={1.9}
        />
      </span>

      <span className="teacher-nav-label">
        {item.label}
      </span>
    </NavLink>
  );
}

export function TeacherLayout() {
  const {
    user,
    logout,
  } = useAuth();

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
            aria-label="Ir para a visão geral"
          >
            <BrandMark tone="dark" />
          </NavLink>

          <p>
            Transforme resultados em decisões
            pedagógicas mais claras.
          </p>
        </div>

        <nav
          className="teacher-navigation"
          aria-label="Navegação do professor"
        >
          <span className="teacher-nav-section-title">
            Principal
          </span>

          {primaryNavigation.map((item) => (
            <NavigationLink
              key={item.to}
              item={item}
            />
          ))}

          <span className="teacher-nav-section-title">
            Gestão
          </span>

          {managementNavigation.map((item) => (
            <NavigationLink
              key={item.to}
              item={item}
            />
          ))}
        </nav>

        <div className="teacher-sidebar-footer">
          <div className="teacher-user">
            <span
              className="teacher-user-avatar"
              aria-hidden="true"
            >
              {getInitials(user?.name)}
            </span>

            <div className="teacher-user-information">
              <strong>
                {user?.name ?? "Professor"}
              </strong>

              <span>
                Professor responsável
              </span>
            </div>
          </div>

          <button
            type="button"
            className="teacher-logout-button"
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