// shared/components/ui/Button.jsx
import { forwardRef } from 'react';
import { cn } from './cn';

const variants = {
    primary: 'bg-red-600 hover:bg-red-700 text-white shadow-md',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-gray-100 text-gray-700',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
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
    type = 'button',
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center gap-2',
                'font-semibold rounded-lg',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
                variants[variant],
                sizes[size],
                fullWidth && 'w-full',
                className
            )}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

Button.displayName = 'Button';