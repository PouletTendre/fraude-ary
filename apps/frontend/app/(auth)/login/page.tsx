"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, isLoggingIn, loginError } = useAuth();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = "Email requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!password) {
      newErrors.password = "Mot de passe requis";
    } else if (password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      login({ email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Connexion</CardTitle>
          <p className="text-center text-sm text-text-tertiary mt-2">
            Connectez-vous à votre compte Fraude-Ary
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="vous@exemple.com"
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
            />
            {loginError && (
              <p className="text-sm text-loss text-center">
                Email ou mot de passe invalide
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? "Connexion..." : "Se Connecter"}
            </Button>
            <p className="text-center text-sm text-text-tertiary">
              Vous n&apos;avez pas de compte ?{" "}
              <Link href="/register" className="text-primary hover:underline dark:text-primary-hover">
                Créer un compte
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}