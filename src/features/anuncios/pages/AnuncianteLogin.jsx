import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAnuncios } from '../hooks/useAnuncios';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';

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
    <div className="max-w-md mx-auto mt-12">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Área do Anunciante</h2>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-100 p-2 rounded">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Email"
            value={email}
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoggingIn}
          />
          <Input
            placeholder="Senha"
            type="password"
            value={senha}
            name="senha"
            onChange={(e) => setSenha(e.target.value)}
            disabled={isLoggingIn}
          />
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <Link to="/anunciante/register" className="text-blue-600 hover:underline">Criar conta</Link>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoggingIn}>{isLoggingIn ? 'Entrando...' : 'Entrar'}</Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/anunciante')} disabled={isLoggingIn}>Ir para o Painel</Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default AnuncianteLogin;
