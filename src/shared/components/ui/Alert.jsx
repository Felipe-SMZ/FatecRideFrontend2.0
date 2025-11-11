import { useState } from "react";
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiX } from "react-icons/fi";
import { cn } from "./cn";

/**
 * ALERT COMPONENT - Componente de feedback visual para mensagens importantes
 * 
 * 📖 CONCEITOS APLICADOS:
 * 1. Variantes semânticas (info, success, warning, danger)
 * 2. Props opcionais com valores padrão
 * 3. Estado local para controlar visibilidade
 * 4. Renderização condicional (title, dismissible)
 * 5. Mapeamento de ícones por variante
 * 6. ARIA roles para acessibilidade
 * 
 * 📚 Documentação completa: docs-learning/sprint-1/02-Alert.md
 */

/**
 * MAPEAMENTO DE ÍCONES
 * 
 * Cada variante tem um ícone específico do react-icons/fi:
 * - info → FiInfo (círculo com "i")
 * - success → FiCheckCircle (check verde)
 * - warning → FiAlertTriangle (triângulo de alerta)
 * - danger → FiAlertCircle (círculo de erro)
 * 
 * Por que mapear? Evita switch/case e permite acesso dinâmico via iconMap[variant]
 */
const iconMap = {
  info: FiInfo,
  success: FiCheckCircle,
  warning: FiAlertTriangle,
  danger: FiAlertCircle,
};

/**
 * ESTILOS POR VARIANTE
 * 
 * Cada variante usa cores semânticas do Tailwind:
 * - bg-{color}-50: Fundo claro suave
 * - border-{color}-200: Borda lateral esquerda (border-l-4)
 * - text-{color}-800: Texto escuro para contraste
 * 
 * Por que cores semânticas? Usuários associam automaticamente:
 * - Azul = informação
 * - Verde = sucesso
 * - Amarelo = atenção
 * - Vermelho = perigo
 */
const variantStyles = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  danger: "bg-red-50 border-red-200 text-red-800",
};

/**
 * ESTILOS DE ÍCONE POR VARIANTE
 * 
 * Ícones recebem cor mais escura para destaque:
 * - text-{color}-600: Cor intermediária entre fundo e texto
 * 
 * Por que separar? Ícone precisa de cor diferente do texto para hierarquia visual
 */
const iconStyles = {
  info: "text-blue-600",
  success: "text-green-600",
  warning: "text-yellow-600",
  danger: "text-red-600",
};

/**
 * ALERT COMPONENT
 * 
 * @param {Object} props
 * @param {"info" | "success" | "warning" | "danger"} props.variant - Tipo do alerta (padrão: "info")
 * @param {string} [props.title] - Título opcional em negrito acima do conteúdo
 * @param {boolean} [props.dismissible=false] - Se true, exibe botão X para fechar
 * @param {Function} [props.onClose] - Callback executado quando alert é fechado
 * @param {React.ReactNode} props.children - Conteúdo do alerta
 * @param {string} [props.className] - Classes CSS adicionais
 * 
 * @example
 * // Uso básico
 * <Alert variant="info">Sua sessão expira em 5 minutos</Alert>
 * 
 * @example
 * // Com título e dispensável
 * <Alert 
 *   variant="success" 
 *   title="Sucesso!" 
 *   dismissible 
 *   onClose={() => console.log("Fechado")}
 * >
 *   Cadastro realizado com sucesso
 * </Alert>
 */
