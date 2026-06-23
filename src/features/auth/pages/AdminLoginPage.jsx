import React, { useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext.jsx";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate() {
    const next = {};
    if (!email) next.email = "Vui lòng nhập email";
    if (!password) next.password = "Vui lòng nhập mật khẩu";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setServerError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setServerError(err?.message || "Đăng nhập thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen gap-0">
        <div className="bg-gray-100">
          <img src="/login.jpg" alt="Admin Login" className="h-full w-full object-cover" />
        </div>

        <div className="flex items-center justify-center px-4 md:px-8">
          <div className="w-full max-w-md">
            <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-xl">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Đăng nhập quản trị</h1>
                {serverError && <p className="mt-2 text-sm text-red-600">{serverError}</p>}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email / Username</label>
                  <Input
                    type="text"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
                  <Input
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Đang đăng nhập..." : "Đăng nhập quản trị"}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-gray-600">
                Người dùng thường?{" "}
                <Link to="/login" className="font-medium text-blue-600 hover:underline">
                  Đăng nhập bằng Google
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
