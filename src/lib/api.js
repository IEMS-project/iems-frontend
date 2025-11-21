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
    userInfo: payload?.userInfo,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

let refreshingPromise = null;

async function refreshAccessToken() {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    try {
      const res = await fetch(`${GATEWAY_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await res.json().catch(() => null) : null;

      if (!res.ok) {
        setStoredTokens(null);
        const msg = data?.message || data?.error || res.statusText;
        throw new Error(msg || "Refresh failed");
      }

      const payload = data?.data || data;
      if (!payload?.accessToken) {
        throw new Error("No access token returned from refresh");
      }

      setStoredTokens({ accessToken: payload.accessToken, userInfo: payload.userInfo });
      return payload.accessToken;
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
    if (!hasContentType(headers)) headers["Content-Type"] = "text/plain;charset=UTF-8";
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
} = {}) {
  const finalHeaders = { ...headers };
  const tokens = getStoredTokens();

  if (withAuth && tokens?.accessToken) {
    finalHeaders["Authorization"] = `Bearer ${tokens.accessToken}`;
  }

  const preparedBody = prepareBody(body, finalHeaders);

  let response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: finalHeaders,
    body: preparedBody,
    credentials,
  });

  if (response.status === 401 && withAuth && retryOn401) {
    await refreshAccessToken();
    const newTokens = getStoredTokens();
    if (!newTokens?.accessToken) {
      const err = new Error(response.statusText || "Unauthorized");
      err.status = 401;
      throw err;
    }

    finalHeaders["Authorization"] = `Bearer ${newTokens.accessToken}`;
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: finalHeaders,
      body: preparedBody,
      credentials,
    });
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
  request,
  requestNoAuth,
  chatbotRequest,
};
