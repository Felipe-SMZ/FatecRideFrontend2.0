// shared/components/ui/Card.jsx
import { cn } from '@shared/utils/cn';

export const Card = ({
    children,
    hover = false,
    className = '',
    ...props
}) => {
    return (
        <div
            className={cn(
                'bg-white rounded-xl p-6 shadow-card',
                hover && 'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};