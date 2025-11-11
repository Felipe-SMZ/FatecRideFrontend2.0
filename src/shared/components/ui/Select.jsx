/**
 * Select Component
 * 
 * Componente de dropdown reutilizável que segue os princípios:
 * - Controlled Component (React controla o estado)
 * - Acessibilidade WCAG 2.1 AA
 * - Integração com React Hook Form via forwardRef
 * - Flexibilidade de dados (aceita múltiplos formatos)
 * 
 * @see docs-learning/sprint-1/01-Select.md para guia completo de aprendizado
 */

import { forwardRef } from 'react';
import { cn } from '@shared/utils/cn';
import { ChevronDown } from 'react-icons/fi';

/**
 * Normaliza opções para formato padrão { value, label }
 * Aceita tanto array de objetos quanto array de strings
 */
const normalizeOptions = (options = []) => {
  return options.map(option => {
    // Se já é objeto com value e label, usa direto
    if (typeof option === 'object' && option !== null && 'value' in option) {
      return {
        value: option.value,
        label: option.label || option.name || String(option.value)
      };
    }
    
    // Se é primitivo (string/número), converte para objeto
    return {
      value: option,
      label: String(option)
    };
  });
};

export const Select = forwardRef(({
  // Content
  label,
  options = [],
  placeholder = 'Selecione...',
  helperText,
  
  // State
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  
  // Styling
  className = '',
  containerClassName = '',
  
  // Rest props (name, id, onBlur, etc.)
  ...rest
}, ref) => {
  
  const normalizedOptions = normalizeOptions(options);
  
  // ID único para acessibilidade (conecta select com mensagens)
  const fieldId = rest.id || rest.name;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;

  return (
    <div className={cn('w-full', containerClassName)}>
      
      {/* Label com asterisco se required */}
      {label && (
        <label 
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
          {required && <span className="text-danger ml-1" aria-label="obrigatório">*</span>}
        </label>
      )}

      {/* Container com posição relativa para o ícone absoluto */}
      <div className="relative">
        
        {/* Select Element */}
        <select
          ref={ref}
          value={value}
          onChange={onChange}
          disabled={disabled}
          
          // Acessibilidade: indica se campo está inválido
          aria-invalid={error ? 'true' : 'false'}
          
          // Acessibilidade: conecta com mensagem de erro ou helper text
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          
          // Remove aparência padrão do select (para customizar)
          className={cn(
            // Base: layout e espaçamento
            'w-full px-4 py-2.5 pr-10 rounded-lg border-2',
            'bg-white text-gray-900 appearance-none',
            
            // Transições suaves
            'transition-all duration-200',
            
            // Focus: remove outline padrão e adiciona ring customizado
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            
            // Estado Normal: sem erro e não desabilitado
            !error && !disabled && [
              'border-gray-300',
              'focus:ring-primary focus:border-primary',
              'hover:border-gray-400'
            ],
            
            // Estado Erro: border e ring vermelhos
            error && [
              'border-danger',
              'focus:ring-danger focus:border-danger'
            ],
            
            // Estado Desabilitado: cinza e cursor não permitido
            disabled && [
              'bg-gray-100 cursor-not-allowed opacity-60',
              'text-gray-500'
            ],
            
            // Classes customizadas do usuário
            className
          )}
          
          // Spread de outras props (name, id, onBlur, etc.)
          {...rest}
        >
          
          {/* Opção placeholder (desabilitada para não ser selecionável novamente) */}
          <option value="" disabled>
            {placeholder}
          </option>

          {/* Renderiza opções normalizadas */}
          {normalizedOptions.map((option, index) => (
            <option 
              key={option.value ?? index}  // Usa value como key, fallback para index
              value={option.value}
            >
              {option.label}
            </option>
          ))}
          
        </select>

        {/* Ícone de seta (ChevronDown) */}
        <div 
          className={cn(
            // Posicionamento absoluto centralizado verticalmente
            'absolute right-3 top-1/2 -translate-y-1/2',
            
            // pointer-events-none: cliques passam através do ícone
            'pointer-events-none',
            
            // Transição suave de cor
            'transition-colors duration-200',
            
            // Cor baseada no estado
            disabled ? 'text-gray-400' : 'text-gray-500'
          )}
          aria-hidden="true"  // Esconde do leitor de tela (apenas decorativo)
        >
          <ChevronDown className="w-5 h-5" />
        </div>
        
      </div>

      {/* Mensagem de Erro (prioridade sobre helper text) */}
      {error && (
        <p 
          id={errorId}
          className="mt-1.5 text-sm text-danger flex items-center gap-1"
          role="alert"  // Leitor de tela anuncia imediatamente
        >
          <span aria-hidden="true">⚠️</span>
          {error}
        </p>
      )}

      {/* Helper Text (só mostra se não tiver erro) */}
      {helperText && !error && (
        <p 
          id={helperId}
          className="mt-1.5 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
      
    </div>
  );
});

// Nome do componente para debug no React DevTools
Select.displayName = 'Select';
