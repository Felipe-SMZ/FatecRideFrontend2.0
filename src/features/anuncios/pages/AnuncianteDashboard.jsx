import { useEffect, useState } from 'react';
import { useAnuncios, useAnunciosAuth } from '../hooks/useAnuncios';
import { useAnunciosStore } from '../stores/anunciosStore';
import { decodeToken, getAnunciante, atualizarAnunciante, atualizarAnuncianteParcial, deletarAnunciante } from '../services/anunciosService';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';
import AnuncioViewer from '../components/AnuncioViewer';
import toast from 'react-hot-toast';

export function AnuncianteDashboard() {
  const { ad, refetchAd, isLoadingAd } = useAnuncios();
  const { isAuthenticated } = useAnunciosStore();
  const { logout } = useAnunciosAuth();

  const token = useAnunciosStore.getState().token;
  const decoded = token ? decodeToken(token) : null;
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    nome_dono: '',
    logo: '',
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    ramo_empresa: '',
    descricao_anuncio: '',
    endereco_empresa: '',
    endereco_dono: '',
    contato: '',
    email: '',
    senha: '',
    anuncio: '',
    quantidade_alcance: '',
  });
  const [saving, setSaving] = useState(false);

  // helper para renderizar preview seguro (evita IIFE/try sem catch no JSX)
  const renderPreviewMedia = (url) => {
    try {
      const u = new URL(url);
      const hostname = u.hostname || '';
      if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
        // use youtube-nocookie (privacy-enhanced) to reduce ad network calls
        const params = 'rel=0&modestbranding=1';
        let embed = url;
        if (hostname === 'youtu.be') {
          embed = `https://www.youtube-nocookie.com/embed/${u.pathname.replace(/^\//, '')}?${params}`;
        } else {
          const v = u.searchParams.get('v');
          embed = v ? `https://www.youtube-nocookie.com/embed/${v}?${params}` : url;
        }
        return (
          <iframe
            title="preview"
            src={embed}
            frameBorder="0"
            allowFullScreen
            className="w-full h-48"
          />
        );
      }
    } catch (e) {
      return <div className="p-4 text-sm text-gray-500">URL inválida</div>;
    }
    return (
      <img
        src={url}
        alt="preview"
        className="w-full h-48 object-cover"
        onError={(e) => {
          try { e.target.onerror = null; } catch (err) {}
          e.target.src = 'https://via.placeholder.com/800x400/CCCCCC/666666?text=Anuncio+Indisponivel';
        }}
      />
    );
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAnunciante();
          // getAnunciante já normaliza possíveis formatos do backend
          if (!mounted) return;
          const normalized = {
            ...data,
            endereco_empresa: data?.endereco_empresa ?? data?.['endereço_empresa'],
            endereco_dono: data?.endereco_dono ?? data?.['endereço_dono'],
          };
          setProfile(normalized || {});
          if (normalized) setForm((f) => ({ ...f, ...(normalized || {}) }));
      } catch (err) {
        // if GET /me not implemented on backend, profile stays null and user can still use token info
        setProfile({});
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-4">
            <h2 className="font-medium mb-2">Editar anúncio (envie todos os campos exigidos)</h2>
            {profile === null ? (
              <div>Carregando dados do anunciante...</div>
            ) : (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSaving(true);
                  try {
                    const payload = { ...form, quantidade_alcance: Number(form.quantidade_alcance) };
                    // log payload para debug em devtools
                    console.debug('Anuncio update payload:', payload);
                    try {
                      // tenta PATCH parcial primeiro (menor chance de ValidationError)
                      await atualizarAnuncianteParcial(payload);
                      toast.success('Anúncio atualizado (parcial) com sucesso');
                    } catch (err) {
                      console.warn('PATCH falhou, tentando PUT. Erro:', err);
                      try {
                        await atualizarAnunciante(payload);
                        toast.success('Anúncio atualizado com sucesso');
                      } catch (err2) {
                        // tentar extrair mensagem do backend
                        const backendMessage = err2?.response?.data?.message ?? err2?.message ?? err2;
                        toast.error('Erro ao atualizar: ' + backendMessage);
                        throw err2;
                      }
                    }

                    // refresh profile (normaliza formatos retornados)
                    const freshRes = await getAnunciante();
                    const fresh = freshRes?.data ?? freshRes ?? null;
                    const normalized = {
                      ...fresh,
                      endereco_empresa: fresh?.endereco_empresa ?? fresh?.['endereço_empresa'],
                      endereco_dono: fresh?.endereco_dono ?? fresh?.['endereço_dono'],
                    };
                    setProfile(normalized || {});
                    setForm((f) => ({ ...f, ...(normalized || {}) }));
                  } catch (err) {
                    toast.error('Erro ao atualizar: ' + (err.message || err));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Nome dono" value={form.nome_dono} onChange={(e) => setForm({ ...form, nome_dono: e.target.value })} />
                  <Input placeholder="Logo (URL)" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
                  <Input placeholder="Razão social" value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
                  <Input placeholder="Nome fantasia" value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} />
                  <Input placeholder="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
                  <Input placeholder="Ramo empresa" value={form.ramo_empresa} onChange={(e) => setForm({ ...form, ramo_empresa: e.target.value })} />
                  <Input placeholder="Descrição do anúncio" value={form.descricao_anuncio} onChange={(e) => setForm({ ...form, descricao_anuncio: e.target.value })} />
                  <Input placeholder="Endereço empresa" value={form.endereco_empresa} onChange={(e) => setForm({ ...form, endereco_empresa: e.target.value })} />
                  <Input placeholder="Endereço dono" value={form.endereco_dono} onChange={(e) => setForm({ ...form, endereco_dono: e.target.value })} />
                  <Input placeholder="Contato" value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
                  <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <Input placeholder="Senha (nova)" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
                  <Input placeholder="Anúncio (URL ou YouTube)" value={form.anuncio} onChange={(e) => setForm({ ...form, anuncio: e.target.value })} />
                  <Input placeholder="Quantidade alcance" value={form.quantidade_alcance} onChange={(e) => setForm({ ...form, quantidade_alcance: e.target.value })} />
                </div>
                <div className="flex justify-between mt-3">
                  <div>
                    <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Atualizar'}</Button>
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={async () => {
                        if (!confirm('Deseja realmente excluir sua conta e anúncio?')) return;
                        try {
                          await deletarAnunciante();
                          toast.success('Conta deletada. Você será desconectado.');
                          window.location.href = '/anunciante/login';
                        } catch (err) {
                          toast.error('Erro ao deletar: ' + err.message);
                        }
                      }}
                    >Excluir conta</Button>
                  </div>
                </div>
              </form>
            )}
            <p className="text-xs text-gray-500 mt-2">Observação: o backend atual exige envio de todos os campos no PUT. Preencha o formulário completo para atualizar.</p>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <h2 className="text-lg font-medium mb-2">Pré-visualização do Anúncio</h2>
          {/* reutiliza viewer para mostrar anuncio atual */}
          <div className="space-y-4">
            <div>
              {/* se estiver editando, mostrar preview em tempo real */}
              {form.anuncio ? (
                <Card className="overflow-hidden">
                  {/* image/video preview */}
                  {form.anuncio.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={form.anuncio} alt="preview" className="w-full h-48 object-cover" />
                  ) : form.anuncio.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video src={form.anuncio} controls className="w-full h-48 object-cover" />
                  ) : (
                    renderPreviewMedia(form.anuncio)
                  )
                  }
                  <div className="p-3">
                    <div className="text-sm font-semibold">{form.nome_fantasia || form.nome_dono || 'Preview do anunciante'}</div>
                    <div className="text-xs text-gray-500">{form.descricao_anuncio}</div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 text-center text-gray-500">Nenhuma URL de anúncio preenchida</Card>
              )}
            </div>
            <div>
              {/* Mostrar anúncio público atual em produção */}
              <AnuncioViewer className="" />
            </div>
          </div>
          </div>
      </div>
    </div>
  );
}

export default AnuncianteDashboard;
