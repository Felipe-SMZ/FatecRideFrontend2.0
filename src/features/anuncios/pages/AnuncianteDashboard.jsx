import { useEffect, useState } from 'react';
import { useAnuncios, useAnunciosAuth } from '../hooks/useAnuncios';
import { useAnunciosStore } from '../stores/anunciosStore';
import { decodeToken, getAnunciante, atualizarAnunciante, atualizarAnuncianteParcial, deletarAnunciante } from '../services/anunciosService';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';
import AnuncioViewer from '../components/AnuncioViewer';
import { getPlaceholderDataUri } from '../utils/placeholder';
import { Navbar } from '@shared/components/layout/Navbar';
import { Logo } from '@shared/components/ui/Logo';
import toast from 'react-hot-toast';

export function AnuncianteDashboard() {
  const { ad, refetchAd, isLoadingAd } = useAnuncios();
  const isAuthenticated = useAnunciosStore.getState().isAuthenticated();
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
          e.target.src = getPlaceholderDataUri(800, 400, 'Anúncio Indisponível');
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
    <div className="min-h-screen bg-gray-50">
      <Navbar showAuthButton={false} />
      <main className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <aside className="lg:col-span-1 hidden lg:flex flex-col items-center justify-start p-6 bg-white rounded-lg shadow-md">
              <Logo size="2xl" />
              <h2 className="mt-4 text-xl font-bold">Painel do Anunciante</h2>
              <p className="text-sm text-gray-600 mt-2 text-center">Gerencie seu perfil e anúncios. Use a área ao lado para editar e pré-visualizar.</p>
              <div className="mt-4 w-full">
                <Card className="p-3">
                  <h3 className="text-sm font-medium">Dados do token</h3>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-2 max-h-40 overflow-auto">{JSON.stringify(decoded, null, 2)}</pre>
                </Card>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => logout()} fullWidth> Sair </Button>
                </div>
              </div>
            </aside>

            <section className="lg:col-span-2">
              <Card className="p-4">
                <h2 className="font-medium mb-2">Editar anúncio</h2>
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
                        console.debug('Anuncio update payload:', payload);
                        try {
                          await atualizarAnuncianteParcial(payload);
                          toast.success('Anúncio atualizado (parcial) com sucesso');
                        } catch (err) {
                          console.warn('PATCH falhou, tentando PUT. Erro:', err);
                          try {
                            await atualizarAnunciante(payload);
                            toast.success('Anúncio atualizado com sucesso');
                          } catch (err2) {
                            const backendMessage = err2?.response?.data?.message ?? err2?.message ?? err2;
                            toast.error('Erro ao atualizar: ' + backendMessage);
                            throw err2;
                          }
                        }

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
                      <Input label="Nome do dono" placeholder="Nome completo" value={form.nome_dono} onChange={(e) => setForm({ ...form, nome_dono: e.target.value })} />
                      <Input label="Logo (URL)" placeholder="https://.../logo.png" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
                      <Input label="Razão social" placeholder="Razão social" value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
                      <Input label="Nome fantasia" placeholder="Nome fantasia" value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} />
                      <Input label="CNPJ" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
                      <Input label="Ramo da empresa" placeholder="Ex: Alimentação" value={form.ramo_empresa} onChange={(e) => setForm({ ...form, ramo_empresa: e.target.value })} />
                      <Input label="Descrição do anúncio" placeholder="Breve descrição" value={form.descricao_anuncio} onChange={(e) => setForm({ ...form, descricao_anuncio: e.target.value })} />
                      <Input label="Endereço da empresa" placeholder="Rua, número, bairro" value={form.endereco_empresa} onChange={(e) => setForm({ ...form, endereco_empresa: e.target.value })} />
                      <Input label="Endereço do dono" placeholder="Endereço residencial (opcional)" value={form.endereco_dono} onChange={(e) => setForm({ ...form, endereco_dono: e.target.value })} />
                      <Input label="Contato" placeholder="(XX) XXXXX-XXXX" value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
                      <Input label="Email" placeholder="seu@exemplo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      <Input label="Senha (nova)" placeholder="Senha de acesso" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
                      <Input label="Anúncio (URL ou YouTube)" placeholder="https://... or https://youtube.com/watch?v=..." value={form.anuncio} onChange={(e) => setForm({ ...form, anuncio: e.target.value })} />
                      <Input label="Quantidade alcance" placeholder="Número" value={form.quantidade_alcance} onChange={(e) => setForm({ ...form, quantidade_alcance: e.target.value })} />
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

              <div className="mt-6 grid grid-cols-1 gap-4">
                <h3 className="text-lg font-medium">Pré-visualização do Anúncio</h3>
                {form.anuncio ? (
                  <Card className="overflow-hidden">
                    {form.anuncio.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={form.anuncio} alt="preview" className="w-full h-48 object-cover" />
                    ) : form.anuncio.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={form.anuncio} controls className="w-full h-48 object-cover" />
                    ) : (
                      renderPreviewMedia(form.anuncio)
                    )}
                    <div className="p-3">
                      <div className="text-sm font-semibold">{form.nome_fantasia || form.nome_dono || 'Preview do anunciante'}</div>
                      <div className="text-xs text-gray-500">{form.descricao_anuncio}</div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 text-center text-gray-500">Nenhuma URL de anúncio preenchida</Card>
                )}

                <div>
                  <AnuncioViewer className="" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnuncianteDashboard;
