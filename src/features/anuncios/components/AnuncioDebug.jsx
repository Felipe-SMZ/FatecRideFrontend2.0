import React from 'react';
import { useAnuncios } from '../hooks/useAnuncios';

export function AnuncioDebug() {
  const { ad, isLoadingAd, refetchAd } = useAnuncios();

  return (
    <div className="p-3 border rounded">
      <h3 className="font-medium mb-2">Debug Anúncio</h3>
      {isLoadingAd ? (
        <div>Carregando...</div>
      ) : (
        <div className="space-y-2">
          {ad ? (
            <div>
              <img src={ad.anuncio} className="w-48 h-32 object-cover rounded" alt="anuncio" />
              <pre className="text-xs mt-2 bg-gray-50 p-2 rounded">{JSON.stringify(ad, null, 2)}</pre>
            </div>
          ) : (
            <div>Nenhum anúncio disponível</div>
          )}
          <div className="flex gap-2">
            <button className="btn" onClick={() => refetchAd()}>Refetch</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnuncioDebug;
// src/features/anuncios/components/AnuncioDebug.jsx

import { useAnuncios } from '../hooks/useAnuncios';
import { Card } from '@shared/components/ui/Card';

export function AnuncioDebug() {
  const { ad, isLoadingAd, isErrorAd, adError } = useAnuncios();

  return (
    <Card className="p-6 bg-yellow-50 border-2 border-yellow-400">
      <h3 className="text-lg font-bold mb-4 text-yellow-800">🐛 DEBUG MODE - Anúncios</h3>
      <div className="space-y-3 text-sm">
        <div><strong>Loading:</strong> {isLoadingAd ? '✅ Sim' : '❌ Não'}</div>
        <div><strong>Erro:</strong> {isErrorAd ? '❌ Sim' : '✅ Não'}</div>
        {adError && (<div className="bg-red-100 p-2 rounded text-red-700"><strong>Mensagem de Erro:</strong> {adError.message}</div>)}
        <div className="border-t pt-3">
          <strong>Dados recebidos:</strong>
          <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">{JSON.stringify(ad, null, 2) || 'Nenhum dado'}</pre>
        </div>
        <div className="border-t pt-3">
          <strong>API URL:</strong>
          <code className="block mt-1 p-2 bg-white rounded text-xs">{import.meta.env.VITE_ADS_API_URL || 'NÃO CONFIGURADO'}</code>
        </div>
        <div className="border-t pt-3">
          <strong>Teste manual:</strong>
          <p className="text-xs text-gray-600 mb-2">Abra em nova aba e veja se retorna JSON:</p>
          <a href="http://localhost:8081/anuncio/divulgar" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">http://localhost:8081/anuncio/divulgar</a>
        </div>
        {ad && (
          <div className="border-t pt-3">
            <strong>Preview do Anúncio:</strong>
            <div className="mt-2 border rounded p-2 bg-white">
              {ad.anuncio ? (
                ad.anuncio.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={ad.anuncio} alt="Preview" className="max-h-40 mx-auto" />
                ) : ad.anuncio.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={ad.anuncio} controls className="max-h-40 mx-auto">Vídeo</video>
                ) : (
                  <div className="text-red-600">⚠️ URL não é imagem nem vídeo válido:<code className="block mt-1 text-xs">{ad.anuncio}</code></div>
                )
              ) : (
                <div className="text-red-600">❌ Campo "anuncio" está vazio</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
