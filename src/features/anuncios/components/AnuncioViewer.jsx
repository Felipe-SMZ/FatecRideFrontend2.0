import React from 'react';

export function AnuncioViewer({ anuncio }) {
  if (!anuncio) return null;
  return (
    <div className="border rounded overflow-hidden">
      <img src={anuncio.anuncio} alt="anuncio" className="w-full object-cover" />
      <div className="p-2">
        <h3 className="font-semibold">{anuncio.nome_fantasia}</h3>
        <p className="text-sm text-gray-600">Alcance: {anuncio.quantidade_alcancados}</p>
      </div>
    </div>
  );
}

export function AnuncioViewerCompact({ anuncio }) {
  if (!anuncio) return <div className="text-sm text-gray-500">Sem anúncio</div>;
  return (
    <div className="flex items-center gap-3">
      <img src={anuncio.anuncio} alt="anuncio" className="w-12 h-12 rounded object-cover" />
      <div>
        <div className="text-sm font-medium">{anuncio.nome_fantasia}</div>
        <div className="text-xs text-gray-500">Alcance: {anuncio.quantidade_alcancados}</div>
      </div>
    </div>
  );
}

export default AnuncioViewer;
// src/features/anuncios/components/AnuncioViewer.jsx

import { useAnuncios } from '../hooks/useAnuncios';
import { Spinner } from '@shared/components/ui/Spinner';
import { Card } from '@shared/components/ui/Card';

export function AnuncioViewer({ className = '', autoRefresh = false, refreshInterval = 60000 }) {
  const { ad, isLoadingAd, isErrorAd, adError, refetchAd } = useAnuncios();

  const isVideo = ad?.anuncio ? /\.(mp4|webm|ogg)$/i.test(ad.anuncio) : false;

  if (isLoadingAd && !ad) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Spinner size="large" />
      </div>
    );
  }

  if (isErrorAd) {
    return (
      <Card className={`p-4 bg-red-50 border-red-200 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 text-sm mb-2">Erro ao carregar anúncio: {adError?.message || 'Erro desconhecido'}</p>
          <button onClick={() => refetchAd()} className="text-blue-600 hover:text-blue-800 text-sm font-medium underline">Tentar novamente</button>
        </div>
      </Card>
    );
  }

  if (!ad) {
    return (
      <Card className={`p-8 text-center text-gray-500 ${className}`}>
        <p className="text-sm">Nenhum anúncio disponível no momento</p>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden shadow-lg ${className}`}>
      <div className="absolute top-3 right-3 z-10 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">Anúncio</div>
      <div className="aspect-video w-full bg-gray-100">
        {isVideo ? (
          <video src={ad.anuncio} controls autoPlay muted loop className="w-full h-full object-cover" />
        ) : (
          <img src={ad.anuncio} alt="Anúncio" className="w-full h-full object-cover" onError={(e)=>{e.target.src='https://via.placeholder.com/800x400/CCCCCC/666666?text=Anuncio+Indisponivel'}} />
        )}
      </div>
      <div className="p-3 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Patrocinado</span>
          <button onClick={() => refetchAd()} className="hover:text-gray-700 underline">Ver outro anúncio</button>
        </div>
      </div>
    </Card>
  );
}

export function AnuncioViewerCompact({ className = '' }) {
  const { ad, isLoadingAd } = useAnuncios();
  if (isLoadingAd || !ad) return null;
  const isVideo = /\.(mp4|webm|ogg)$/i.test(ad.anuncio);
  return (
    <div className={`relative rounded-lg overflow-hidden shadow ${className}`}>
      <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded">Anúncio</div>
      {isVideo ? (
        <video src={ad.anuncio} autoPlay muted loop className="w-full h-full object-cover" />
      ) : (
        <img src={ad.anuncio} alt="Anúncio" className="w-full h-full object-cover" />
      )}
    </div>
  );
}
