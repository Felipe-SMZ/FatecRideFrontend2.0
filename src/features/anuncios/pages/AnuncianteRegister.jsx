import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarAnunciante } from '../services/anunciosService';
import toast from 'react-hot-toast';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';
import { Navbar } from '@shared/components/layout/Navbar';
import { Logo } from '@shared/components/ui/Logo';

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
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <aside className="hidden md:flex flex-col items-center justify-center p-6 bg-white/60 rounded-lg shadow-md">
              <Logo size="xl" />
              <h2 className="mt-4 text-2xl font-bold">Seja um Anunciante</h2>
              <p className="text-gray-600 mt-2 text-center">Aumente seu alcance com anúncios exibidos em várias páginas do site.</p>
            </aside>

            <section>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Cadastro de Anunciante</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input label="Nome do dono" placeholder="Nome completo" value={form.nome_dono} onChange={handleChange('nome_dono')} required />
                    <Input label="Logo (URL)" placeholder="https://.../logo.png" value={form.logo} onChange={handleChange('logo')} helperText="URL pública da logo (opcional)" />
                    <Input label="Razão social" placeholder="Razão social" value={form.razao_social} onChange={handleChange('razao_social')} />
                    <Input label="Nome fantasia" placeholder="Nome fantasia" value={form.nome_fantasia} onChange={handleChange('nome_fantasia')} />
                    <Input label="CNPJ" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={handleChange('cnpj')} />
                    <Input label="Ramo da empresa" placeholder="Ex: Alimentação" value={form.ramo_empresa} onChange={handleChange('ramo_empresa')} />
                    <Input label="Descrição" placeholder="Breve descrição do anúncio" value={form.descricao_anuncio} onChange={handleChange('descricao_anuncio')} />
                    <Input label="Endereço da empresa" placeholder="Rua, número, bairro" value={form.endereco_empresa} onChange={handleChange('endereco_empresa')} />
                    <Input label="Endereço do dono" placeholder="Endereço residencial (opcional)" value={form.endereco_dono} onChange={handleChange('endereco_dono')} />
                    <Input label="Contato" placeholder="(XX) XXXXX-XXXX" value={form.contato} onChange={handleChange('contato')} />
                    <Input label="Email" placeholder="seu@exemplo.com" value={form.email} onChange={handleChange('email')} required />
                    <Input label="Senha" placeholder="Senha de acesso" type="password" value={form.senha} onChange={handleChange('senha')} helperText="Use uma senha segura (mín. 6 caracteres)" required />
                    <Input label="Anúncio (URL ou YouTube)" placeholder="https://... or https://youtube.com/watch?v=..." value={form.anuncio} onChange={handleChange('anuncio')} helperText="Link para imagem, vídeo direto (mp4) ou YouTube" />
                    <Input label="Quantidade alcance" placeholder="Número de visualizações desejadas" value={form.quantidade_alcance} onChange={handleChange('quantidade_alcance')} />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading} loading={loading}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Button>
                  </div>
                </form>
                <p className="text-xs text-gray-500 mt-2">Observação: o backend atual exige envio de todos os campos.</p>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnuncianteRegister;
