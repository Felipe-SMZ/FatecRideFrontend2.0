import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarAnunciante } from '../services/anunciosService';
import toast from 'react-hot-toast';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';
import { Navbar } from '@shared/components/layout/Navbar';
import { Logo } from '@shared/components/ui/Logo';
import { Link } from 'react-router-dom';

export function AnuncianteRegister() {
  const navigate = useNavigate();
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
  const [loading, setLoading] = useState(false);

  const handleChange = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // backend expects quantidade_alcance number and prefers fields without accent
      const payload = {
        ...form,
        quantidade_alcance: Number(form.quantidade_alcance),
      };
      await criarAnunciante(payload);
      toast.success('Cadastro realizado com sucesso. Faça login na área do anunciante.');
      navigate('/anunciante/login');
    } catch (err) {
      toast.error('Erro ao criar anunciante: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showAuthButton={false} />
      <main className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <aside className="hidden md:flex flex-col items-start justify-center p-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
              <div className="mb-6">
                <Logo size="lg" className="text-white" />
              </div>
              <h2 className="text-3xl font-bold leading-tight">Alcance mais clientes com anúncios</h2>
              <p className="mt-4 text-blue-100 max-w-xs">Crie anúncios profissionais, escolha alcance e destaque sua marca para os usuários do FatecRide.</p>
              <ul className="mt-6 space-y-2 text-sm text-blue-100">
                <li>• Exposição em páginas principais</li>
                <li>• Segmentação por região</li>
                <li>• Relatórios simples de desempenho</li>
              </ul>
            </aside>

            <section>
              <Card className="p-8 shadow-xl">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold">Cadastro de Anunciante</h3>
                    <p className="text-sm text-gray-500">Preencha os dados abaixo para criar sua conta de anunciante.</p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <span>Já tem conta? </span>
                    <Link to="/anunciante/login" className="text-blue-600 hover:underline">Entrar</Link>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nome do dono" placeholder="Nome completo" value={form.nome_dono} onChange={handleChange('nome_dono')} required />
                    <div>
                      <Input label="Logo (URL)" placeholder="https://.../logo.png" value={form.logo} onChange={handleChange('logo')} helperText="URL pública da logo (opcional)" />
                      {form.logo && (
                        <div className="mt-3 flex items-center gap-3">
                          <img src={form.logo} alt="Logo preview" className="w-20 h-20 rounded-md object-cover border" onError={(e) => e.currentTarget.style.display = 'none'} />
                          <div className="text-sm text-gray-600">Preview da logo (se a URL for válida)</div>
                        </div>
                      )}
                    </div>

                    <Input label="Razão social" placeholder="Razão social" value={form.razao_social} onChange={handleChange('razao_social')} />
                    <Input label="Nome fantasia" placeholder="Nome fantasia" value={form.nome_fantasia} onChange={handleChange('nome_fantasia')} />

                    <Input label="CNPJ" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={handleChange('cnpj')} />
                    <Input label="Ramo da empresa" placeholder="Ex: Alimentação" value={form.ramo_empresa} onChange={handleChange('ramo_empresa')} />

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do anúncio</label>
                      <textarea value={form.descricao_anuncio} onChange={handleChange('descricao_anuncio')} placeholder="Breve descrição do que será anunciado" className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={4} />
                    </div>

                    <Input label="Endereço da empresa" placeholder="Rua, número, bairro" value={form.endereco_empresa} onChange={handleChange('endereco_empresa')} />
                    <Input label="Endereço do dono" placeholder="Endereço residencial (opcional)" value={form.endereco_dono} onChange={handleChange('endereco_dono')} />

                    <Input label="Contato" placeholder="(XX) XXXXX-XXXX" value={form.contato} onChange={handleChange('contato')} />
                    <Input label="Email" placeholder="seu@exemplo.com" value={form.email} onChange={handleChange('email')} required />

                    <Input label="Senha" placeholder="Senha de acesso" type="password" value={form.senha} onChange={handleChange('senha')} helperText="Use uma senha segura (mín. 6 caracteres)" required />

                    <Input label="Anúncio (URL ou YouTube)" placeholder="https://... or https://youtube.com/watch?v=..." value={form.anuncio} onChange={handleChange('anuncio')} helperText="Link para imagem, vídeo direto (mp4) ou YouTube" />

                    <Input label="Quantidade de alcance" placeholder="Ex: 1000" type="number" min={0} value={form.quantidade_alcance} onChange={handleChange('quantidade_alcance')} />
                  </div>

                  <div className="flex flex-col md:flex-row items-center md:justify-between gap-3">
                    <p className="text-xs text-gray-500">Observação: o backend atual exige envio de todos os campos.</p>
                    <div className="flex items-center gap-2">
                      <Button type="submit" disabled={loading} loading={loading} className="px-6 py-2">{loading ? 'Cadastrando...' : 'Cadastrar'}</Button>
                      <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
                    </div>
                  </div>
                </form>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnuncianteRegister;
