import React, { useState } from 'react';
import { useAnuncios } from '../hooks/useAnuncios';
import { Card } from '@shared/components/ui/Card';
import { getPlaceholderDataUri } from '../utils/placeholder';

export function AnuncioDebug() {
  const { ad, isLoadingAd, isErrorAd, adError } = useAnuncios();
  const [testUrl, setTestUrl] = useState('');

  const previewUrl = testUrl || ad?.anuncio;

  const toYouTubeEmbed = (url) => {
    if (!url) return null;
    try {
      // Handle typical YouTube watch urls and youtu.be links
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        return v ? `https://www.youtube.com/embed/${v}` : null;
      }
      if (u.hostname === 'youtu.be') {
        const id = u.pathname.replace(/^\//, '');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

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
              {previewUrl ? (
                // Prefer imagem -> vídeo direto -> youtube embed -> fallback
                previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto" />
                ) : previewUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={previewUrl} controls className="max-h-40 mx-auto">Vídeo</video>
                ) : toYouTubeEmbed(previewUrl) ? (
                  <div className="w-full max-h-60 overflow-hidden">
                    <iframe
                      title="YouTube Anúncio"
                      src={toYouTubeEmbed(previewUrl)}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-56"
                    />
                  </div>
                ) : (
                  <div className="text-red-600">⚠️ URL não é imagem, vídeo direto ou link YouTube:<code className="block mt-1 text-xs">{previewUrl}</code></div>
                )
              ) : (
                <div className="text-red-600">❌ Campo "anuncio" está vazio</div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setTestUrl('https://www.youtube.com/watch?v=qcUTYakn1kg')}
                className="px-3 py-1 bg-fatecride-blue text-white rounded"
              >Usar vídeo de teste</button>
              <button
                onClick={() => setTestUrl(getPlaceholderDataUri(800, 400, 'Anúncio Imagem'))}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >Usar imagem de teste</button>
              <button onClick={() => setTestUrl('')} className="px-3 py-1 bg-gray-200 rounded">Usar original</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default AnuncioDebug;
