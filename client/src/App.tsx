import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import "./App.css";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./hooks/use-auth";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StudentDashboardPage } from "./pages/StudentDashboardPage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";

function HomeRedirect() {
  const {
    user,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return (
      <main className="loading-page">
        <p>Carregando sua sessão...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <Navigate
      to={
        user.role === "TEACHER"
          ? "/professor"
          : "/aluno"
      }
      replace
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomeRedirect />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["TEACHER"]}
          />
        }
      >
        <Route
          path="/professor"
          element={
            <TeacherDashboardPage />
          }
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["STUDENT"]}
          />
        }
      >
        <Route
          path="/aluno"
          element={
            <StudentDashboardPage />
          }
        />
      </Route>

      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  );
}