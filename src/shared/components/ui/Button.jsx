// shared/components/ui/Button.jsx
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@shared/utils/cn';

const variants = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-md',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-danger hover:bg-red-600 text-white',
    ghost: 'hover:bg-gray-100 text-gray-700',
    outline: 'border-2 border-primary text-primary hover:bg-primary-light'
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
};

export const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    fullWidth = false,
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center gap-2',
                'font-semibold rounded-lg',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                variants[variant],
                sizes[size],
                fullWidth && 'w-full',
                className
            )}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
});