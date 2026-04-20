"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setError("");
    setSuccess("");
    setLoading(false);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleResetRequest(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo }
    );

    if (resetError) {
      setError("Error al enviar el email. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(
      "Si el email está registrado, vas a recibir un enlace para restablecer tu contraseña. Revisá tu bandeja de entrada."
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600">
            <span className="text-2xl font-bold text-white">B</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Biodesign
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Portal de seguimiento de alineadores
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading && <Spinner />}
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Recuperar contraseña
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ingresá tu email y te enviaremos un enlace para restablecer tu
                  contraseña.
                </p>
              </div>

              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="tu@email.com"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                  {success}
                </div>
              )}

              {!success && (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading && <Spinner />}
                  {loading ? "Enviando..." : "Enviar email de recuperación"}
                </button>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Volver a iniciar sesión
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
