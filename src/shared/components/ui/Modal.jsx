import { useEffect, useRef } from "react";
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

  // Focus trap: garante que o foco permaneça dentro do modal enquanto aberto
  const modalRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const el = modalRef.current;
    if (!el) return;

    const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(el.querySelectorAll(focusableSelector)).filter((f) => f.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focar o primeiro elemento disponível ou no próprio container
    (first || el).focus();

    const handleKey = (e) => {
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    el.addEventListener('keydown', handleKey);
    return () => el.removeEventListener('keydown', handleKey);
  }, [isOpen]);

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
        ref={modalRef}
        tabIndex={-1}
      >
        {/* Header com título e botão de fechar */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
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
