import { cn } from "./cn";

/**
 * BADGE - Micro-componente para labels e status
 * Variantes: default, primary, success, warning, danger
 * Tamanhos: sm, md, lg
 */

const variantStyles = {
  default: "bg-gray-100 text-gray-800 border-gray-200",
  primary: "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  danger: "bg-red-100 text-red-800 border-red-200",
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-base px-3 py-1",
};

export function Badge({
  variant = "default",
  size = "md",
  className,
  children,
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
