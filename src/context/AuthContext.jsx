import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredTokens } from "../lib/api";
import { authService } from "../services/authService";
import { userService } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getStoredTokens());
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const isAuthenticated = !!session?.accessToken;

  // Load user profile when authenticated
  const loadUserProfile = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoadingProfile(true);
    try {
      const profile = await userService.getMyProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to load user profile:", error);
      setUserProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Load profile when authenticated and profile is not loaded yet
    if (isAuthenticated && !userProfile && !loadingProfile) {
      loadUserProfile();
    }
  }, [isAuthenticated, userProfile, loadingProfile, loadUserProfile]);

  const login = useCallback(async (usernameOrEmail, password) => {
    const payload = await authService.login(usernameOrEmail, password);
    setSession(payload);

    // Load user profile after login
    try {
      const profile = await userService.getMyProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to load user profile after login:", error);
    }

    navigate("/dashboard", { replace: true });
    return payload;
  }, [navigate]);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
    setUserProfile(null);
    // Remove GitHub token on logout
    localStorage.removeItem("github_access_token");
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(() => ({
    session,
    isAuthenticated,
    userProfile,
    loadingProfile,
    loadUserProfile,
    login,
    logout
  }), [session, isAuthenticated, userProfile, loadingProfile, loadUserProfile, login, logout]);

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



