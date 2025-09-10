import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Checkbox from "../components/ui/Checkbox";

export default function Login() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(false);
	const [errors, setErrors] = useState({});

	function validate() {
		const next = {};
		if (!email) next.email = "Vui lòng nhập email";
		if (!password) next.password = "Vui lòng nhập mật khẩu";
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	function handleSubmit(e) {
		e.preventDefault();
		if (!validate()) return;
		navigate("/dashboard", { replace: true });
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
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

            <Button type="submit" className="w-full">
              Đăng nhập
            </Button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

	);
}
