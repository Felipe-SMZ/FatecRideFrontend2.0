import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnuncios } from '../hooks/useAnuncios';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';

export function AnuncianteLogin() {
  const navigate = useNavigate();
  const { loginAsync, isLoggingIn } = useAnuncios();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginAsync({ email, senha });
      navigate('/anunciante', { replace: true });
    } catch (error) {}
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Área do Anunciante</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoggingIn}>{isLoggingIn ? 'Entrando...' : 'Entrar'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default AnuncianteLogin;
