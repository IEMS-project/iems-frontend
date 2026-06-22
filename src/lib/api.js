import axios from "axios";

const DEFAULT_GATEWAY_URL =
  typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";

const GATEWAY_BASE_URL = import.meta.env.VITE_GATEWAY_URL || DEFAULT_GATEWAY_URL;
const CHATBOT_BASE_URL = import.meta.env.VITE_CHATBOT_URL || `${GATEWAY_BASE_URL}/ai-service`;
const STORAGE_KEY = "iems.auth";

function getStoredTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setStoredTokens(payload) {
  if (!payload) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const safe = {
    accessToken: payload?.accessToken,
    refreshToken: payload?.refreshToken,
    userInfo: payload?.userInfo,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const currentPath = window.location.pathname;
  if (currentPath === "/login" || currentPath === "/admin-login") return;
  window.location.replace("/login");
}

function clearAuthAndRedirect() {
  setStoredTokens(null);
  localStorage.removeItem("github_access_token");
  redirectToLogin();
}

function isAccountLockedPayload(data) {
  const message = String(data?.message || data?.error || "").toLowerCase();
  return message.includes("account is locked") || message.includes("account locked");
}

function shouldForceLoginFromAxiosError(error) {
  return error?.response?.status === 403 && isAccountLockedPayload(error.response?.data);
}

async function shouldForceLoginFromFetchResponse(response) {
  if (response?.status !== 403) return false;

  try {
    const contentType = response.headers?.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return isAccountLockedPayload(await response.clone().json());
    }
    return isAccountLockedPayload({ message: await response.clone().text() });
  } catch {
    return false;
  }
}

let refreshingPromise = null;

const gatewayClient = axios.create({
  baseURL: GATEWAY_BASE_URL,
});

function toWithCredentials(credentials = "include") {
  return credentials === "include";
}

function normalizeAxiosError(error) {
  if (!error?.isAxiosError) {
    return error instanceof Error ? error : new Error("Request failed");
  }

  const status = error.response?.status;
  const data = error.response?.data;
  const message = data?.message || data?.error || error.message || "Request failed";
  const normalizedError = new Error(message);
  normalizedError.status = status;
  normalizedError.data = data;

  // Auto-trigger premium upgrade modal on 402 Payment Required
  if (status === 402) {
    window.dispatchEvent(new CustomEvent("premium:required", { detail: { message } }));
  }

  return normalizedError;
}

async function refreshAccessToken() {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    try {
      const tokens = getStoredTokens();
      const refreshToken = tokens?.refreshToken;
      const refreshBody = refreshToken ? { refreshToken } : undefined;

      const res = await axios.post(
        `${GATEWAY_BASE_URL}/iam-service/api/auth/refresh`,
        refreshBody,
        {
          withCredentials: true,
          headers: refreshToken ? { "Content-Type": "application/json" } : undefined,
        },
      );

      const data = res.data;

      const payload = data?.data || data;
      if (!payload?.accessToken) {
        throw new Error("No access token returned from refresh");
      }

      console.log("[Token Refresh] Successfully refreshed access token");
      setStoredTokens(payload);
      return payload.accessToken;
    } catch (error) {
      console.error("[Token Refresh] Error during token refresh:", error.message);
      throw error;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

gatewayClient.interceptors.request.use((config) => {
  const withAuth = config.withAuth !== false;
  if (!withAuth) return config;

  const tokens = getStoredTokens();
  if (tokens?.accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  return config;
});

gatewayClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error?.config;
    const status = error?.response?.status;

    if (shouldForceLoginFromAxiosError(error)) {
      clearAuthAndRedirect();
      throw normalizeAxiosError(error);
    }

    if (!originalConfig || status !== 401) {
      throw normalizeAxiosError(error);
    }

    const isRefreshCall = String(originalConfig.url || "").includes("/iam-service/api/auth/refresh");
    const withAuth = originalConfig.withAuth !== false;
    const retryOn401 = originalConfig.retryOn401 !== false;

    if (isRefreshCall || !withAuth || !retryOn401 || originalConfig._retry) {
      throw normalizeAxiosError(error);
    }

    originalConfig._retry = true;
    console.log(`[API] Received 401 for ${originalConfig.method?.toUpperCase()} ${originalConfig.url}, attempting token refresh...`);

    try {
      const newAccessToken = await refreshAccessToken();

      if (!newAccessToken) {
        const refreshError = new Error("Token refresh failed - no new access token");
        refreshError.status = 401;
        throw refreshError;
      }

      originalConfig.headers = originalConfig.headers || {};
      originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
      console.log(`[API] Retrying ${originalConfig.method?.toUpperCase()} ${originalConfig.url} with refreshed token`);
      return gatewayClient.request(originalConfig);
    } catch (refreshError) {
      console.error(`[API] Token refresh failed for ${originalConfig.method?.toUpperCase()} ${originalConfig.url}:`, refreshError.message);
      clearAuthAndRedirect();
      throw normalizeAxiosError(refreshError);
    }
  },
);

function hasContentType(headers = {}) {
  return Object.keys(headers).some((key) => key.toLowerCase() === "content-type");
}

function prepareBody(body, headers) {
  if (body === undefined || body === null) return undefined;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (isFormData) return body;

  const isBlob = typeof Blob !== "undefined" && body instanceof Blob;
  if (isBlob) return body;

  if (body instanceof URLSearchParams) {
    if (!hasContentType(headers)) {
      headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
    }
    return body;
  }

  if (typeof body === "string") {
    if (!hasContentType(headers)) {
      const trimmed = body.trim();
      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        headers["Content-Type"] = "application/json";
      } else {
        headers["Content-Type"] = "text/plain;charset=UTF-8";
      }
    }
    return body;
  }

  if (!hasContentType(headers)) {
    headers["Content-Type"] = "application/json";
  }

  return JSON.stringify(body);
}

