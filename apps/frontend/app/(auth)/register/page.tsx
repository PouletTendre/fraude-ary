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
      newErrors.full_name = "Le nom complet est requis";
    }
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
      register({ email, password, full_name: fullName });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Créer un Compte</CardTitle>
          <p className="text-center text-sm text-text-tertiary mt-2">
            Rejoignez Fraude-Ary pour suivre votre portfolio
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nom complet"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.full_name}
              placeholder="Jean Dupont"
            />
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
            {registerError && (
              <p className="text-sm text-loss text-center">
                Échec de l&apos;inscription. Cet email est peut-être déjà utilisé.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isRegistering}>
              {isRegistering ? "Création du compte..." : "Créer un Compte"}
            </Button>
            <p className="text-center text-sm text-text-tertiary">
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="text-primary hover:underline dark:text-primary-hover">
                Se connecter
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}