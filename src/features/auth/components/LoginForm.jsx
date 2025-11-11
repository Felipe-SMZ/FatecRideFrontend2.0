// features/auth/components/LoginForm.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@shared/utils/validators';
import { useLogin } from '../hooks/useAuth';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';
import { Mail, Lock } from 'lucide-react';

export function LoginForm() {
    const { mutate: login, isLoading } = useLogin();

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
        login(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Email"
                type="email"
                leftIcon={Mail}
                {...register('email')}
                error={errors.email?.message}
                placeholder="seu@email.com"
            />

            <Input
                label="Senha"
                type="password"
                leftIcon={Lock}
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
        </form>
    );
}