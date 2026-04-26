"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; full_name?: string }>({});
  const { register, isRegistering, registerError } = useAuth();

  const validate = () => {
    const newErrors: { email?: string; password?: string; full_name?: string } = {};
    if (!fullName) {
      newErrors.full_name = "Full name is required";
    }
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      register({ email, password, full_name: fullName });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Create Account</CardTitle>
          <p className="text-center text-sm text-text-tertiary mt-2">
            Join Fraude-Ary to track your portfolio
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.full_name}
              placeholder="John Doe"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
            />
            {registerError && (
              <p className="text-sm text-loss text-center">
                Registration failed. Email may already be in use.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isRegistering}>
              {isRegistering ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-center text-sm text-text-tertiary">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline dark:text-primary-hover">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}