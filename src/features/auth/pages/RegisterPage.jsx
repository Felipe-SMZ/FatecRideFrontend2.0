import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@shared/components/ui/Input";
import { Button } from "@shared/components/ui/Button";
import { Select } from "@shared/components/ui/Select";
import { Alert } from "@shared/components/ui/Alert";
import { Card } from "@shared/components/ui/Card";
import { authService } from "../services/authService";

/**
 * RegisterPage - Página de criação de nova conta
 * 
 * Formulário com validação de confirmação de senha usando refine do Zod.
 * Permite escolher entre PASSAGEIRO e MOTORISTA no momento do cadastro.
 * Redireciona para login após sucesso com mensagem informativa.
 */

// Schema com validação customizada para confirmar senha
const registerSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  sobrenome: z.string().min(3, "Sobrenome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .transform((val) => val.replace(/\D/g, '')), // Remove não-dígitos
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string(),
  userTypeId: z.string().min(1, "Selecione um tipo"),
  genderId: z.string().min(1, "Selecione um gênero"),
  courseId: z.string().min(1, "Selecione um curso"),
}).refine((data) => data.senha === data.confirmarSenha, {
  // refine valida campos interdependentes
  message: "As senhas não coincidem",
  path: ["confirmarSenha"], // Erro aparece no campo confirmarSenha
});

