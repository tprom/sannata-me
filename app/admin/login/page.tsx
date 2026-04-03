"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type State = "idle" | "loading" | "error";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const raw = searchParams.get("next") || "/agent";
    return raw.startsWith("/") ? raw : "/agent";
  }, [searchParams]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !payload?.ok) {
        setState("error");
        setMessage(payload?.message || "Не удалось войти.");
        return;
      }

      window.location.assign(nextPath);
    } catch {
      setState("error");
      setMessage("Ошибка сети. Попробуйте еще раз.");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "linear-gradient(180deg, #f6f7fb 0%, #eceff6 100%)",
      }}
    >
      <section
        style={{
          width: "min(420px, 100%)",
          background: "#fff",
          border: "1px solid #d8deea",
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 12px 24px rgba(30, 41, 59, 0.12)",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 12, fontSize: 24 }}>
          Вход в админ-панель
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Логин</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Пароль</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={state === "loading"}
            style={{
              marginTop: 4,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #2f6ce0",
              background: "#2f6ce0",
              color: "#fff",
              fontWeight: 600,
              cursor: state === "loading" ? "wait" : "pointer",
            }}
          >
            {state === "loading" ? "Входим..." : "Войти"}
          </button>

          {process.env.NODE_ENV !== "production" ? (
            <p style={{ margin: 0, color: "#475467", fontSize: 13 }}>
              Локально по умолчанию: login `admin`, password `admin` (если env
              не заданы).
            </p>
          ) : null}

          {message ? (
            <p style={{ margin: 0, color: "#b42318", fontSize: 14 }}>
              {message}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
