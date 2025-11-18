import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAnuncios } from '../hooks/useAnuncios';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { PasswordInput } from '@shared/components/ui/PasswordInput';
import { Button } from '@shared/components/ui/Button';
import { Logo } from '@shared/components/ui/Logo';
import { Alert } from '@shared/components/ui/Alert';

export function AnuncianteLogin() {
  const navigate = useNavigate();
  const { loginAsync, isLoggingIn } = useAnuncios();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const token = await loginAsync({ email, senha });
      // loginAsync já salva o token no store/localStorage via hook
      if (token) {
        navigate('/anunciante', { replace: true });
      } else {
        setError('Resposta inesperada do servidor');
      }
    } catch (err) {
      // anunciosService/interceptor rejeita com Error(message)
      setError(err?.message || 'Falha ao autenticar');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Azul com Logo e Mensagem (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-fatecride-blue via-fatecride-blue-dark to-fatecride-blue-darker relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white text-center">
          <Logo size="2xl" className="mb-6 drop-shadow-2xl" />
          <h1 className="text-4xl font-bold mb-2">Área do Anunciante</h1>
          <p className="text-lg text-white/90">Gerencie seus anúncios e acompanhe seus resultados</p>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="xl" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-3xl font-bold text-fatecride-blue mb-2">Anunciante</h2>
            <p className="text-text-secondary mb-6">Acesse sua conta de anunciante</p>

            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-6">{error}</Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" aria-labelledby="anunciante-login">
              <Input
                label="Email"
                placeholder="seu@exemplo.com"
                value={email}
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoggingIn}
                required
              />

              <PasswordInput
                label="Senha"
                placeholder="Sua senha"
                value={senha}
                name="senha"
                onChange={(e) => setSenha(e.target.value)}
                disabled={isLoggingIn}
                required
              />

              <div className="text-right">
                <Link to="/anunciante/forgot" className="text-sm text-fatecride-blue hover:text-fatecride-blue-dark font-semibold">Esqueceu a senha?</Link>
              </div>

              <Button type="submit" fullWidth disabled={isLoggingIn} size="lg" className="bg-fatecride-blue hover:bg-fatecride-blue-dark transition-colors shadow-md">
                {isLoggingIn ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-text-secondary">ou</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link to="/anunciante/register" className="block">
                <Button type="button" fullWidth className="bg-fatecride-blue hover:bg-fatecride-blue-dark transition-colors">Criar conta de anunciante</Button>
              </Link>

              <div className="text-center">
                <Link to="/login" className="inline-block">
                  <Button type="button" variant="secondary">Login normal</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnuncianteLogin;
