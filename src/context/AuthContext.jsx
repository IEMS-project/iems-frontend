import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getStoredTokens } from "../lib/api";
import { userService } from "../services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getStoredTokens());
  const [userProfile, setUserProfile] = useState(null);
  const isAuthenticated = !!session?.accessToken;

  useEffect(() => {
    // If not authenticated, ensure we land on login
    // Do not force when already on /login (handled by routes)
  }, [isAuthenticated]);

  // Load user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && !userProfile) {
      const loadUserProfile = async () => {
        try {
          const profile = await userService.getMyProfileInfo();
          setUserProfile(profile);
        } catch (error) {
          console.error("Failed to load user profile:", error);
        }
      };
      loadUserProfile();
    } else if (!isAuthenticated) {
      setUserProfile(null);
    }
  }, [isAuthenticated, userProfile]);

  const login = useCallback(async (usernameOrEmail, password) => {
    const payload = await api.login(usernameOrEmail, password);
    setSession(payload);
    
    // Load user profile after successful login
    try {
      const profile = await userService.getMyProfileInfo();
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to load user profile after login:", error);
    }
    
    navigate("/dashboard", { replace: true });
    return payload;
  }, [navigate]);

  const logout = useCallback(() => {
    api.logout();
    setSession(null);
    setUserProfile(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(() => ({ session, userProfile, isAuthenticated, login, logout }), [session, userProfile, isAuthenticated, login, logout]);

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



