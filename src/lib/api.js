const GATEWAY_BASE_URL = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8080";
const CHATBOT_BASE_URL = import.meta.env.VITE_CHATBOT_URL || "http://localhost:8000";
const STORAGE_KEY = "iems.auth";

function getStoredTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_error) {
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

let refreshingPromise = null;

async function refreshAccessToken() {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    try {
      const tokens = getStoredTokens();
      const refreshToken = tokens?.refreshToken;
      const refreshBody = refreshToken ? JSON.stringify({ refreshToken }) : undefined;

      const res = await fetch(`${GATEWAY_BASE_URL}/iam-service/api/auth/refresh`, {
        method: "POST",
        headers: refreshToken ? { "Content-Type": "application/json" } : undefined,
        body: refreshBody,
        credentials: "include",
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await res.json().catch(() => null) : null;

      if (!res.ok) {
        const msg = data?.message || data?.error || res.statusText;
        console.error("[Token Refresh] Refresh failed:", msg);
        throw new Error(msg || "Refresh failed");
      }

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

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message = (isJson ? data?.message || data?.error : data) || res.statusText;
    const error = new Error(message || "Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
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
} = {}) {
  const finalHeaders = { ...headers };
  const tokens = getStoredTokens();

  if (withAuth && tokens?.accessToken) {
    finalHeaders["Authorization"] = `Bearer ${tokens.accessToken}`;
  }

  // Don't add Content-Type for FormData, let browser set it with boundary
  const preparedBody = isFormData ? body : prepareBody(body, finalHeaders);

  let response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: finalHeaders,
    body: preparedBody,
    credentials,
  });

  // Handle Unauthorized/Forbidden from expired access token - attempt to refresh token
  const shouldRetryWithRefresh = (response.status === 401 || response.status === 403) && withAuth && retryOn401;
  if (shouldRetryWithRefresh) {
    console.log(`[API] Received ${response.status} for ${method} ${path}, attempting token refresh...`);
    try {
      const newAccessToken = await refreshAccessToken();

      if (!newAccessToken) {
        const err = new Error("Token refresh failed - no new access token");
        err.status = 401;
        throw err;
      }

      // Retry request with new token
      finalHeaders["Authorization"] = `Bearer ${newAccessToken}`;
      console.log(`[API] Retrying ${method} ${path} with refreshed token`);

      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: finalHeaders,
        body: preparedBody,
        credentials,
      });
    } catch (error) {
      console.error(`[API] Token refresh failed for ${method} ${path}:`, error.message);
      clearAuthAndRedirect();
      const err = new Error(error.message || "Token refresh failed");
      err.status = error?.status || 401;
      throw err;
    }
  }

  return parseResponse(response);
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
    retryOn401: false,
  });
}

export {
  GATEWAY_BASE_URL,
  CHATBOT_BASE_URL,
  getStoredTokens,
  setStoredTokens,
  baseRequest,
  request,
  requestNoAuth,
  chatbotRequest,
};