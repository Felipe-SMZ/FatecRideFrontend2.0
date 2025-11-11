// shared/components/ui/Skeleton.jsx
import { cn } from '@shared/utils/cn';

export function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-lg bg-gray-200',
                className
            )}
            {...props}
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-card">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6" />
        </div>
    );
}