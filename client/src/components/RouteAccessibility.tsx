import { useEffect } from "react";
import { useLocation } from "react-router";

function getRouteTitle(
  pathname: string,
): string {
  if (pathname === "/login") {
    return "Entrar";
  }

  if (pathname === "/professor") {
    return "Visão geral do professor";
  }

  if (
    /^\/professor\/turmas\/[^/]+$/.test(
      pathname,
    )
  ) {
    return "Detalhes da turma";
  }

  if (
    pathname === "/professor/turmas"
  ) {
    return "Turmas";
  }

  if (
    pathname ===
    "/professor/habilidades"
  ) {
    return "Habilidades";
  }

  if (
    /^\/professor\/avaliacoes\/[^/]+\/resultados$/.test(
      pathname,
    )
  ) {
    return "Resultados da avaliação";
  }

  if (
    /^\/professor\/avaliacoes\/[^/]+$/.test(
      pathname,
    )
  ) {
    return "Detalhes da avaliação";
  }

  if (
    pathname ===
    "/professor/avaliacoes"
  ) {
    return "Avaliações";
  }

  if (pathname === "/aluno") {
    return "Minhas avaliações";
  }

  if (
    /^\/aluno\/avaliacoes\/[^/]+$/.test(
      pathname,
    )
  ) {
    return "Avaliação";
  }

  if (pathname === "/") {
    return "Início";
  }

  return "Página não encontrada";
}

export function RouteAccessibility() {
  const { pathname } = useLocation();

  useEffect(() => {
    const previousScrollRestoration =
      window.history.scrollRestoration;

    window.history.scrollRestoration =
      "manual";

    return () => {
      window.history.scrollRestoration =
        previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    document.title = `${getRouteTitle(
      pathname,
    )} | RadarAprende`;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    const animationFrame =
      window.requestAnimationFrame(
        () => {
          const mainContent =
            document.getElementById(
              "teacher-main-content",
            ) ??
            document.getElementById(
              "student-main-content",
            );

          mainContent?.focus({
            preventScroll: true,
          });
        },
      );

    return () => {
      window.cancelAnimationFrame(
        animationFrame,
      );
    };
  }, [pathname]);

  return null;
}