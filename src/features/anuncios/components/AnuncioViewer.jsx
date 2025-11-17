import React, { useState } from 'react';
import { useAnuncios } from '../hooks/useAnuncios';
import { Spinner } from '@shared/components/ui/Spinner';
import { Card } from '@shared/components/ui/Card';

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 bg-black/70 text-white text-xs px-3 py-1 rounded-full">{children}</span>
  );
}

export function AnuncioViewer({ className = '' }) {
  const { ad, isLoadingAd, isErrorAd, adError, refetchAd } = useAnuncios();
  const [mediaLoaded, setMediaLoaded] = useState(false);

  const isVideo = ad?.anuncio ? /\.(mp4|webm|ogg)$/i.test(ad.anuncio) : false;
  const isYouTube = ad?.anuncio ? /youtube\.com|youtu\.be/i.test(ad.anuncio) : false;

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
      <div className="absolute top-3 right-3 z-10">
        <Badge>Patrocinado</Badge>
      </div>

      {/* Header: logo + advertiser info */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 border-b bg-white">
        <img src={ad.logo || 'https://via.placeholder.com/64'} alt={ad.nome_fantasia || ad.nome_dono} className="w-12 h-12 rounded-full object-cover border" />
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">{ad.nome_fantasia || ad.nome_dono}</div>
              <div className="text-xs text-gray-500">{ad.razao_social}</div>
            </div>
            <div className="text-right mt-2 sm:mt-0">
              <div className="text-xs text-gray-500">Alcance</div>
              <div className="text-sm font-semibold">{ad.quantidade_alcance ?? ad.quantidadeAlcance ?? '-'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="aspect-video w-full bg-gray-100 relative">
        {!mediaLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/60">
            <div className="w-48 h-6 bg-gray-300 rounded animate-pulse" aria-hidden="true"></div>
          </div>
        )}
        {isVideo ? (
          <video
            src={ad.anuncio}
            controls
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
            onLoadedData={() => setMediaLoaded(true)}
            aria-label={ad.nome_fantasia || 'Vídeo do anúncio'}
          />
        ) : isYouTube ? (
          (function(){
            try {
              const u = new URL(ad.anuncio);
              let embed = ad.anuncio;
              // use privacy-enhanced youtube-nocookie domain to reduce ad-related calls
              const params = 'rel=0&modestbranding=1';
              if (u.hostname.includes('youtu.be')) {
                embed = `https://www.youtube-nocookie.com/embed/${u.pathname.replace(/^\//,'')}?${params}`;
              } else {
                const v = u.searchParams.get('v');
                embed = v ? `https://www.youtube-nocookie.com/embed/${v}?${params}` : ad.anuncio;
              }
              return (
                <iframe
                  title={ad.nome_fantasia || 'anuncio-video'}
                  src={embed}
                  frameBorder="0"
                  onLoad={() => setMediaLoaded(true)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              );
            } catch (e) {
              return (
                <div className="p-4 text-sm text-gray-500">URL de vídeo inválida</div>
              );
            }
          })()
        ) : (
          <img
            src={ad.anuncio}
            alt={ad.nome_fantasia || 'Anúncio'}
            className="w-full h-full object-cover"
            onLoad={() => setMediaLoaded(true)}
            onError={(e) => {
              // previne loop se o placeholder também falhar
              try {
                e.target.onerror = null;
              } catch (err) {}
              e.target.src = 'https://via.placeholder.com/800x400/CCCCCC/666666?text=Anuncio+Indisponivel';
              setMediaLoaded(true);
            }}
          />
        )}
      </div>

      <div className="p-4 bg-white border-t">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700 mb-2">{ad.descricao_anuncio}</p>
            <div className="text-xs text-gray-500">Contato: {ad.contato} · {ad.email}</div>
          </div>
            <div className="flex flex-col gap-2 sm:items-end items-start w-full">
            <button onClick={() => { setMediaLoaded(false); refetchAd(); }} className="px-3 py-2 bg-gray-100 rounded text-sm w-full sm:w-auto" aria-label="Ver outro anúncio">Ver outro</button>
            <a href={`mailto:${ad.email}`} className="px-3 py-2 bg-fatecride-blue text-white rounded text-sm text-center w-full sm:w-auto" aria-label="Entrar em contato por e-mail">Entrar em contato</a>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default AnuncioViewer;

export function AnuncioViewerCompact({ className = '' }) {
  const { ad, isLoadingAd } = useAnuncios();
  if (isLoadingAd || !ad) return null;
  const [loaded, setLoaded] = useState(false);
  const isVideo = /\.(mp4|webm|ogg)$/i.test(ad.anuncio);
  return (
    <div role="region" aria-label={`Anúncio: ${ad.nome_fantasia || ad.nome_dono || 'patrocinado'}`} tabIndex={0} className={`relative rounded-lg overflow-hidden shadow ${className}`}>
      <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded">Anúncio</div>
      {!loaded && <div className="absolute inset-0 flex items-center justify-center bg-gray-200/60"><div className="w-32 h-4 bg-gray-300 rounded animate-pulse" aria-hidden="true"></div></div>}
      {isVideo ? (
        <video src={ad.anuncio} autoPlay muted loop className="w-full h-full object-cover" onLoadedData={() => setLoaded(true)} aria-label={ad.nome_fantasia || 'Vídeo do anúncio compacto'} />
      ) : (
        <img src={ad.anuncio} alt={ad.nome_fantasia || 'Anúncio'} className="w-full h-full object-cover" onLoad={() => setLoaded(true)} onError={(e) => { try { e.target.onerror = null; } catch {} e.target.src = 'https://via.placeholder.com/400x200/CCCCCC/666666?text=Anuncio'; setLoaded(true); }} />
      )}
    </div>
  );
}
