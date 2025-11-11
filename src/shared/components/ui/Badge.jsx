import { cn } from "./cn";

/**
 * Badge - Componente para exibir labels, tags e status
 * 
 * Usado para destacar informações complementares de forma compacta.
 * Exemplos: status de pagamento, categorias, contadores, roles de usuário.
 * 
 * @example
 * <Badge variant="success">Ativo</Badge>
 * <Badge variant="warning" size="sm">Pendente</Badge>
 */

/**
 * Mapeamento de estilos por variante semântica
 * Cores suaves (100) para fundo mantém legibilidade, cores escuras (800) para texto garantem contraste
 */
const variantStyles = {
  default: "bg-gray-100 text-gray-800 border-gray-200",
  primary: "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  danger: "bg-red-100 text-red-800 border-red-200",
};

/**
 * Tamanhos para diferentes contextos de uso
 * sm: Badges em tabelas densas ou ao lado de textos pequenos
 * md: Uso padrão na maioria dos casos
 * lg: Badges como elementos principais ou em cards grandes
 */
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
        // rounded-full cria o visual característico de badge/pill
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
