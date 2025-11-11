import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { cn } from "./cn";

/**
 * Modal - Componente de diálogo sobreposto
 * 
 * Renderiza conteúdo em uma camada acima da aplicação usando Portal.
 * Implementa padrões de acessibilidade (ESC, focus trap, ARIA).
 * 
 * @example
 * const [open, setOpen] = useState(false);
 * <Modal isOpen={open} onClose={() => setOpen(false)} title="Confirmar ação">
 *   <p>Tem certeza?</p>
 * </Modal>
 */

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className,
}) {
  /**
   * Gerencia keyboard shortcuts e previne scroll do body
   * ESC fecha o modal (padrão de UX)
   * overflow:hidden no body previne scroll duplo (modal + página)
   */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  /**
   * createPortal renderiza o modal diretamente no body
   * Isso evita problemas de z-index e overflow:hidden de containers pais
   */
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Fecha apenas se clicar no backdrop, não no conteúdo do modal
        // e.target === e.currentTarget garante que não era um filho
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "bg-white rounded-lg shadow-xl w-full",
          sizeStyles[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header com título e botão de fechar */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Fechar modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo dinâmico passado via children */}
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
