// shared/lib/errorMapper.js
// Mapeia respostas de erro do backend para mensagens amigáveis ao usuário

const defaultMapping = (status, data) => {
  if (status === 400) return { message: data?.message || 'Requisição inválida. Verifique os dados.' };
  if (status === 401) return { message: 'Autenticação necessária. Faça login novamente.' };
  if (status === 403) return { message: 'Você não tem permissão para essa ação.' };
  if (status === 404) return { message: 'Recurso não encontrado.' };
  if (status === 409) return { message: data?.message || 'Conflito: recurso já existe ou estado inválido.' };
  if (status === 422) return { message: data?.message || 'Dados inválidos. Verifique os campos destacados.' };
  if (status === 500) return { message: 'Erro interno no servidor. Tente novamente mais tarde.' };
  return { message: data?.message || 'Erro ao processar requisição. Tente novamente.' };
};

export function mapApiError(error) {
  // error pode ser axios error ou objeto custom
  const status = error?.response?.status || error?.status || null;
  const data = error?.response?.data || error?.data || {};

  // Mapear mensagens específicas do backend para consumíveis
  // Ex: backend pode retornar { code: 'USER_NOT_FOUND', message: '...' }
  if (data && data.code) {
    switch (data.code) {
      case 'INVALID_CREDENTIALS':
      case 'USER_NOT_FOUND':
        return { message: 'Email ou senha inválidos. Verifique suas credenciais.' };
      case 'VEHICLE_NOT_FOUND':
        return { message: 'Veículo não encontrado. Por favor cadastre um veículo.' };
      case 'RIDE_NOT_AVAILABLE':
        return { message: 'A carona não está mais disponível.' };
      default:
        return { message: data.message || defaultMapping(status, data).message };
    }
  }

  return defaultMapping(status, data);
}

export default { mapApiError };
