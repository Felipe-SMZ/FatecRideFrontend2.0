import { useState } from 'react';
import { useAnuncios, useAnunciosAuth } from '../hooks/useAnuncios';
import { useAnunciosStore } from '../stores/anunciosStore';
import { decodeToken } from '../services/anunciosService';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';

export function AnuncianteDashboard() {
  const { ad, refetchAd, isLoadingAd } = useAnuncios();
  const { isAuthenticated } = useAnunciosStore();
  const { logout } = useAnunciosAuth();

  const token = useAnunciosStore.getState().token;
  const decoded = token ? decodeToken(token) : null;

  const [nomeFantasia, setNomeFantasia] = useState('');

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Painel do Anunciante</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{isAuthenticated ? 'Autenticado' : 'Não autenticado'}</span>
          <Button onClick={() => logout()}>Sair</Button>
        </div>
      </div>
      <Card className="p-4">
        <h2 className="font-medium mb-2">Dados do token</h2>
        <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(decoded, null, 2)}</pre>
      </Card>
      <Card className="p-4">
        <h2 className="font-medium mb-2">Anúncio público (divulgar)</h2>
        {isLoadingAd ? (
          <div>Carregando anúncio...</div>
        ) : ad ? (
          <div className="space-y-2">
            <img src={ad.anuncio} alt="anuncio" className="w-full max-h-48 object-cover rounded" />
            <div className="flex justify-end"><Button onClick={() => refetchAd()}>Ver outro</Button></div>
          </div>
        ) : (
          <div>Nenhum anúncio disponível.</div>
        )}
      </Card>
      <Card className="p-4">
        <h2 className="font-medium mb-2">Editar anúncio (envie todos os campos exigidos)</h2>
        <form className="space-y-3">
          <Input placeholder="Nome fantasia" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
          <div className="flex justify-end"><Button type="button">Atualizar</Button></div>
        </form>
        <p className="text-xs text-gray-500 mt-2">Observação: o backend atual exige envio de todos os campos no PUT. Preencha o formulário completo para atualizar.</p>
      </Card>
    </div>
  );
}

export default AnuncianteDashboard;
