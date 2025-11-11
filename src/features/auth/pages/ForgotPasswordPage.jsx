import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';
import { Alert } from '@shared/components/ui/Alert';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

/**
 * ForgotPasswordPage - Página de recuperação de senha
 * 
 * Funcionalidades:
 * - Validação de email com Zod
 * - Feedback visual de sucesso/erro
 * - Navegação de volta para login
 * - UI responsiva e acessível
 */

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
});

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      // TODO: Implementar chamada real à API
      // Por enquanto, simulação de sucesso
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSuccess(true);
      setLoading(false);

      // Redireciona para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setError(err.message || 'Erro ao enviar email de recuperação');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Botão voltar */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <FiArrowLeft />
          <span>Voltar para login</span>
        </button>

        <Card className="p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FiMail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Recuperar Senha
            </h1>
            <p className="text-gray-600">
              Digite seu email e enviaremos instruções para redefinir sua senha
            </p>
          </div>

          {success ? (
            <Alert variant="success" className="mb-6">
              <div className="flex items-start gap-3">
                <FiCheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Email enviado com sucesso!</p>
                  <p className="text-sm">
                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                  </p>
                </div>
              </div>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="danger">
                  {error}
                </Alert>
              )}

              <Input
                label="Email"
                type="email"
                leftIcon={FiMail}
                placeholder="seu@email.com"
                error={errors.email?.message}
                {...register('email')}
                disabled={loading}
              />

              <Button
                type="submit"
                fullWidth
                loading={loading}
                className="h-12 text-lg font-semibold"
              >
                Enviar link de recuperação
              </Button>

              <div className="text-center text-sm text-gray-600">
                Lembrou sua senha?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Fazer login
                </button>
              </div>
            </form>
          )}
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Não recebeu o email?{' '}
            <button
              onClick={() => setSuccess(false)}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Tentar novamente
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
