import { requestNoAuth, setStoredTokens } from "../lib/api";

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

  logout() {
    setStoredTokens(null);
  },
};

