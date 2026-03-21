import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";

export default function Login() {
  const { loginWithGoogleCode, loginWithGithub } = useAuth();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const processingOauthCodeRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code || processingOauthCodeRef.current) return;

    const googleState = sessionStorage.getItem("google_oauth_state");
    const githubState = sessionStorage.getItem("github_oauth_state");

    let provider = null;
    if (googleState && state === googleState) {
      provider = "google";
      sessionStorage.removeItem("google_oauth_state");
    } else if (githubState && state === githubState) {
      provider = "github";
      sessionStorage.removeItem("github_oauth_state");
    }

    if (!provider) {
      setServerError("Đăng nhập thất bại: trạng thái xác thực không hợp lệ");
      return;
    }

    processingOauthCodeRef.current = true;

    window.history.replaceState({}, document.title, location.pathname);

    (async () => {
      setServerError("");
      setSubmitting(true);
      try {
        if (provider === "google") {
          await loginWithGoogleCode(code);
        } else {
          await loginWithGithub(code);
        }
      } catch (err) {
        const fallbackMessage = provider === "google" ? "Đăng nhập Google thất bại" : "Đăng nhập GitHub thất bại";
        setServerError(err?.message || fallbackMessage);
      } finally {
        setSubmitting(false);
        processingOauthCodeRef.current = false;
      }
    })();
  }, [location.pathname, location.search, loginWithGithub, loginWithGoogleCode]);

  function handleLoginWithGoogle() {
    setServerError("");

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      setServerError("Thiếu cấu hình VITE_GOOGLE_CLIENT_ID");
      return;
    }

    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin;
    const state = crypto.randomUUID();
    sessionStorage.setItem("google_oauth_state", state);

    const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleUrl.searchParams.set("client_id", googleClientId);
    googleUrl.searchParams.set("redirect_uri", redirectUri);
    googleUrl.searchParams.set("response_type", "code");
    googleUrl.searchParams.set("scope", "openid email profile");
    googleUrl.searchParams.set("state", state);
    googleUrl.searchParams.set("prompt", "select_account");

    window.location.assign(googleUrl.toString());
  }

  function handleLoginWithGithub() {
    setServerError("");

    const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!githubClientId) {
      setServerError("Thiếu cấu hình VITE_GITHUB_CLIENT_ID");
      return;
    }

    const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI || window.location.origin;
    const state = crypto.randomUUID();
    sessionStorage.setItem("github_oauth_state", state);

    const githubUrl = new URL("https://github.com/login/oauth/authorize");
    githubUrl.searchParams.set("client_id", githubClientId);
    githubUrl.searchParams.set("redirect_uri", redirectUri);
    githubUrl.searchParams.set("scope", "read:user user:email");
    githubUrl.searchParams.set("state", state);

    window.location.assign(githubUrl.toString());
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen gap-0">
        <div className="bg-gray-100">
          <img src="/login.jpg" alt="Login" className="h-full w-full object-cover" />
        </div>

        <div className="flex items-center justify-center px-4 md:px-8">
          <div className="w-full max-w-md">
            <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-xl">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Đăng nhập</h1>
                {serverError && <p className="mt-2 text-sm text-red-600">{serverError}</p>}
              </div>

              <button
                type="button"
                onClick={handleLoginWithGoogle}
                disabled={submitting}
                className="mx-auto flex h-10 w-[320px] items-center justify-center gap-2 rounded-md border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#3c4043] hover:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg aria-hidden="true" viewBox="0 0 18 18" className="h-5 w-5">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.58 2.68-3.9 2.68-6.62z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.55-1.85.88-3.04.88-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.97 10.73A5.41 5.41 0 0 1 3.69 9c0-.6.1-1.18.28-1.73V4.94H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.06l3.01-2.33z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.43 1.35l2.57-2.57C13.47.93 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
                </svg>
                Đăng nhập với Google
              </button>

              <button
                type="button"
                onClick={handleLoginWithGithub}
                disabled={submitting}
                className="mt-3 mx-auto flex h-10 w-[320px] items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M12 0C5.37 0 0 5.37 0 12a12 12 0 0 0 8.2 11.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.66-.31-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.55.12-3.23 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.68.24 2.92.12 3.23.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.11.81 2.24v3.32c0 .32.22.7.83.58A12 12 0 0 0 24 12c0-6.63-5.37-12-12-12" />
                </svg>
                Đăng nhập với GitHub
              </button>

              {submitting && (
                <p className="mt-3 text-center text-sm text-gray-500">Đang xử lý đăng nhập...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
