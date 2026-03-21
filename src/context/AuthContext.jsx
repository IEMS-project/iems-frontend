import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredTokens } from "@/lib/api";
import { authService } from "@/features/auth/api/authService";
import { userService } from "@/features/profile/api/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getStoredTokens());
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const isAuthenticated = !!session?.accessToken;

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
    if (isAuthenticated && !userProfile && !loadingProfile) {
      loadUserProfile();
    }
  }, [isAuthenticated, userProfile, loadingProfile, loadUserProfile]);

  const finalizeLogin = useCallback(async (payload) => {
    setSession(payload);

    try {
      const profile = await userService.getMyProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to load user profile after login:", error);
    }

    navigate("/dashboard", { replace: true });
    return payload;
  }, [navigate]);

  const login = useCallback(async (usernameOrEmail, password) => {
    const payload = await authService.login(usernameOrEmail, password);
    return finalizeLogin(payload);
  }, [finalizeLogin]);

  const loginWithGoogle = useCallback(async (idToken) => {
    const payload = await authService.googleAuth(idToken);
    return finalizeLogin(payload);
  }, [finalizeLogin]);

  const loginWithGoogleCode = useCallback(async (code) => {
    const payload = await authService.googleAuthCode(code);
    return finalizeLogin(payload);
  }, [finalizeLogin]);

  const loginWithGithub = useCallback(async (code) => {
    const payload = await authService.githubAuth(code);
    return finalizeLogin(payload);
  }, [finalizeLogin]);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
    setUserProfile(null);
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
    loginWithGoogle,
    loginWithGoogleCode,
    loginWithGithub,
    logout
  }), [session, isAuthenticated, userProfile, loadingProfile, loadUserProfile, login, loginWithGoogle, loginWithGoogleCode, loginWithGithub, logout]);

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
