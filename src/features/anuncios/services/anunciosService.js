import anunciosApi from './anunciosApi';

export async function loginAnunciante(credentials) {
  const res = await anunciosApi.post('/login', credentials);
  const token = res.data?.data;
  if (token) localStorage.setItem('anuncios_token', token);
  return token;
}

export async function criarAnunciante(payload) {
  const res = await anunciosApi.post('/', payload);
  return res.data;
}

export async function divulgarAnuncio() {
  const res = await anunciosApi.get('/divulgar');
  const payload = res.data;
  // backend may return either { data: [ ... ] } or an array directly
  if (Array.isArray(payload)) return payload[0] ?? null;
  if (payload && Array.isArray(payload.data)) return payload.data[0] ?? null;
  return null;
}

export async function atualizarAnunciante(payload) {
  const res = await anunciosApi.put('/', payload);
  return res.data;
}

export async function deletarAnunciante() {
  const res = await anunciosApi.delete('/');
  localStorage.removeItem('anuncios_token');
  return res.data;
}

export function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (e) {
    return null;
  }
}

export default {
  loginAnunciante,
  criarAnunciante,
  divulgarAnuncio,
  atualizarAnunciante,
  deletarAnunciante,
  decodeToken,
};