// Função para formatar telefone
const formatPhone = (value) => {
  if (!value) return value;
  
  // Remove tudo que não é dígito
  const phoneNumber = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedNumber = phoneNumber.slice(0, 11);
  
  // Formata: (11) 99999-9999
  if (limitedNumber.length <= 2) {
    return limitedNumber;
  } else if (limitedNumber.length <= 6) {
    return `(${limitedNumber.slice(0, 2)}) ${limitedNumber.slice(2)}`;
  } else if (limitedNumber.length <= 10) {
    return `(${limitedNumber.slice(0, 2)}) ${limitedNumber.slice(2, 6)}-${limitedNumber.slice(6)}`;
  } else {
    return `(${limitedNumber.slice(0, 2)}) ${limitedNumber.slice(2, 7)}-${limitedNumber.slice(7)}`;
  }
};

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userTypeId = location.state?.userTypeId || 1; // Manter original
  
  console.log('🔍 [RegisterPage] Inicialização');
  console.log('  📌 userTypeId recebido:', userTypeId, typeof userTypeId);
  console.log('  📌 location.state:', location.state);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [genders, setGenders] = useState([]);
  const [courses, setCourses] = useState([]);
  const [phoneValue, setPhoneValue] = useState("");

  // Buscar gêneros e cursos ao montar
  useEffect(() => {
    console.log('🔄 [useEffect] Carregando gêneros e cursos...');
    
    const fetchData = async () => {
      try {
        const [gendersRes, coursesRes] = await Promise.all([
          fetch('http://localhost:8080/genders').then(r => r.json()),
          fetch('http://localhost:8080/courses').then(r => r.json())
        ]);
        
        console.log('✅ Gêneros carregados:', gendersRes);
        console.log('✅ Cursos carregados:', coursesRes);
        
        setGenders(gendersRes);
        setCourses(coursesRes);
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      }
    };
    fetchData();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: "",
      sobrenome: "",
      email: "",
      telefone: "",
      senha: "",
      confirmarSenha: "",
      userTypeId: String(userTypeId), // Converter para string para o Zod
      genderId: "",
      courseId: "",
    }
  });
  
  console.log('📋 [RegisterPage] Valores padrão do formulário:', {
    userTypeId: String(userTypeId),
    tipo: typeof String(userTypeId)
  });

  const onSubmit = async (data) => {
    console.log('\n🚀 === FORMULÁRIO SUBMETIDO ===');
    console.log('📦 Dados recebidos do form:', data);
    console.log('  └─ Tipos:', Object.keys(data).reduce((acc, key) => {
      acc[key] = typeof data[key];
      return acc;
    }, {}));
    
    try {
      setLoading(true);
      setError("");
      
      // Remove formatação do telefone antes de salvar
      const cleanPhone = data.telefone.replace(/\D/g, '');
      
      console.log('🔧 Processando dados:');
      console.log('  📞 Telefone original:', data.telefone);
      console.log('  📞 Telefone limpo:', cleanPhone);
      
      // NÃO enviar para o backend ainda - apenas salvar no localStorage
      // O backend exige endereço junto com o cadastro
      const userData = {
        nome: data.nome,
        sobrenome: data.sobrenome,
        email: data.email,
        senha: data.senha,
        telefone: cleanPhone,
        foto: "",
        userTypeId: Number(data.userTypeId),
        genderId: Number(data.genderId),
        courseId: Number(data.courseId),
      };
      
      console.log('� Salvando dados temporários no localStorage...');
      console.log('� userData:', userData);
      
      // Salvar temporariamente no localStorage
      localStorage.setItem('tempUserData', JSON.stringify(userData));
      
      console.log('✅ Dados salvos! Redirecionando para cadastro de endereço...');
      console.log('➡️  /cadastro-endereco');
      
      // Redireciona para cadastro de endereço
      // Passa o userTypeId para saber se precisa cadastrar veículo depois
      navigate("/cadastro-endereco", {
        state: { 
          message: "Agora cadastre seu endereço.",
          userTypeId: Number(data.userTypeId)
        },
      });
    } catch (err) {
      console.error('\n❌ === ERRO ===');
      console.error('🔴 Erro:', err);
      setError("Erro ao processar dados. Tente novamente.");
    } finally {
      setLoading(false);
      console.log('🏁 Finalizou processamento (loading = false)\n');
    }
  };
  
  // Log para detectar erros de validação
  const onError = (errors) => {
    console.log('\n⚠️  === ERROS DE VALIDAÇÃO ===');
    console.log('📝 Erros do formulário:', errors);
    console.log('📊 Campos com erro:', Object.keys(errors));
    
    // Detalhar cada erro
    Object.keys(errors).forEach(field => {
      console.log(`  ❌ ${field}:`, {
        mensagem: errors[field].message,
        tipo: errors[field].type,
        valor_esperado: errors[field].ref?.value
      });
    });
    
    setError("Por favor, corrija os erros no formulário antes de continuar.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 py-12">
      <Card className="w-full max-w-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-fatecride-blue">Cadastro de Usuário</h1>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
          <div className="bg-white p-6 rounded-xl space-y-4 border-2 border-fatecride-blue/20 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-fatecride-blue text-white flex items-center justify-center font-bold">1</div>
              <h3 className="font-bold text-fatecride-blue text-lg">Dados Pessoais</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nome"
                placeholder="Seu nome"
                error={errors.nome?.message}
                {...register("nome")}
              />

              <Input
                label="Sobrenome"
                placeholder="Seu sobrenome"
                error={errors.sobrenome?.message}
                {...register("sobrenome")}
              />
            </div>

            <Input
              label="Email Institucional"
              type="email"
              placeholder="seu.nome@fatec.sp.gov.br"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              error={errors.telefone?.message}
              {...register("telefone", {
                onChange: (e) => {
                  const formatted = formatPhone(e.target.value);
                  e.target.value = formatted;
                  setPhoneValue(formatted);
                }
              })}
              value={phoneValue}
            />
          </div>

          <div className="bg-white p-6 rounded-xl space-y-4 border-2 border-fatecride-blue/20 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-fatecride-blue text-white flex items-center justify-center font-bold">2</div>
              <h3 className="font-bold text-fatecride-blue text-lg">Informações Acadêmicas</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Gênero"
                error={errors.genderId?.message}
                {...register("genderId")}
                options={genders.map(g => ({
                  value: g.id.toString(),
                  label: g.name
                }))}
              />

              <Select
                label="Curso"
                error={errors.courseId?.message}
                {...register("courseId")}
                options={courses.map(c => ({
                  value: c.id.toString(),
                  label: c.name
                }))}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl space-y-4 border-2 border-fatecride-blue/20 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-fatecride-blue text-white flex items-center justify-center font-bold">3</div>
              <h3 className="font-bold text-fatecride-blue text-lg">Segurança</h3>
            </div>
            
            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              error={errors.senha?.message}
              {...register("senha")}
            />

            <Input
              label="Confirmar Senha"
              type="password"
              placeholder="Digite a senha novamente"
              error={errors.confirmarSenha?.message}
              {...register("confirmarSenha")}
            />
          </div>

          {/* Aviso para motoristas */}
          {Number(userTypeId) !== 1 && (
            <div className="bg-blue-50 border-l-4 border-fatecride-blue p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-fatecride-blue" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Atenção Motorista:</strong> Você poderá cadastrar seus veículos após concluir o registro inicial.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            fullWidth 
            disabled={loading} 
            size="lg"
            className="bg-gradient-to-r from-fatecride-blue to-fatecride-blue-dark hover:from-fatecride-blue-dark hover:to-fatecride-blue-darker shadow-lg text-lg py-4"
          >
            {loading ? "Criando conta..." : "Próxima Etapa: Cadastrar Endereço"}
          </Button>
        </form>

        {/* Link de retorno para login */}
        <div className="mt-8 text-center text-sm text-text-secondary border-t border-gray-200 pt-6">
          Já tem conta?{" "}
          <Link to="/login" className="text-fatecride-blue hover:text-fatecride-blue-dark font-semibold transition-colors">
            Fazer login
          </Link>
        </div>
      </Card>
    </div>
  );
}
