import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Checkbox from "../components/ui/Checkbox";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
    const { login } = useAuth();
    const location = useLocation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(false);
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
    {/* Left image */}
    <div className=" bg-gray-100">
      <img
        src="/login.jpg"
        alt="Login"
        className="h-full w-full object-cover"
      />
    </div>

    {/* Right form */}
    <div className="flex items-center justify-center px-4 md:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Đăng nhập</h1>
            {serverError && (
                <p className="mt-2 text-sm text-red-600">{serverError}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            <div className="flex items-center justify-between">
              <Checkbox
                label="Ghi nhớ tôi"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

	);
}
