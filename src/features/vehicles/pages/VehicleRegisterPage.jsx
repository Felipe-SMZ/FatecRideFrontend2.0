import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@shared/components/ui/Input";
import { Button } from "@shared/components/ui/Button";
import { Alert } from "@shared/components/ui/Alert";
import { Card } from "@shared/components/ui/Card";
import api from "@shared/lib/api";

/**
 * VehicleRegisterPage - Página de cadastro de veículo durante o registro
 * 
 * Parte do fluxo de cadastro para motoristas.
 * Exige pelo menos um veículo para concluir o registro.
 */

// Schema de validação
const vehicleSchema = z.object({
  modelo: z.string().min(2, "Modelo deve ter pelo menos 2 caracteres"),
  marca: z.string().min(2, "Marca deve ter pelo menos 2 caracteres"),
  placa: z.string()
    .min(7, "Placa deve ter 7 caracteres")
    .max(7, "Placa deve ter 7 caracteres")
    .regex(/^[A-Z]{3}\d{1}[A-Z\d]{1}\d{2}$/i, "Formato inválido (ex: ABC1234 ou ABC1D23)"),
  cor: z.string().min(3, "Cor deve ter pelo menos 3 caracteres"),
  ano: z.string()
    .regex(/^\d{4}$/, "Ano deve ter 4 dígitos")
    .transform((val) => Number(val))
    .refine((val) => val >= 1900 && val <= new Date().getFullYear() + 1, "Ano inválido"),
  vagas_disponiveis: z.string()
    .min(1, "Vagas disponíveis é obrigatório")
    .transform((val) => Number(val))
    .refine((val) => val >= 1 && val <= 8, "Vagas devem ser entre 1 e 8"),
});

export function VehicleRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isRequired = location.state?.isRequired || false;
  
  console.log('🚗 [VehicleRegisterPage] Inicialização');
  console.log('  📌 isRequired:', isRequired);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      modelo: "",
      marca: "",
      placa: "",
      cor: "",
      ano: new Date().getFullYear().toString(),
      vagas_disponiveis: "4",
    }
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");
      
      console.log('🚀 [VehicleRegisterPage] Submetendo veículo...');
      console.log('📦 Dados recebidos:', data);
      
      // Buscar dados do usuário temporários
      const tempUserDataStr = localStorage.getItem('tempUserData');
      if (!tempUserDataStr) {
        console.error('❌ Dados temporários não encontrados!');
        setError("Sessão expirada. Por favor, faça login novamente.");
        setLoading(false);
        return;
      }
      
      const tempUserData = JSON.parse(tempUserDataStr);
      console.log('� Dados do usuário:', tempUserData);
      
      // Buscar dados do endereço
      const addressDataStr = localStorage.getItem('tempAddressData');
      if (!addressDataStr) {
        console.error('❌ Dados de endereço não encontrados!');
        setError("Dados de endereço não encontrados. Por favor, volte e preencha novamente.");
        setLoading(false);
        return;
      }
      
      const addressData = JSON.parse(addressDataStr);
      console.log('🏠 Dados do endereço:', addressData);
      
      const vehiclePayload = {
        modelo: data.modelo,
        marca: data.marca,
        placa: data.placa.toUpperCase(),
        cor: data.cor,
        ano: data.ano,
        vagas_disponiveis: data.vagas_disponiveis,
      };
      
      console.log('🚗 Payload do veículo:', vehiclePayload);
      
      // Montar payload completo: UserDriverDTO
      const completePayload = {
        ...tempUserData,
        userAddressesDTO: addressData,
        vehicleDTO: vehiclePayload
      };
      
      console.log('� Payload completo (UserDriverDTO):', completePayload);
      console.log('🔀 Endpoint: /users/criarMotorista');
      
      // Criar motorista com veículo
      const response = await fetch('http://localhost:8080/users/criarMotorista', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completePayload)
      });
      
      console.log('📨 Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.message || 'Erro ao cadastrar motorista');
      }
      
      const responseData = await response.json();
      console.log('✅ Resposta do servidor:', responseData);
      console.log('✅ Resposta do servidor:', responseData);
      
      // Salvar token
      if (responseData.token) {
        localStorage.setItem('token', responseData.token);
        console.log('🔑 Token salvo no localStorage');
      }
      
      // Limpar dados temporários
      localStorage.removeItem('tempUserData');
      localStorage.removeItem('tempAddressData');
      console.log('🗑️  Dados temporários removidos');
      
      console.log('➡️  Redirecionando para início...');
      
      // Redireciona para início
      navigate("/inicio", {
        state: { message: "Cadastro concluído com sucesso! Você já pode oferecer caronas." },
      });
    } catch (err) {
      console.error('❌ Erro no cadastro de motorista:', err);
      console.error('📋 Detalhes:', err);
      setError(err.message || "Erro ao cadastrar motorista");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (!isRequired) {
      console.log('⏭️  Pulando cadastro de veículo...');
      navigate("/inicio");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-fatecride-blue to-fatecride-blue-dark p-4 py-12">
      <Card className="w-full max-w-xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-fatecride-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-fatecride-blue">Cadastre seu Veículo</h1>
          <p className="text-gray-600 mt-2">
            {isRequired 
              ? "Para oferecer caronas, você precisa cadastrar pelo menos um veículo"
              : "Adicione um veículo para começar a oferecer caronas"
            }
          </p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white p-6 rounded-xl space-y-4 border-2 border-fatecride-blue/20 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-fatecride-blue text-white flex items-center justify-center font-bold">
                🚗
              </div>
              <h3 className="font-bold text-fatecride-blue text-lg">Informações do Veículo</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Modelo"
                placeholder="Ex: Civic, Corolla"
                error={errors.modelo?.message}
                {...register("modelo")}
              />

              <Input
                label="Marca"
                placeholder="Ex: Honda, Toyota"
                error={errors.marca?.message}
                {...register("marca")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cor"
                placeholder="Ex: Preto, Branco"
                error={errors.cor?.message}
                {...register("cor")}
              />

              <Input
                label="Ano"
                type="number"
                placeholder="Ex: 2020"
                error={errors.ano?.message}
                {...register("ano")}
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Placa"
                placeholder="ABC1234"
                error={errors.placa?.message}
                {...register("placa", {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }
                })}
                maxLength={7}
              />

              <Input
                label="Vagas Disponíveis"
                type="number"
                min="1"
                max="8"
                placeholder="Ex: 4"
                error={errors.vagas_disponiveis?.message}
                {...register("vagas_disponiveis")}
              />
            </div>
          </div>

          <div className="flex gap-4">
            {!isRequired && (
              <Button 
                type="button"
                onClick={handleSkip}
                variant="secondary"
                fullWidth
                size="lg"
              >
                Cadastrar depois
              </Button>
            )}
            
            <Button 
              type="submit" 
              fullWidth 
              disabled={loading} 
              size="lg"
              className="bg-gradient-to-r from-fatecride-blue to-fatecride-blue-dark hover:from-fatecride-blue-dark hover:to-fatecride-blue-darker shadow-lg text-lg py-4"
            >
              {loading ? "Cadastrando..." : "Concluir Cadastro"}
            </Button>
          </div>
        </form>

        {isRequired && (
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-fatecride-blue rounded">
            <p className="text-sm text-blue-700">
              <strong>📌 Importante:</strong> Como você se cadastrou como motorista, é necessário cadastrar pelo menos um veículo para oferecer caronas.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
