// shared/components/ui/EmptyState.jsx
import { FiFileText } from 'react-icons/fi';

export function EmptyState({
    icon: Icon = FiFileText,
    title = 'Nenhum item encontrado',
    description,
    action
}) {
    return (
        <div className="text-center py-12">
            <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-gray-500 mb-4">{description}</p>
            )}
            {action}
        </div>
    );
}