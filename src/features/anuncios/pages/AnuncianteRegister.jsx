import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarAnunciante } from '../services/anunciosService';
import toast from 'react-hot-toast';
import { Card } from '@shared/components/ui/Card';
import { Input } from '@shared/components/ui/Input';
import { Button } from '@shared/components/ui/Button';

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
    <div className="max-w-3xl mx-auto mt-8">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Cadastro de Anunciante</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Nome do dono" value={form.nome_dono} onChange={handleChange('nome_dono')} />
            <Input placeholder="Logo (URL)" value={form.logo} onChange={handleChange('logo')} />
            <Input placeholder="Razão social" value={form.razao_social} onChange={handleChange('razao_social')} />
            <Input placeholder="Nome fantasia" value={form.nome_fantasia} onChange={handleChange('nome_fantasia')} />
            <Input placeholder="CNPJ" value={form.cnpj} onChange={handleChange('cnpj')} />
            <Input placeholder="Ramo da empresa" value={form.ramo_empresa} onChange={handleChange('ramo_empresa')} />
            <Input placeholder="Descrição" value={form.descricao_anuncio} onChange={handleChange('descricao_anuncio')} />
              <Input placeholder="Endereço da empresa" value={form.endereco_empresa} onChange={handleChange('endereco_empresa')} />
              <Input placeholder="Endereço do dono" value={form.endereco_dono} onChange={handleChange('endereco_dono')} />
            <Input placeholder="Contato" value={form.contato} onChange={handleChange('contato')} />
            <Input placeholder="Email" value={form.email} onChange={handleChange('email')} />
            <Input placeholder="Senha" type="password" value={form.senha} onChange={handleChange('senha')} />
            <Input placeholder="Anúncio (URL ou YouTube)" value={form.anuncio} onChange={handleChange('anuncio')} />
            <Input placeholder="Quantidade alcance" value={form.quantidade_alcance} onChange={handleChange('quantidade_alcance')} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? 'Cadastrando...' : 'Cadastrar'}</Button>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-2">Observação: o backend atual exige envio de todos os campos.</p>
      </Card>
    </div>
  );
}

export default AnuncianteRegister;
