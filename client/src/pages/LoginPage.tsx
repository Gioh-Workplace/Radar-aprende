import {
    useState,
    type FormEvent,
  } from "react";
  import {
    Navigate,
    useNavigate,
  } from "react-router";
  
  import { ApiError } from "../lib/api";
  import { useAuth } from "../hooks/use-auth";
  
  export function LoginPage() {
    const {
      user,
      login,
    } = useAuth();
  
    const navigate = useNavigate();
  
    const [credential, setCredential] =
      useState("");
  
    const [password, setPassword] =
      useState("");
  
    const [error, setError] =
      useState<string | null>(null);
  
    const [isSubmitting, setIsSubmitting] =
      useState(false);
  
    if (user) {
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
  
    async function handleSubmit(
      event: FormEvent<HTMLFormElement>,
    ) {
      event.preventDefault();
  
      setError(null);
      setIsSubmitting(true);
  
      try {
        const authenticatedUser =
          await login(
            credential.trim(),
            password,
          );
  
        navigate(
          authenticatedUser.role === "TEACHER"
            ? "/professor"
            : "/aluno",
          {
            replace: true,
          },
        );
      } catch (caughtError) {
        if (caughtError instanceof ApiError) {
          setError(caughtError.message);
        } else {
          setError(
            "Não foi possível conectar ao servidor.",
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  
    return (
      <main className="login-page">
        <section className="login-introduction">
          <span className="brand-mark">
            RadarAprende
          </span>
  
          <h1>
            Transforme avaliações em decisões
            pedagógicas.
          </h1>
  
          <p>
            Acompanhe o desempenho da turma,
            identifique habilidades críticas e
            encontre caminhos para apoiar cada
            estudante.
          </p>
        </section>
  
        <section className="login-panel">
          <div className="login-card">
            <div>
              <span className="eyebrow">
                Acesso à plataforma
              </span>
  
              <h2>Entre na sua conta</h2>
  
              <p className="muted-text">
                Professores usam o e-mail.
                Estudantes usam a matrícula.
              </p>
            </div>
  
            <form onSubmit={handleSubmit}>
              <label htmlFor="credential">
                E-mail ou matrícula
              </label>
  
              <input
                id="credential"
                name="credential"
                value={credential}
                onChange={(event) =>
                  setCredential(
                    event.target.value,
                  )
                }
                autoComplete="username"
                placeholder="professor@escola.com ou ALUNO001"
                required
              />
  
              <label htmlFor="password">
                Senha
              </label>
  
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                autoComplete="current-password"
                placeholder="Digite sua senha"
                required
              />
  
              {error && (
                <div
                  className="error-message"
                  role="alert"
                >
                  {error}
                </div>
              )}
  
              <button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Entrando..."
                  : "Entrar"}
              </button>
            </form>
  
            <div className="demo-credentials">
              <strong>
                Ambiente demonstrativo
              </strong>
  
              <span>
                Professor:
                {" "}
                professor@radaraprende.demo
              </span>
  
              <span>
                Aluno: ALUNO001
              </span>
            </div>
          </div>
        </section>
      </main>
    );
  }