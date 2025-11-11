import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@shared/components/ui/Input";
import { Button } from "@shared/components/ui/Button";
import { Select } from "@shared/components/ui/Select";
import { Alert } from "@shared/components/ui/Alert";
import { Card } from "@shared/components/ui/Card";
import { addressService } from "@features/profile/services/addressService";

/**
 * AddressRegisterPage - Página de cadastro de endereço
 * 
 * Permite ao usuário cadastrar seu endereço após criar a conta.
 * Busca CEP automaticamente e carrega cidades do backend.
 * Redireciona para cadastro de veículo se for motorista/ambos.
 */

// Schema de validação com Zod
const addressSchema = z.object({
  cep: z.string()
    .min(8, "CEP deve ter 8 dígitos")
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido (ex: 12345-678)"),
  logradouro: z.string().min(3, "Logradouro deve ter pelo menos 3 caracteres"),
  numero: z.string().min(1, "Número é obrigatório"),
  bairro: z.string().min(3, "Bairro deve ter pelo menos 3 caracteres"),
  cityId: z.string().min(1, "Selecione uma cidade"),
});

export function AddressRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userTypeId = location.state?.userTypeId || 1; // Receber userTypeId da página anterior
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");

  // Buscar estados ao montar
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('http://localhost:8080/states');
        const data = await response.json();
        setStates(data);
      } catch (error) {
        console.error('Erro ao carregar estados:', error);
      }
    };
    fetchStates();
  }, []);

  // Buscar cidades quando estado for selecionado
  useEffect(() => {
    if (selectedState) {
      const fetchCities = async () => {
        try {
          const response = await fetch(`http://localhost:8080/cities/${selectedState}`);
          const data = await response.json();
          setCities(data);
        } catch (error) {
          console.error('Erro ao carregar cidades:', error);
        }
      };
      fetchCities();
    }
  }, [selectedState]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cityId: "",
    }
  });

  // Buscar endereço pelo CEP
  const handleCepSearch = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const data = await addressService.searchCep(cleanCep);
        
        // Preencher campos automaticamente
        if (data.logradouro) setValue("logradouro", data.logradouro);
        if (data.bairro) setValue("bairro", data.bairro);
        
        // Buscar estado pelo UF
        if (data.uf) {
          const state = states.find(s => s.uf === data.uf);
          if (state) {
            setSelectedState(state.id);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
        setError("CEP não encontrado");
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");
      
      // Buscar dados do usuário salvos temporariamente
      const tempUserDataStr = localStorage.getItem('tempUserData');
      
      if (!tempUserDataStr) {
        console.error('❌ Dados temporários não encontrados!');
        setError("Dados de cadastro não encontrados. Por favor, volte e preencha o formulário novamente.");
        setLoading(false);
        return;
      }
      
      const tempUserData = JSON.parse(tempUserDataStr);
      
      const addressPayload = {
        cityId: Number(data.cityId),
        logradouro: data.logradouro,
        numero: data.numero,
        bairro: data.bairro,
        cep: data.cep.replace(/\D/g, ''),
      };
      
      // Verificar tipo de usuário ANTES de enviar
      // Se for Motorista (2) ou Ambos (3), NÃO criar agora - ir para cadastro de veículo
      // Backend exige veículo para esses tipos
      if (userTypeId === 2 || userTypeId === 3) {
        // Salvar dados temporariamente para enviar junto com o veículo
        localStorage.setItem('tempUserData', JSON.stringify(tempUserData));
        localStorage.setItem('tempAddressData', JSON.stringify(addressPayload));
        
        setLoading(false);
        
        navigate("/cadastro-veiculo", {
          state: { 
            message: "Agora cadastre seu veículo para oferecer caronas.",
            isRequired: true
          },
        });
        
        return; // IMPORTANTE: Para a execução aqui
      }
      
      // Se chegou aqui, é Passageiro (1) - criar normalmente
      
      // Montar payload completo: usuário + endereço
      const completePayload = {
        ...tempUserData,
        userAddressesDTO: addressPayload // Backend espera OBJETO, não array!
      };
      
      // Apenas passageiros usam este endpoint
      const endpoint = '/users/criarPassageiro';
      
      // Criar usuário com endereço
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completePayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.message || 'Erro ao criar conta');
      }
      
      const responseData = await response.json();
      
      // Salvar token
      if (responseData.token) {
        localStorage.setItem('token', responseData.token);
      }
      
      // Limpar dados temporários
      localStorage.removeItem('tempUserData');
      
      navigate("/inicio", {
        state: { message: "Cadastro concluído com sucesso!" },
      });
    } catch (err) {
      console.error('❌ Erro no cadastro:', err);
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 py-12">
      <Card className="w-full max-w-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-fatecride-blue">Cadastrar Endereço</h1>
          <p className="text-text-secondary mt-2 text-lg">Precisamos saber onde você está para conectar você com caronas</p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white p-6 rounded-xl space-y-4 border-2 border-fatecride-blue/20 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-fatecride-blue text-white flex items-center justify-center font-bold text-xl">1</div>
              <h3 className="font-bold text-fatecride-blue text-lg">Localização</h3>
            </div>
            
            <Input
              label="CEP"
              placeholder="12345-678"
              error={errors.cep?.message}
              {...register("cep")}
              onBlur={(e) => handleCepSearch(e.target.value)}
            />

            <Input
              label="Logradouro"
              placeholder="Rua, Avenida..."
              error={errors.logradouro?.message}
              {...register("logradouro")}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Número"
                placeholder="123"
                error={errors.numero?.message}
                {...register("numero")}
              />

              <Input
                label="Bairro"
                placeholder="Centro"
                error={errors.bairro?.message}
                {...register("bairro")}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl space-y-4 border-2 border-fatecride-blue/20 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-fatecride-blue text-white flex items-center justify-center font-bold text-xl">2</div>
              <h3 className="font-bold text-fatecride-blue text-lg">Cidade</h3>
            </div>
            
            <Select
              label="Estado"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              options={states.map(s => ({
                value: s.id.toString(),
                label: `${s.nome} (${s.uf})`
              }))}
              placeholder="Selecione o estado"
            />

            <Select
              label="Cidade"
              error={errors.cityId?.message}
              {...register("cityId")}
              options={cities.map(c => ({
                value: c.id.toString(),
                label: c.nome
              }))}
              placeholder="Selecione a cidade"
              disabled={!selectedState}
            />
          </div>

          <Button 
            type="submit" 
            fullWidth 
            disabled={loading} 
            size="lg" 
            className="bg-gradient-to-r from-fatecride-blue to-fatecride-blue-dark hover:from-fatecride-blue-dark hover:to-fatecride-blue-darker shadow-lg text-lg py-4"
          >
            {loading 
              ? "Cadastrando..." 
              : (userTypeId === 2 || userTypeId === 3) 
                ? "Próxima Etapa: Cadastrar Veículo" 
                : "Finalizar Cadastro"
            }
          </Button>

          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-text-secondary">
              Já cadastrou?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-fatecride-blue font-semibold hover:underline"
              >
                Fazer login
              </button>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
