// shared/components/ui/Spinner.jsx
import { cn } from '@shared/utils/cn';

export const Spinner = ({ size = 'md', fullScreen = false }) => {
    const sizes = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-4',
        lg: 'w-12 h-12 border-4'
    };

    const spinner = (
        <div className={cn(
            'animate-spin rounded-full border-gray-200 border-t-primary',
            sizes[size]
        )} />
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
};