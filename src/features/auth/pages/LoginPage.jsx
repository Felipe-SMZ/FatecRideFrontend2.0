import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@shared/components/ui/Input";
import { Button } from "@shared/components/ui/Button";
import { Alert } from "@shared/components/ui/Alert";
import { Card } from "@shared/components/ui/Card";
import { useAuthStore } from "../stores/authStore";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
});

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");
      await login(data.email, data.senha);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">F</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FATECRide</h1>
          <p className="text-gray-600 mt-2">Entre com sua conta</p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            error={errors.senha?.message}
            {...register("senha")}
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Não tem conta?{" "}
          <Link to="/cadastro" className="text-red-600 hover:text-red-700 font-medium">
            Cadastre-se
          </Link>
        </div>
      </Card>
    </div>
  );
}