export function Alert({
  variant = "info",
  title,
  dismissible = false,
  onClose,
  children,
  className,
}) {
  /**
   * ESTADO LOCAL: Controla se alert está visível
   * 
   * Por que useState aqui? Alert pode se auto-gerenciar sem precisar de estado externo.
   * Quando usuário clica no X, setVisible(false) oculta o componente.
   */
  const [visible, setVisible] = useState(true);

  /**
   * EARLY RETURN: Se não está visível, não renderiza nada
   * 
   * Por que fazer isso? Economiza processamento e DOM - componente simplesmente desaparece.
   * Alternativa seria usar CSS (opacity, display:none), mas null é mais performático.
   */
  if (!visible) return null;

  /**
   * SELEÇÃO DINÂMICA DE ÍCONE
   * 
   * iconMap[variant] retorna o componente de ícone correto.
   * Exemplo: variant="success" → Icon = FiCheckCircle
   */
  const Icon = iconMap[variant];

  /**
   * HANDLER DE FECHAMENTO
   * 
   * 1. setVisible(false) → Oculta o alert
   * 2. onClose?.() → Chama callback SE existir (optional chaining)
   * 
   * Por que optional chaining? onClose é opcional, pode ser undefined.
   * onClose?.() só executa se onClose for função, evitando erro.
   */
  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    /**
     * CONTAINER PRINCIPAL
     * 
     * Classes aplicadas:
     * - border-l-4: Borda lateral esquerda de 4px (indicador visual)
     * - rounded-lg: Bordas arredondadas
     * - p-4: Padding interno de 1rem
     * - flex items-start gap-3: Layout flexbox com ícone à esquerda
     * - variantStyles[variant]: bg, border e text colors dinâmicas
     * 
     * ARIA attributes:
     * - role="alert": Informa leitores de tela que é um alerta importante
     * - aria-live="polite": Anuncia mudanças quando usuário estiver livre
     */
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "border-l-4 rounded-lg p-4 flex items-start gap-3",
        variantStyles[variant],
        className
      )}
    >
      {/* 
        ÍCONE: Renderização condicional
        
        Se Icon existir no mapeamento, renderiza com:
        - w-5 h-5: Tamanho fixo 20x20px
        - flex-shrink-0: Não encolhe quando texto é longo
        - iconStyles[variant]: Cor específica da variante
      */}
      {Icon && (
        <Icon className={cn("w-5 h-5 flex-shrink-0", iconStyles[variant])} />
      )}

      {/* 
        CONTEÚDO: flex-1 para ocupar todo espaço disponível
      */}
      <div className="flex-1">
        {/* 
          TÍTULO OPCIONAL: Renderização condicional
          
          {title && ...} só renderiza se title foi passado como prop.
          font-semibold: Negrito para destaque
          mb-1: Margem inferior pequena para separar do conteúdo
        */}
        {title && <div className="font-semibold mb-1">{title}</div>}

        {/* 
          CONTEÚDO PRINCIPAL
          
          text-sm: Texto levemente menor que o padrão
          {children}: Renderiza qualquer coisa passada entre <Alert>...</Alert>
        */}
        <div className="text-sm">{children}</div>
      </div>

      {/* 
        BOTÃO DE FECHAR: Renderização condicional
        
        {dismissible && ...} só renderiza se dismissible=true
        
        Button attributes:
        - onClick={handleClose}: Executa lógica de fechamento
        - className: Cores dinâmicas + hover + tamanho do ícone
        - aria-label: Texto para leitores de tela (não há texto visível)
        
        Por que -mr-2 -mt-1? Ajusta posição para alinhar no canto superior direito
        Por que hover:opacity-70? Feedback visual de interação
      */}
      {dismissible && (
        <button
          onClick={handleClose}
          className={cn(
            "flex-shrink-0 p-1 rounded hover:opacity-70 transition-opacity -mr-2 -mt-1",
            iconStyles[variant]
          )}
          aria-label="Fechar alerta"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * RESUMO DOS CONCEITOS:
 * 
 * ✅ Variantes semânticas: info/success/warning/danger comunicam significado
 * ✅ Props opcionais: title, dismissible, onClose, className
 * ✅ Estado local: useState controla visibilidade interna
 * ✅ Early return: if (!visible) return null otimiza renderização
 * ✅ Mapeamento de objetos: iconMap e variantStyles evitam switch/case
 * ✅ Renderização condicional: {title && ...}, {dismissible && ...}
 * ✅ Optional chaining: onClose?.() evita erros com callbacks opcionais
 * ✅ ARIA roles: role="alert" e aria-live para acessibilidade
 * 
 * 📚 Para mais detalhes, consulte: docs-learning/sprint-1/02-Alert.md
 */
