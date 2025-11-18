 
import { PageContainer } from "@shared/components/layout/PageContainer";
import { Card } from "@shared/components/ui/Card";
import { Button } from "@shared/components/ui/Button";
import { Input } from "@shared/components/ui/Input";
import { PasswordInput } from "@shared/components/ui/PasswordInput";
import { useAuthStore } from "@features/auth/stores/authStore";
import { authService } from "@features/auth/services/authService";
import { addressService } from "@features/profile/services/addressService";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { FiUser, FiMapPin, FiSave, FiX, FiTrash2, FiAlertTriangle, FiEdit } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

/**
 * ProfilePage - Página de perfil do usuário
 * Permite visualizar e editar informações pessoais e endereço
 */

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser: updateAuthUser, logout, loadUserData: loadAuthUserData } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Carregar dados do usuário ao montar
  useEffect(() => {
    loadUserData();
    loadStates();
    // Forçar reload do authStore para garantir tipo correto
    loadAuthUserData();
  }, []);
  
  // Estado para dados pessoais
  const [personalData, setPersonalData] = useState({
    nome: "",
    sobrenome: "",
    telefone: "",
    email: "",
    foto: "",
    senha: "",
    confirmarSenha: "",
    senhaAtual: ""
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
  const [loadingCep, setLoadingCep] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);

  // Carregar dados do usuário ao montar
  useEffect(() => {
    loadUserData();
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      const response = await fetch('http://localhost:8080/states');
      const data = await response.json();
      setStates(data);
      console.log('📍 Estados carregados:', data);
    } catch (error) {
      console.error('❌ Erro ao carregar estados:', error);
    }
  };

  const loadCitiesByState = async (stateId) => {
    try {
      const response = await fetch(`http://localhost:8080/cities/${stateId}`);
      const data = await response.json();
      setCities(data);
      console.log('🏙️ Cidades carregadas:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao carregar cidades:', error);
      return [];
    }
  };

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
        email: userData.email || "",
        foto: userData.foto || "",
        senha: "",
        confirmarSenha: "",
        senhaAtual: ""
      });
      
      // Buscar endereço do endpoint separado GET /address
      try {
        console.log('🏠 Buscando endereço em GET /address...');
        const addressResponse = await addressService.getAddress();
        console.log('📍 Resposta de GET /address:', addressResponse);
        
        if (addressResponse) {
          const cidadeNome = addressResponse.city || "";
          
          setAddressData({
            id: addressResponse.id || null,
            logradouro: addressResponse.logradouro || "",
            numero: addressResponse.numero || "",
            bairro: addressResponse.bairro || "",
            cep: addressResponse.cep || "",
            cidade: cidadeNome,
            estado: "" // Será preenchido ao encontrar nos estados
          });
          
          // Tentar identificar estado e cidade pelos nomes
          // Precisamos buscar em todos os estados até encontrar a cidade
          if (cidadeNome && states.length > 0) {
            console.log('🔍 Procurando cidade nos estados:', cidadeNome);
            for (const state of states) {
              const citiesData = await loadCitiesByState(state.id);
              const cityFound = citiesData.find(c => 
                c.nome.toLowerCase() === cidadeNome.toLowerCase()
              );
              
              if (cityFound) {
                console.log('✅ Cidade encontrada:', cityFound.nome, 'no estado:', state.uf);
                setSelectedStateId(state.id);
                setSelectedCityId(cityFound.id);
                handleAddressChange('estado', state.uf);
                break;
              }
            }
          }
          
          console.log('✅ Endereço carregado');
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
    
    // Se for CEP e tiver 8 dígitos, buscar automaticamente
    if (field === 'cep') {
      const cleanCep = value.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        handleCepSearch(cleanCep);
      }
    }
  };

  const handleCepSearch = async (cep) => {
    try {
      console.log('🔍 Buscando CEP:', cep);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      
      console.log('✅ CEP encontrado:', data);
      
      // Autocompletar campos
      setAddressData(prev => ({
        ...prev,
        logradouro: data.logradouro || prev.logradouro,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado
      }));
      
      toast.success('CEP encontrado! Endereço preenchido automaticamente.');
    } catch (error) {
      console.error('❌ Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    }
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const formatCep = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  const handleCepChange = async (cep) => {
    const formattedCep = formatCep(cep);
    handleAddressChange('cep', formattedCep);
    
    const cleanCep = cep.replace(/\D/g, '');
    
    // Se o CEP tiver 8 dígitos, buscar no ViaCEP
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        console.log('🔍 Buscando CEP:', cleanCep);
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          toast.error('CEP não encontrado');
          setLoadingCep(false);
          return;
        }
        
        console.log('📍 Dados do ViaCEP:', data);
        
        // Preencher campos automaticamente
        handleAddressChange('logradouro', data.logradouro || '');
        handleAddressChange('bairro', data.bairro || '');
        handleAddressChange('cidade', data.localidade || '');
        handleAddressChange('estado', data.uf || '');
        
        // Buscar estado no backend pelo UF
        const stateFound = states.find(s => s.uf === data.uf);
        if (stateFound) {
          console.log('🗺️ Estado encontrado:', stateFound);
          setSelectedStateId(stateFound.id);
          
          // Carregar cidades desse estado
          const citiesData = await loadCitiesByState(stateFound.id);
          
          // Encontrar a cidade pelo nome
          const cityFound = citiesData.find(c => 
            c.nome.toLowerCase() === data.localidade.toLowerCase()
          );
          
          if (cityFound) {
            console.log('🏙️ Cidade encontrada:', cityFound);
            setSelectedCityId(cityFound.id);
            toast.success('Endereço preenchido automaticamente!');
          } else {
            toast.warning('Cidade não encontrada no sistema. Selecione manualmente.');
          }
        } else {
          toast.warning('Estado não encontrado no sistema.');
        }
        
      } catch (error) {
        console.error('❌ Erro ao buscar CEP:', error);
        toast.error('Erro ao buscar CEP');
      } finally {
        setLoadingCep(false);
      }
    }
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

      // Validar senha se foi preenchida
      if (personalData.senha || personalData.confirmarSenha) {
        if (personalData.senha !== personalData.confirmarSenha) {
          toast.error('As senhas não coincidem');
          setLoading(false);
          return;
        }
        if (personalData.senha.length < 6) {
          toast.error('A senha deve ter no mínimo 6 caracteres');
          setLoading(false);
          return;
        }
      }

      // Exigir que o usuário informe a senha atual para confirmar a atualização
      if (!personalData.senhaAtual) {
        toast.error('Digite sua senha atual para confirmar a atualização');
        setLoading(false);
        return;
      }

      const cleanPhone = personalData.telefone.replace(/\D/g, '');
      
      // Buscar dados completos do usuário para não perder informações
      const currentUserData = await authService.getCurrentUser();
      console.log('📋 Dados atuais completos:', currentUserData);
      
      // Preparar payload: enviar a senha atual para confirmação (`senhaAtual`)
      // e enviar `senha` somente se o usuário informou uma nova senha.
      const updateData = {
        nome: personalData.nome,
        sobrenome: personalData.sobrenome,
        email: currentUserData.email, // Não pode ser alterado
        telefone: cleanPhone,
        foto: personalData.foto || currentUserData.foto || "",
        userTypeId: currentUserData.userTypeId,
        genderId: currentUserData.genderId,
        courseId: currentUserData.courseId,
        // enviar campo compatível com o backend
        rawPassword: personalData.senhaAtual
      };

      if (personalData.senha) {
        updateData.senha = personalData.senha;
      }

      console.log('📤 Enviando para PUT /users:', {
        ...updateData,
        senha: personalData.senha ? '***NOVA SENHA***' : '***SEM ALTERAÇÃO DE SENHA***',
        rawPassword: '***SENHA ATUAL***'
      });
      
      const response = await authService.updateUser(updateData);
      console.log('✅ Resposta do backend:', response);
      
      // Atualizar authStore localmente
      updateAuthUser({
        name: `${personalData.nome} ${personalData.sobrenome}`,
        email: personalData.email,
        foto: personalData.foto || ""
      });
      
      // Recarregar dados do backend para garantir sincronização
      await loadAuthUserData();
      
      toast.success('Dados pessoais atualizados com sucesso!');
      setIsEditingPersonal(false);
      
      // Limpar campos de senha
      setPersonalData(prev => ({
        ...prev,
        senha: "",
        confirmarSenha: "",
        senhaAtual: ""
      }));
      
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

  // Avatar upload handling (preview as data URL)
  const fileInputRef = useRef(null);

  const handleAvatarUploadClick = () => {
    if (!isEditingPersonal) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      handlePersonalChange('foto', ev.target.result);
    };
    reader.readAsDataURL(file);
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

      if (!selectedCityId) {
        toast.error('Cidade não selecionada. Digite um CEP válido para preencher automaticamente.');
        setLoadingAddress(false);
        return;
      }

      const cleanCep = addressData.cep.replace(/\D/g, '');
      
      // Preparar dados para envio (UserAddressesDTO)
      const updateData = {
        cityId: selectedCityId, // Usando o ID correto da cidade
        logradouro: addressData.logradouro,
        numero: addressData.numero,
        bairro: addressData.bairro,
        cep: cleanCep
      };

      console.log('📤 Enviando para PUT /address/' + addressData.id);
      console.log('📦 Payload:', JSON.stringify(updateData, null, 2));
      console.log('🏙️ Cidade ID:', selectedCityId);
      console.log('🗺️ Estado ID:', selectedStateId);
      
      const response = await addressService.updateAddress(addressData.id, updateData);
      console.log('✅ Resposta do backend:', response);
      
      toast.success('Endereço atualizado com sucesso!');
      setIsEditingAddress(false);
      await loadUserData();
    } catch (error) {
      console.error('❌ Erro ao atualizar endereço:', error);
      console.error('❌ Response completo:', error.response);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Message:', error.message);
      
      const errorMsg = error.response?.data?.message 
        || error.response?.data?.error
        || error.message
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

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      
      // Chamar endpoint de exclusão de conta (ajuste conforme seu backend)
      await authService.deleteAccount();
      
      toast.success('Conta excluída com sucesso');
      
      // Fazer logout e redirecionar
      logout();
      navigate('/login');
    } catch (error) {
      console.error('❌ Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta. Tente novamente.');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <PageContainer
      title="Meu Perfil"
      description="Visualize e edite suas informações pessoais"
      centerTitle
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Card: Informações Pessoais */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Coluna esquerda: avatar e ações */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {personalData.foto ? (
                  <img 
                    src={personalData.foto} 
                    alt="Foto de perfil" 
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md text-white text-3xl font-bold">
                    {personalData.nome && personalData.sobrenome
                      ? `${personalData.nome.charAt(0)}${personalData.sobrenome.charAt(0)}`.toUpperCase()
                      : <FiUser className="w-12 h-12" />
                    }
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

                {!isEditingPersonal && (
                  <button
                    onClick={() => setIsEditingPersonal(true)}
                    className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-sm"
                    title="Editar perfil"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold">{personalData.nome} {personalData.sobrenome}</p>
                <p className="text-sm text-gray-500">{personalData.email}</p>
              </div>

              {isEditingPersonal && (
                <div className="flex flex-col w-full gap-2">
                  <Button onClick={handleAvatarUploadClick} size="sm">Alterar Foto</Button>
                  <Button variant="outline" size="sm" onClick={() => handlePersonalChange('foto', '')}>Remover Foto</Button>
                </div>
              )}
            </div>

            {/* Coluna direita: título, ações e formulário */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
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
                  <div className="w-20" />
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foto (URL)
                  </label>
                  <Input 
                    value={personalData.foto} 
                    onChange={(e) => handlePersonalChange('foto', e.target.value)}
                    disabled={!isEditingPersonal}
                    placeholder="https://images.unsplash.com/photo-xxx/image.jpg"
                    type="url"
                  />
                  <div className="text-xs mt-1 space-y-1">
                    {personalData.foto ? (
                      <p className="text-green-600">✓ URL da foto configurada</p>
                    ) : (
                      <p className="text-gray-500">Insira a URL direta de uma imagem</p>
                    )}
                    {isEditingPersonal && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                        <p className="text-blue-700 font-medium">💡 Como obter URL de imagem:</p>
                        <ul className="text-blue-600 text-xs mt-1 space-y-1 ml-4 list-disc">
                          <li>No Unsplash: clique com botão direito na imagem → "Copiar endereço da imagem"</li>
                          <li>A URL deve terminar com .jpg, .png, .webp, etc.</li>
                          <li>Exemplo correto: https://images.unsplash.com/photo-123/image.jpg</li>
                          <li>❌ Não use URLs de páginas (sem .jpg no final)</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Campos de senha - só aparecem se estiver editando */}
                {isEditingPersonal && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha atual (obrigatória)
                      </label>
                      <PasswordInput
                        value={personalData.senhaAtual}
                        onChange={(e) => handlePersonalChange('senhaAtual', e.target.value)}
                        placeholder="Digite sua senha atual"
                        autoComplete="current-password"
                      />
                      <p className="text-xs text-gray-500 mt-1">Para confirmar as alterações, informe sua senha atual.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nova Senha (opcional)
                      </label>
                      <PasswordInput
                        value={personalData.senha} 
                        onChange={(e) => handlePersonalChange('senha', e.target.value)}
                        placeholder="Deixe em branco para manter a atual"
                        autoComplete="new-password"
                      />
                      <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Nova Senha
                      </label>
                      <PasswordInput
                        value={personalData.confirmarSenha} 
                        onChange={(e) => handlePersonalChange('confirmarSenha', e.target.value)}
                        placeholder="Repita a nova senha"
                        autoComplete="new-password"
                      />
                    </div>
                  </>
                )}
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
                  CEP {loadingCep && <span className="text-blue-600 text-xs ml-2">🔍 Buscando...</span>}
                </label>
                <Input 
                  value={addressData.cep} 
                  onChange={(e) => handleCepChange(e.target.value)}
                  disabled={!isEditingAddress || loadingCep}
                  placeholder="00000-000"
                  maxLength={9}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite o CEP completo para autocompletar o endereço
                </p>
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

              {/* Estado - Select editável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                {isEditingAddress ? (
                  <select
                    value={selectedStateId || ''}
                    onChange={async (e) => {
                      const stateId = Number(e.target.value);
                      setSelectedStateId(stateId);
                      setSelectedCityId(null);
                      
                      // Buscar nome do estado
                      const state = states.find(s => s.id === stateId);
                      if (state) {
                        handleAddressChange('estado', state.uf);
                        // Carregar cidades desse estado
                        await loadCitiesByState(stateId);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um estado</option>
                    {states.map(state => (
                      <option key={state.id} value={state.id}>
                        {state.uf} - {state.nome}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input 
                    value={addressData.estado} 
                    disabled
                    className="bg-gray-50"
                  />
                )}
              </div>

              {/* Cidade - Select editável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                {isEditingAddress ? (
                  <select
                    value={selectedCityId || ''}
                    onChange={(e) => {
                      const cityId = Number(e.target.value);
                      setSelectedCityId(cityId);
                      
                      // Buscar nome da cidade
                      const city = cities.find(c => c.id === cityId);
                      if (city) {
                        handleAddressChange('cidade', city.nome);
                      }
                    }}
                    disabled={!selectedStateId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Selecione uma cidade</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>
                        {city.nome}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input 
                    value={addressData.cidade} 
                    disabled
                    className="bg-gray-50"
                  />
                )}
                {isEditingAddress && !selectedStateId && (
                  <p className="text-xs text-amber-600 mt-1">Selecione um estado primeiro</p>
                )}
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
                  <strong>💡 Dica:</strong> Você pode digitar o CEP para preencher automaticamente, 
                  ou selecionar Estado e Cidade manualmente nos campos acima.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Card de Zona de Perigo */}
        <Card className="p-6 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <FiAlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-red-600">Zona de Perigo</h2>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800 mb-2">
              <strong>⚠️ Atenção:</strong> Esta ação é irreversível!
            </p>
            <p className="text-sm text-red-700">
              Ao excluir sua conta, todos os seus dados serão permanentemente removidos, 
              incluindo histórico de caronas, veículos cadastrados e informações pessoais.
            </p>
          </div>

          <Button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <FiTrash2 className="w-4 h-4 mr-2" />
            Excluir minha conta
          </Button>
        </Card>

      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <FiAlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Confirmar Exclusão</h3>
                <p className="text-sm text-gray-600">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 mb-2">
                Você tem certeza que deseja excluir sua conta?
              </p>
              <p className="text-sm text-red-700 font-semibold">
                Todos os seus dados serão permanentemente removidos.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Excluindo...' : 'Sim, excluir conta'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

export default ProfilePage;
