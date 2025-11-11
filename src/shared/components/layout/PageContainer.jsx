import { cn } from "../ui/cn";

/**
 * PAGE CONTAINER - Wrapper consistente para páginas
 * Max-width, padding, título opcional
 */

export function PageContainer({
  title,
  description,
  children,
  className,
  maxWidth = "7xl",
}) {
  const maxWidthStyles = {
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div className={cn("container mx-auto px-4 py-6", maxWidthStyles[maxWidth], className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          )}
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
