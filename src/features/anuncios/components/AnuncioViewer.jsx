import React, { useState } from 'react';
import { useAnuncios } from '../hooks/useAnuncios';
import { Spinner } from '@shared/components/ui/Spinner';
import { Card } from '@shared/components/ui/Card';
import { getPlaceholderDataUri } from '../utils/placeholder';
import { FaWhatsapp } from 'react-icons/fa';
import { FiPlus } from 'react-icons/fi';

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
    <Card className={`relative overflow-hidden shadow-lg bg-gradient-to-br from-white to-blue-50 ${className}`}>
      <div className="absolute top-3 right-3 z-10">
        <Badge>Patrocinado</Badge>
      </div>
      {/* Header: only logo (minimal) */}
      <div className="flex items-center gap-3 p-3 border-b bg-transparent">
        <img src={ad.logo || getPlaceholderDataUri(64, 64, 'Logo')} alt={ad.nome_fantasia || 'Logo'} className="w-12 h-12 rounded-full object-cover border" />
        <div className="flex-1">
          {ad.nome_fantasia && <div className="text-sm font-semibold text-gray-800">{ad.nome_fantasia}</div>}
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
            playsInline
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
              // autoplay=1&mute=1 para permitir autoplay em navegadores modernos (muted)
              const params = 'rel=0&modestbranding=1&autoplay=1&mute=1';
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
                e.target.src = getPlaceholderDataUri(800, 400, 'Anúncio Indisponível');
                setMediaLoaded(true);
              }}
            />
        )}
      </div>

      <div className="p-4 bg-transparent border-t">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-800">{ad.descricao_anuncio}</p>
          <div className="text-xs text-gray-500">
            <div className="flex flex-col gap-2">
              {ad.contato && (
                (function(){
                  const raw = String(ad.contato || '');
                  const digits = raw.replace(/\D/g,'');
                  const wa = digits ? `https://wa.me/${digits}` : null;
                  return (
                    <a href={wa || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-700 hover:text-green-600">
                      <FaWhatsapp className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{raw}</span>
                    </a>
                  );
                })()
              )}

              {ad.email && (
                <a href={`mailto:${ad.email}`} className="inline-flex items-center gap-2 text-gray-700 hover:text-fatecride-blue">
                  <FiPlus className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">{ad.email}</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-2 justify-center">
            <button onClick={() => { setMediaLoaded(false); refetchAd(); }} className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm hover:shadow" aria-label="Ver outro anúncio">Ver outro</button>
            <a href={`mailto:${ad.email}`} className="px-4 py-2 bg-fatecride-blue text-white rounded-md text-sm shadow-md hover:opacity-95" aria-label="Entrar em contato por e-mail">Entrar em contato</a>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default AnuncioViewer;

export function AnuncioViewerCompact({ className = '' }) {
  const { ad, isLoadingAd, refetchAd } = useAnuncios();
  const [loaded, setLoaded] = useState(false);
  if (isLoadingAd || !ad) return null;
  const isVideo = /\.(mp4|webm|ogg)$/i.test(ad.anuncio);
  const isYouTube = ad?.anuncio ? /youtube\.com|youtu\.be/i.test(ad.anuncio) : false;

  return (
    <Card className={`relative rounded-lg overflow-hidden shadow ${className}`}>
      <div className="absolute top-3 right-3 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded">Patrocinado</div>

      <div className="flex items-center gap-3 p-3">
        <img src={ad.logo || getPlaceholderDataUri(48, 48, 'Logo')} alt={ad.nome_fantasia || 'Logo'} className="w-10 h-10 rounded-full object-cover border" />
        <div className="flex-1">
          {ad.nome_fantasia && <div className="text-sm font-semibold text-gray-800 truncate">{ad.nome_fantasia}</div>}
        </div>
      </div>

      <div className="aspect-video w-full bg-gray-100 relative">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200/60">
            <div className="w-24 h-4 bg-gray-300 rounded animate-pulse" aria-hidden="true"></div>
          </div>
        )}
        {isVideo ? (
          <video src={ad.anuncio} autoPlay muted playsInline loop className="w-full h-full object-cover" onLoadedData={() => setLoaded(true)} aria-label={ad.nome_fantasia || 'Vídeo do anúncio compacto'} />
        ) : isYouTube ? (
          (function(){
            try {
              const u = new URL(ad.anuncio);
              let embed = ad.anuncio;
              const params = 'rel=0&modestbranding=1&autoplay=1&mute=1';
              if (u.hostname.includes('youtu.be')) {
                embed = `https://www.youtube-nocookie.com/embed/${u.pathname.replace(/^\//,'')}?${params}`;
              } else {
                const v = u.searchParams.get('v');
                embed = v ? `https://www.youtube-nocookie.com/embed/${v}?${params}` : ad.anuncio;
              }
              return (
                <iframe
                  title={ad.nome_fantasia || 'anuncio-video-compact'}
                  src={embed}
                  frameBorder="0"
                  onLoad={() => setLoaded(true)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              );
            } catch (e) {
              return (
                <img src={getPlaceholderDataUri(400, 200, 'Anúncio')} alt="Anúncio" className="w-full h-full object-cover" onLoad={() => setLoaded(true)} />
              );
            }
          })()
        ) : (
          <img src={ad.anuncio} alt={ad.nome_fantasia || 'Anúncio'} className="w-full h-full object-cover" onLoad={() => setLoaded(true)} onError={(e) => { try { e.target.onerror = null; } catch {} e.target.src = getPlaceholderDataUri(400, 200, 'Anúncio'); setLoaded(true); }} />
        )}
      </div>

      <div className="p-3 bg-white">
        <p className="text-sm text-gray-700 mb-2 max-h-16 overflow-hidden">{ad.descricao_anuncio}</p>

        <div className="flex flex-col gap-2 text-xs text-gray-600">
          {ad.contato && (function(){
            const raw = String(ad.contato || '');
            const digits = raw.replace(/\D/g,'');
            const wa = digits ? `https://wa.me/${digits}` : '#';
            return (
              <a key="wa" href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-700 hover:text-green-600">
                <FaWhatsapp className="w-4 h-4 text-green-600" />
                <span className="text-sm">{raw}</span>
              </a>
            );
          })()}

          {ad.email && (
            <a key="mail" href={`mailto:${ad.email}`} className="inline-flex items-center gap-2 text-gray-700 hover:text-fatecride-blue">
              <FiPlus className="w-4 h-4 text-gray-600" />
              <span className="text-sm">{ad.email}</span>
            </a>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={() => { setLoaded(false); refetchAd?.(); }} className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm hover:shadow">Ver outro</button>
          <a href={`mailto:${ad.email}`} className="flex-1 px-3 py-2 bg-fatecride-blue text-white rounded text-sm text-center shadow-md hover:opacity-95">Entrar</a>
        </div>
      </div>
    </Card>
  );
}
