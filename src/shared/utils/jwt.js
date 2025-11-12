// shared/utils/jwt.js

/**
 * Decodifica um token JWT sem verificar a assinatura
 * @param {string} token - Token JWT
 * @returns {object} - Payload decodificado
 */
export function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    return null;
  }
}

/**
 * Verifica se o token JWT expirou
 * @param {string} token - Token JWT
 * @returns {boolean} - true se expirou, false caso contrário
 */
export function isTokenExpired(token) {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true; // Se não tem exp, considerar expirado
  }
  
  const now = Math.floor(Date.now() / 1000); // timestamp em segundos
  return payload.exp < now;
}

/**
 * Verifica informações do token e loga no console
 * @param {string} token - Token JWT
 */
export function debugToken(token) {
  if (!token) {
    console.warn('🔴 Token ausente');
    return;
  }

  const payload = decodeJWT(token);
  if (!payload) {
    console.error('🔴 Token inválido - não foi possível decodificar');
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = payload.exp;
  const iat = payload.iat;
  
  console.log('🔐 === DEBUG TOKEN JWT ===');
  console.log('📋 Subject (email):', payload.sub);
  console.log('🏷️ Claims:', Object.keys(payload).filter(k => !['sub', 'iat', 'exp'].includes(k)));
  
  if (payload.tipo) console.log('👤 Tipo:', payload.tipo);
  if (payload.authorities) console.log('🔑 Authorities:', payload.authorities);
  if (payload.roles) console.log('🔑 Roles:', payload.roles);
  
  if (iat) {
    const issuedDate = new Date(iat * 1000);
    console.log('📅 Emitido em:', issuedDate.toLocaleString('pt-BR'));
  }
  
  if (exp) {
    const expiryDate = new Date(exp * 1000);
    const timeLeft = exp - now;
    const hoursLeft = Math.floor(timeLeft / 3600);
    const minutesLeft = Math.floor((timeLeft % 3600) / 60);
    
    console.log('⏰ Expira em:', expiryDate.toLocaleString('pt-BR'));
    
    if (timeLeft > 0) {
      console.log(`✅ Token válido - ${hoursLeft}h ${minutesLeft}min restantes`);
    } else {
      console.log(`🔴 Token EXPIRADO há ${Math.abs(hoursLeft)}h ${Math.abs(minutesLeft)}min`);
    }
  }
  
  console.log('🔐 === FIM DEBUG TOKEN ===');
  
  return {
    valid: !isTokenExpired(token),
    payload,
    expiresIn: exp ? exp - now : null
  };
}