function prepareDataForAxios(body, headers, isFormData) {
  if (isFormData) return body;
  return prepareBody(body, headers);
}

async function baseRequest(path, {
  method = "GET",
  headers = {},
  body,
  baseUrl = GATEWAY_BASE_URL,
  withAuth = true,
  retryOn401 = true,
  credentials = "include",
  isFormData = false,
  onUploadProgress,
  signal,
} = {}) {
  const finalHeaders = { ...headers };

  const data = prepareDataForAxios(body, finalHeaders, isFormData);
  const requestConfig = {
    url: path,
    method,
    baseURL: baseUrl,
    headers: finalHeaders,
    data,
    withCredentials: toWithCredentials(credentials),
    withAuth,
    retryOn401,
    onUploadProgress,
    signal,
  };

  try {
    const response = await gatewayClient.request(requestConfig);
    return response.data;
  } catch (error) {
    throw normalizeAxiosError(error);
  }
}

async function fetchWithAuthRefresh(url, {
  method = "GET",
  headers = {},
  body,
  withAuth = true,
  retryOn401 = true,
  credentials = "include",
} = {}) {
  const finalHeaders = { ...headers };
  const preparedBody = prepareBody(body, finalHeaders);

  const attachAccessToken = () => {
    if (!withAuth) return;
    const tokens = getStoredTokens();
    if (tokens?.accessToken) {
      finalHeaders.Authorization = `Bearer ${tokens.accessToken}`;
    }
  };

  attachAccessToken();

  let response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: preparedBody,
    credentials,
  });

  if (await shouldForceLoginFromFetchResponse(response)) {
    clearAuthAndRedirect();
  }

  if (response.status === 401 && withAuth && retryOn401) {
    try {
      const newAccessToken = await refreshAccessToken();
      if (!newAccessToken) {
        const refreshError = new Error("Token refresh failed - no new access token");
        refreshError.status = 401;
        throw refreshError;
      }

      finalHeaders.Authorization = `Bearer ${newAccessToken}`;
      response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: preparedBody,
        credentials,
      });

      if (await shouldForceLoginFromFetchResponse(response)) {
        clearAuthAndRedirect();
      }
    } catch (error) {
      clearAuthAndRedirect();
      throw normalizeAxiosError(error);
    }
  }

  return response;
}

function request(path, options = {}) {
  return baseRequest(path, options);
}

function requestNoAuth(path, options = {}) {
  return baseRequest(path, { ...options, withAuth: false });
}

function chatbotRequest(path, options = {}) {
  return baseRequest(path, {
    ...options,
    baseUrl: CHATBOT_BASE_URL,
    credentials: options.credentials ?? "omit",
    retryOn401: options.retryOn401 ?? true,
  });
}

export {
  GATEWAY_BASE_URL,
  CHATBOT_BASE_URL,
  getStoredTokens,
  setStoredTokens,
  refreshAccessToken,
  baseRequest,
  fetchWithAuthRefresh,
  request,
  requestNoAuth,
  chatbotRequest,
};
