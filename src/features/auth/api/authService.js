import { requestNoAuth, setStoredTokens } from "@/lib/api";

export const authService = {
  async login(usernameOrEmail, password) {
    const data = await requestNoAuth("/iam-service/api/auth/login", {
      method: "POST",
      body: { usernameOrEmail, password },
    });
    const payload = data?.data || data;
    setStoredTokens(payload);
    return payload;
  },

  async googleAuth(idToken) {
    const data = await requestNoAuth("/iam-service/api/auth/google", {
      method: "POST",
      body: { idToken },
    });
    const payload = data?.data || data;
    setStoredTokens(payload);
    return payload;
  },

  async googleAuthCode(code) {
    const data = await requestNoAuth("/iam-service/api/auth/google/code", {
      method: "POST",
      body: { code },
    });
    const payload = data?.data || data;
    setStoredTokens(payload);
    return payload;
  },

  async githubAuth(code) {
    const data = await requestNoAuth("/iam-service/api/auth/github", {
      method: "POST",
      body: { code },
    });
    const payload = data?.data || data;
    setStoredTokens(payload);
    return payload;
  },

  logout() {
    setStoredTokens(null);
  },
};
