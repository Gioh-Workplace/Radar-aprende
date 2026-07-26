import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import "./App.css";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./hooks/use-auth";
import { TeacherLayout } from "./layouts/TeacherLayout";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StudentDashboardPage } from "./pages/StudentDashboardPage";
import { TeacherAssessmentsPage } from "./pages/TeacherAssessmentsPage";
import { TeacherClassroomsPage } from "./pages/TeacherClassroomsPage";
import { TeacherDashboardPage } from "./pages/TeacherDashboardPage";
import { TeacherSkillsPage } from "./pages/TeacherSkillsPage";
import { TeacherClassroomDetailsPage } from "./pages/TeacherClassroomDetailsPage";
import { TeacherAssessmentDetailsPage } from "./pages/TeacherAssessmentDetailsPage";

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
          element={<TeacherLayout />}
        >
          <Route
            index
            element={<TeacherDashboardPage />}
          />

          <Route
            path="turmas"
            element={<TeacherClassroomsPage />}
          />

          <Route
            path="turmas/:classroomId"
            element={
              <TeacherClassroomDetailsPage />
            }
          />

          <Route
            path="habilidades"
            element={<TeacherSkillsPage />}
          />

          <Route
            path="avaliacoes"
            element={<TeacherAssessmentsPage />}
          />

          <Route
            path="avaliacoes/:assessmentId"
            element={
              <TeacherAssessmentDetailsPage />
            }
          />
        </Route>
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
          element={<StudentDashboardPage />}
        />
      </Route>

      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  );
}