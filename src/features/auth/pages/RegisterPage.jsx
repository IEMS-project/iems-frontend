import React, { useState } from "react";
import { Link } from "react-router-dom";
import GoogleAuthButton from "@/features/auth/components/GoogleAuthButton";
import { useAuth } from "@/context/AuthContext.jsx";

export default function RegisterPage() {
  const { loginWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  async function handleGoogleCredential(credential) {
    setServerError("");
    setSubmitting(true);
    try {
      await loginWithGoogle(credential);
    } catch (error) {
      setServerError(error?.message || "Đăng ký với Google thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen gap-0">
        <div className="bg-gray-100">
          <img src="/login.jpg" alt="Register" className="h-full w-full object-cover" />
        </div>

        <div className="flex items-center justify-center px-4 md:px-8">
          <div className="w-full max-w-md">
            <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-xl">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Đăng ký bằng Google</h1>
                {serverError && <p className="mt-2 text-sm text-red-600">{serverError}</p>}
              </div>

              <GoogleAuthButton onCredential={handleGoogleCredential} text="signup_with" />

              {submitting && (
                <p className="mt-4 text-center text-sm text-gray-500">Đang xử lý đăng ký...</p>
              )}

              <p className="mt-5 text-center text-sm text-gray-600">
                Đã có tài khoản?{" "}
                <Link to="/login" className="font-medium text-blue-600 hover:underline">
                  Đăng nhập bằng Google
                </Link>
              </p>

              <p className="mt-2 text-center text-xs text-gray-500">
                Đăng ký tài khoản thường hiện không hỗ trợ cho người dùng client.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
