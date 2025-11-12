import { Navbar } from "@shared/components/layout/Navbar";
import { PageContainer } from "@shared/components/layout/PageContainer";
import { Card } from "@shared/components/ui/Card";
import { Button } from "@shared/components/ui/Button";
import { Input } from "@shared/components/ui/Input";
import { useAuthStore } from "@features/auth/stores/authStore";
import { authService } from "@features/auth/services/authService";
import { addressService } from "@features/profile/services/addressService";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { FiUser, FiMapPin, FiSave, FiX } from "react-icons/fi";

/**
 * ProfilePage - Página de perfil do usuário
 * Permite visualizar e editar informações pessoais e endereço
 */

export function ProfilePage() {
  const { user, updateUser: updateAuthUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  
  // Estado para dados pessoais
  const [personalData, setPersonalData] = useState({
    nome: "",
    sobrenome: "",
    telefone: "",
    email: ""
  });
  
  // Estado para endereço
  const [addressData, setAddressData] = useState({
    id: null,
    logradouro: "",
    numero: "",
    bairro: "",
    cep: "",
    cidade: "",
    estado: ""
  });
  
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Carregar dados do usuário ao montar
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      console.log('📦 Dados completos do usuário:', JSON.stringify(userData, null, 2));
      
      // Formatar telefone para exibição
      const formattedPhone = userData.telefone 
        ? formatPhone(userData.telefone) 
        : "";
      
      setPersonalData({
        nome: userData.nome || "",
        sobrenome: userData.sobrenome || "",
        telefone: formattedPhone,
        email: userData.email || ""
      });
      
      // Buscar endereço do endpoint separado GET /address
      try {
        console.log('🏠 Buscando endereço em GET /address...');
        const addressResponse = await addressService.getAddress();
        console.log('📍 Resposta de GET /address:', addressResponse);
        
        if (addressResponse) {
          setAddressData({
            id: addressResponse.id || null,
            logradouro: addressResponse.logradouro || "",
            numero: addressResponse.numero || "",
            bairro: addressResponse.bairro || "",
            cep: addressResponse.cep || "",
            cidade: addressResponse.city || "",
            estado: addressResponse.state || ""
          });
          console.log('✅ Endereço carregado com sucesso!');
        }
      } catch (addressError) {
        console.log('⚠️ Erro ao buscar endereço:', addressError.response?.status);
        if (addressError.response?.status === 404) {
          console.log('💡 Nenhum endereço cadastrado para este usuário');
        } else {
          console.error('❌ Erro ao buscar endereço:', addressError);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      console.error('❌ Detalhes:', error.response?.data);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalChange = (field, value) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setAddressData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleSavePersonal = async () => {
    try {
      setLoading(true);
      
      // Validação básica
      if (!personalData.nome || !personalData.sobrenome) {
        toast.error('Nome e sobrenome são obrigatórios');
        setLoading(false);
        return;
      }

      const cleanPhone = personalData.telefone.replace(/\D/g, '');
      
      // Buscar dados completos do usuário para não perder informações
      const currentUserData = await authService.getCurrentUser();
      console.log('📋 Dados atuais completos:', currentUserData);
      
      // Backend exige TODOS os campos do UserBaseDTO:
      // nome, sobrenome, email, senha, telefone, foto, userTypeId, genderId, courseId
      const updateData = {
        nome: personalData.nome,
        sobrenome: personalData.sobrenome,
        email: currentUserData.email, // Não pode ser alterado
        senha: currentUserData.senha || "senhaTemporaria123", // Backend exige senha
        telefone: cleanPhone,
        foto: currentUserData.foto || "",
        userTypeId: currentUserData.userTypeId,
        genderId: currentUserData.genderId,
        courseId: currentUserData.courseId
      };

      console.log('📤 Enviando para PUT /users:', updateData);
      
      const response = await authService.updateUser(updateData);
      console.log('✅ Resposta do backend:', response);
      
      // Atualizar authStore
      updateAuthUser({
        name: `${personalData.nome} ${personalData.sobrenome}`,
        email: personalData.email
      });
      
      toast.success('Dados pessoais atualizados com sucesso!');
      setIsEditingPersonal(false);
      await loadUserData();
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
      console.error('❌ Response:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error
        || 'Erro ao atualizar dados pessoais';
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPersonal = () => {
    loadUserData();
    setIsEditingPersonal(false);
  };

  const handleSaveAddress = async () => {
    try {
      setLoadingAddress(true);
      
      // Validação básica
      if (!addressData.cep || !addressData.logradouro || !addressData.numero) {
        toast.error('CEP, logradouro e número são obrigatórios');
        setLoadingAddress(false);
        return;
      }

      if (!addressData.id) {
        toast.error('ID do endereço não encontrado. Não é possível atualizar.');
        setLoadingAddress(false);
        return;
      }

      const cleanCep = addressData.cep.replace(/\D/g, '');
      
      // Preparar dados para envio (UserAddressesDTO)
      const updateData = {
        cityId: 1, // TODO: Precisaria buscar cityId baseado na cidade selecionada
        logradouro: addressData.logradouro,
        numero: addressData.numero,
        bairro: addressData.bairro,
        cep: cleanCep
      };

      console.log('📤 Enviando para PUT /address/' + addressData.id + ':', updateData);
      
      const response = await addressService.updateAddress(addressData.id, updateData);
      console.log('✅ Resposta do backend:', response);
      
      toast.success('Endereço atualizado com sucesso!');
      setIsEditingAddress(false);
      await loadUserData();
    } catch (error) {
      console.error('❌ Erro ao atualizar endereço:', error);
      console.error('❌ Response:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error
        || 'Erro ao atualizar endereço';
      
      toast.error(errorMsg);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleCancelAddress = () => {
    loadUserData();
    setIsEditingAddress(false);
  };

  return (
    <>
      <Navbar showAuthButton={true} />
      <PageContainer
        title="Meu Perfil"
        description="Visualize e edite suas informações pessoais"
      >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Card: Informações Pessoais */}
        <Card>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiUser className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Informações Pessoais</h3>
                  <p className="text-sm text-gray-600">Seus dados cadastrais</p>
                </div>
              </div>
              
              {!isEditingPersonal ? (
                <Button onClick={() => setIsEditingPersonal(true)} size="sm">
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSavePersonal} 
                    disabled={loading}
                    size="sm"
                    className="gap-2"
                  >
                    <FiSave /> {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelPersonal}
                    disabled={loading}
                    size="sm"
                    className="gap-2"
                  >
                    <FiX /> Cancelar
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <Input 
                  value={personalData.nome} 
                  onChange={(e) => handlePersonalChange('nome', e.target.value)}
                  disabled={!isEditingPersonal}
                  placeholder="Seu nome"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sobrenome
                </label>
                <Input 
                  value={personalData.sobrenome} 
                  onChange={(e) => handlePersonalChange('sobrenome', e.target.value)}
                  disabled={!isEditingPersonal}
                  placeholder="Seu sobrenome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input 
                  value={personalData.email} 
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <Input 
                  value={personalData.telefone} 
                  onChange={(e) => handlePersonalChange('telefone', formatPhone(e.target.value))}
                  disabled={!isEditingPersonal}
                  placeholder="(11) 98765-4321"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuário
                </label>
                <Input
                  value={
                    user?.tipo === "MOTORISTA" 
                      ? "Motorista" 
                      : user?.tipo === "AMBOS" 
                      ? "Motorista e Passageiro" 
                      : "Passageiro"
                  }
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Card: Endereço */}
        <Card>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiMapPin className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Endereço</h3>
                  <p className="text-sm text-gray-600">Seu endereço cadastrado</p>
                </div>
              </div>
              
              {!isEditingAddress ? (
                <Button 
                  onClick={() => setIsEditingAddress(true)} 
                  size="sm" 
                  variant="outline"
                  disabled={!addressData.id}
                >
                  Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveAddress} 
                    disabled={loadingAddress}
                    size="sm"
                    className="gap-2"
                  >
                    <FiSave /> {loadingAddress ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelAddress}
                    disabled={loadingAddress}
                    size="sm"
                    className="gap-2"
                  >
                    <FiX /> Cancelar
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <Input 
                  value={addressData.cep} 
                  onChange={(e) => handleAddressChange('cep', e.target.value)}
                  disabled={!isEditingAddress}
                  placeholder="00000-000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logradouro
                </label>
                <Input 
                  value={addressData.logradouro} 
                  onChange={(e) => handleAddressChange('logradouro', e.target.value)}
                  disabled={!isEditingAddress}
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número
                </label>
                <Input 
                  value={addressData.numero} 
                  onChange={(e) => handleAddressChange('numero', e.target.value)}
                  disabled={!isEditingAddress}
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro
                </label>
                <Input 
                  value={addressData.bairro} 
                  onChange={(e) => handleAddressChange('bairro', e.target.value)}
                  disabled={!isEditingAddress}
                  placeholder="Centro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <Input 
                  value={addressData.cidade} 
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <Input 
                  value={addressData.estado} 
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
            
            {/* Avisos e mensagens */}
            {!addressData.id && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Informação:</strong> Nenhum endereço cadastrado. 
                  O endereço foi criado durante o cadastro inicial.
                </p>
              </div>
            )}
            
            {isEditingAddress && addressData.id && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Atenção:</strong> Ao editar o endereço, certifique-se de que as informações estão corretas. 
                  Cidade e Estado não podem ser alterados por aqui.
                </p>
              </div>
            )}
          </div>
        </Card>

      </div>
    </PageContainer>
    </>
  );
}

export default ProfilePage;
