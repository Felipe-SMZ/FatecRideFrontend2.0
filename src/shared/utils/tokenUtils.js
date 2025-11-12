// shared/utils/tokenUtils.js

/**
 * Verifica se um token JWT está expirado
 * @param {string} token - Token JWT
 * @returns {object} { isExpired: boolean, expiresAt: Date|null, details: string }
 */
export function checkTokenExpiration(token) {
  if (!token) {
    return { 
      isExpired: true, 
      expiresAt: null, 
      details: 'Token não encontrado' 
    };
  }

  try {
    const tokenParts = token.split('.');
    
    if (tokenParts.length !== 3) {
      return { 
        isExpired: true, 
        expiresAt: null, 
        details: 'Token inválido (formato incorreto)' 
      };
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    const exp = payload.exp;
    
    if (!exp) {
      return { 
        isExpired: false, 
        expiresAt: null, 
        details: 'Token sem data de expiração' 
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = new Date(exp * 1000);
    const isExpired = exp < now;
    
    const timeRemaining = exp - now;
    const hoursRemaining = Math.floor(timeRemaining / 3600);
    const minutesRemaining = Math.floor((timeRemaining % 3600) / 60);
    
    let details;
    if (isExpired) {
      const timeExpired = now - exp;
      const hoursExpired = Math.floor(timeExpired / 3600);
      const minutesExpired = Math.floor((timeExpired % 3600) / 60);
      details = `Token expirou há ${hoursExpired}h ${minutesExpired}min`;
    } else {
      details = `Token expira em ${hoursRemaining}h ${minutesRemaining}min`;
    }

    return {
      isExpired,
      expiresAt,
      details,
      payload
    };
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return { 
      isExpired: true, 
      expiresAt: null, 
      details: 'Erro ao decodificar token' 
    };
  }
}

/**
 * Limpa token expirado do localStorage
 */
export function clearExpiredToken() {
  localStorage.removeItem('token');
  console.log('🗑️ Token expirado removido do localStorage');
}

/**
 * Exibe informações do token no console (apenas dev)
 */
export function logTokenInfo(token) {
  const info = checkTokenExpiration(token);
  
  console.group('🔐 Informações do Token');
  console.log('Status:', info.isExpired ? '❌ Expirado' : '✅ Válido');
  console.log('Detalhes:', info.details);
  if (info.expiresAt) {
    console.log('Expira em:', info.expiresAt.toLocaleString('pt-BR'));
  }
  if (info.payload) {
    console.log('Payload:', info.payload);
  }
  console.groupEnd();
  
  return info;
}
