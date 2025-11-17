import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SimpleChatModal from '../components/SimpleChatModal';
import { ridesService } from '@features/rides/services/ridesService';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useChatStore } from '../stores/chatStore';

export function ChatPage() {
  const { id_solicitacao } = useParams();
  const navigate = useNavigate();
  const { conversations } = useChatStore();

  useEffect(() => {
    // Se não existir conversa, redireciona de volta para conversas
    const exists = conversations.some(c => String(c.id_solicitacao) === String(id_solicitacao));
    if (!exists) {
      // Ainda permitimos abrir o chat mesmo sem conversa existente (padrão)
      // navegar de volta pode ser surpreendente, então apenas logamos
      console.log('ChatPage: conversa não encontrada no store, abrindo modal vazio');
    }
  }, [conversations, id_solicitacao]);

  // Para exibir o modal inline, precisamos do receiverId e nome do outro usuário.
  // Aqui usamos placeholders: o SimpleChatModal pode carregar histórico via REST usando receiverId.
  const conversation = conversations.find(c => String(c.id_solicitacao) === String(id_solicitacao));
  // Primeiro tenta usar dados da conversa no store; se ausente, tentar recuperar do localStorage (ridesService)
  const { user } = useAuthStore();
  const currentUserId = user?.id_usuario ?? user?.id ?? user?.userId ?? null;
  const receiverId = conversation?.otherUserId ?? ridesService.getSolicitacaoMapping(id_solicitacao, currentUserId) ?? null; // pode ser undefined
  const otherUserName = conversation?.otherUserName ?? `Solicitação ${id_solicitacao}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Chat - Solicitação #{id_solicitacao}</h1>
        <div className="bg-white rounded shadow p-4">
          <p className="text-sm text-gray-600 mb-4">Abaixo está a conversa relacionada à solicitação.</p>
          <SimpleChatModal
            requestId={id_solicitacao}
            otherUserName={otherUserName}
            receiverId={receiverId}
            onClose={() => navigate('/mensagens')}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
