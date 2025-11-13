import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@shared/components/ui/Input";
import { Button } from "@shared/components/ui/Button";
import { Alert } from "@shared/components/ui/Alert";
import { Logo } from "@shared/components/ui/Logo";
import { useAuthStore } from "@features/auth/stores/authStore";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
});

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
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
      
      console.log('🔐 LoginPage: Iniciando login...');
      await login(data.email, data.senha);
      
      console.log('✅ Login concluído!');
      console.log('📊 Estado após login:', {
        isAuthenticated: useAuthStore.getState().isAuthenticated,
        user: useAuthStore.getState().user,
        token: useAuthStore.getState().token ? 'Presente' : 'Ausente'
      });
      
      console.log('🚀 Navegando para /inicio...');
      navigate("/inicio", { replace: true });
    } catch (err) {
      console.error('❌ Erro no login:', err);
      setError(err.response?.data?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors) => {
    console.error('Erros de validação no login:', errors);
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Azul com Logo e Mensagem */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-fatecride-blue via-fatecride-blue-dark to-fatecride-blue-darker relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white text-center">
          <Logo size="2xl" className="mb-8 drop-shadow-2xl" />
          <h1 className="text-5xl xl:text-6xl font-bold mb-4 drop-shadow-lg">
            Bem-vindo
          </h1>
          <p className="text-xl xl:text-2xl text-white/90">
            Pegue carona de um jeito mais fácil
          </p>
        </div>
      </div>

      {/* Lado Direito - Branco com Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="xl" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-3xl font-bold text-fatecride-blue mb-2">Login</h2>
            <p className="text-text-secondary mb-6">Acesse sua conta</p>

            {/* Alert de erro */}
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-6">
                {error}
              </Alert>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
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

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-fatecride-blue hover:text-fatecride-blue-dark font-semibold transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <Button 
                type="submit" 
                fullWidth 
                disabled={loading} 
                size="lg" 
                className="bg-fatecride-blue hover:bg-fatecride-blue-dark transition-colors shadow-md"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-text-secondary">ou</span>
              </div>
            </div>

            {/* Botão criar conta */}
            <Link to="/select-user-type" className="block">
              <Button 
                type="button" 
                fullWidth 
                className="bg-fatecride-blue hover:bg-fatecride-blue-dark transition-colors"
              >
                Criar conta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
