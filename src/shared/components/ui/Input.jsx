// shared/components/ui/Input.jsx
import { forwardRef } from 'react';
import { cn } from '@shared/utils/cn';

// Accessibility & affordance improvements:
// - add aria-invalid when there's an error
// - connect helper/error with aria-describedby

export const Input = forwardRef(({
    label,
    error,
    helperText,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    containerClassName = '',
    required = false,
    ...props
}, ref) => {
    return (
        <div className={cn('w-full', containerClassName)}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                    {required && <span className="text-danger ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {LeftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <LeftIcon className="w-5 h-5" />
                    </div>
                )}

                <input
                    ref={ref}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${props.id || props.name}-error` : helperText ? `${props.id || props.name}-help` : undefined}
                    className={cn(
                        'w-full px-4 py-2.5 rounded-lg border-2',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                        'disabled:bg-gray-100 disabled:cursor-not-allowed',
                        error
                            ? 'border-danger focus:ring-danger'
                            : 'border-gray-300',
                        LeftIcon && 'pl-10',
                        RightIcon && 'pr-10',
                        className
                    )}
                    {...props}
                />

                {RightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <RightIcon className="w-5 h-5" />
                    </div>
                )}
            </div>

            {error && (
                <p id={`${props.id || props.name}-error`} className="mt-1.5 text-sm text-danger">{error}</p>
            )}

            {helperText && !error && (
                <p id={`${props.id || props.name}-help`} className="mt-1.5 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
});