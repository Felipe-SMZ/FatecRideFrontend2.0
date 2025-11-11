import { cn } from "../ui/cn";

/**
 * PageContainer - Wrapper consistente para conteúdo de páginas
 * 
 * Padroniza largura máxima, espaçamento e estrutura de título/descrição.
 * Usado em todas as páginas para manter layout uniforme.
 * 
 * @example
 * <PageContainer title="Meus Veículos" description="Gerencie seus veículos cadastrados">
 *   <VehiclesList />
 * </PageContainer>
 */

export function PageContainer({
  title,
  description,
  children,
  className,
  maxWidth = "7xl",
}) {
  /**
   * Mapeamento de larguras máximas
   * 7xl é padrão (1280px) - bom para dashboards e listagens
   * 4xl para formulários e conteúdo focado
   */
  const maxWidthStyles = {
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div className={cn("container mx-auto px-4 py-6", maxWidthStyles[maxWidth], className)}>
      {/* Seção de título/descrição - renderiza apenas se fornecido */}
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
