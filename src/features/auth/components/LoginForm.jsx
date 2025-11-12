// features/auth/components/LoginForm.jsx
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@shared/utils/validators';
import { useLogin } from '../hooks/useAuth';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';
import { FiMail, FiLock } from 'react-icons/fi';

export function LoginForm() {
    const { mutate: login, isLoading } = useLogin();
    const [formError, setFormError] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            senha: ''
        }
    });

    const onSubmit = (data) => {
        setFormError(null);
        login(data, {
            onError: (err) => {
                const msg = err?.message || 'Email ou senha inválidos';
                setFormError(msg);
            },
            onSuccess: () => setFormError(null)
        });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Email"
                type="email"
                leftIcon={FiMail}
                {...register('email')}
                error={errors.email?.message}
                placeholder="seu@email.com"
            />

            <Input
                label="Senha"
                type="password"
                leftIcon={FiLock}
                {...register('senha')}
                error={errors.senha?.message}
                placeholder="••••••••"
            />

            <Button
                type="submit"
                loading={isLoading}
                fullWidth
            >
                Entrar
            </Button>

            {formError && (
                <p role="alert" aria-live="polite" className="mt-2 text-sm text-red-600 text-center">{formError}</p>
            )}
        </form>
    );
}