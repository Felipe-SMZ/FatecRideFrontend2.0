// features/chat/components/ChatInput.jsx
import { useState } from 'react';
import { Button } from '@shared/components/ui/Button';
import { FiSend } from 'react-icons/fi';

/**
 * Input para enviar mensagens
 */
export function ChatInput({ onSend, disabled = false }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmed = message.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-fatecride-blue focus:outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          style={{
            minHeight: '48px',
            maxHeight: '120px'
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
      </div>
      <Button
        type="submit"
        disabled={disabled || !message.trim()}
        className="h-12 px-6"
        aria-label="Enviar mensagem"
      >
        <FiSend className="w-5 h-5" />
      </Button>
    </form>
  );
}
