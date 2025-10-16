import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getStoredTokens } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getStoredTokens());
  const isAuthenticated = !!session?.accessToken;

  useEffect(() => {
    // If not authenticated, ensure we land on login
    // Do not force when already on /login (handled by routes)
  }, [isAuthenticated]);

  const login = useCallback(async (usernameOrEmail, password) => {
    const payload = await api.login(usernameOrEmail, password);
    setSession(payload);
    navigate("/dashboard", { replace: true });
    return payload;
  }, [navigate]);

  const logout = useCallback(() => {
    api.logout();
    setSession(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(() => ({ session, isAuthenticated, login, logout }), [session, isAuthenticated, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}



