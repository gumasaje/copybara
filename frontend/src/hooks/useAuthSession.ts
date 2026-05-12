import { useEffect, useState } from "react";
import { api, getStoredToken, setStoredToken } from "../api";
import type { User } from "../types";

export function useAuthSession() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoadingSession(false);
        return;
      }
      try {
        const me = await api.getMe();
        setUser(me);
      } catch {
        setStoredToken(null);
        setToken(null);
      } finally {
        setLoadingSession(false);
      }
    };
    bootstrap();
  }, [token]);

  useEffect(() => {
    setAuthError(null);
  }, [authMode]);

  async function handleAuthSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const nickname = String(formData.get("nickname") ?? "");
    setAuthError(null);

    try {
      if (authMode === "signup") {
        await api.signup(email, password, nickname);
      }
      const result = await api.login(email, password);
      setStoredToken(result.accessToken);
      setToken(result.accessToken);
      setUser({ memberId: result.memberId, email: result.email, nickname: result.nickname });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "인증에 실패했습니다.");
    }
  }

  function handleLogout() {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  }

  return {
    user,
    setUser,
    loadingSession,
    authMode,
    setAuthMode,
    authError,
    handleAuthSubmit,
    handleLogout
  };
}
