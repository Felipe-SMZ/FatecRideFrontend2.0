import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAnuncios } from '../hooks/useAnuncios';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';
import { Navbar } from '@shared/components/layout/Navbar';
import { Logo } from '@shared/components/ui/Logo';

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
    <div className="min-h-screen bg-gray-50">
      <Navbar showAuthButton={false} />
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <aside className="hidden md:flex flex-col items-center justify-center p-6 bg-white/60 rounded-lg shadow-md">
              <Logo size="xl" />
              <h2 className="mt-4 text-2xl font-bold">Área do Anunciante</h2>
              <p className="text-gray-600 mt-2 text-center">Gerencie seus anúncios e acompanhe resultados. Acesse com seu e-mail cadastrado.</p>
            </aside>

            <section>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Entrar</h3>
                {error && (
                  <div className="mb-4 text-sm text-red-700 bg-red-100 p-2 rounded" role="alert">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="anunciante-login">
                  <Input
                    label="Email"
                    placeholder="seu@exemplo.com"
                    value={email}
                    name="email"
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoggingIn}
                    helperText="Use o email cadastrado para acessar a área do anunciante"
                    required
                  />

                  <Input
                    label="Senha"
                    placeholder="Sua senha"
                    type="password"
                    value={senha}
                    name="senha"
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={isLoggingIn}
                    helperText="Mínimo 6 caracteres"
                    required
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm">
                      <Link to="/anunciante/register" className="text-blue-600 hover:underline">Ainda não tem conta? Cadastre-se</Link>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" loading={isLoggingIn}>{isLoggingIn ? 'Entrando...' : 'Entrar'}</Button>
                      <Button type="button" variant="secondary" onClick={() => navigate('/anunciante')} disabled={isLoggingIn}>Ir para o Painel</Button>
                    </div>
                  </div>
                </form>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnuncianteLogin;
