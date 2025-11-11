import { useState } from "react";
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
  telefone: z.string().min(10, "Telefone inválido (ex: 11999999999)"),
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

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userTypeId = location.state?.userTypeId || "1"; // Default: Passageiro
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [genders, setGenders] = useState([]);
  const [courses, setCourses] = useState([]);

  // Buscar gêneros e cursos ao montar
  useState(() => {
    const fetchData = async () => {
      try {
        const [gendersRes, coursesRes] = await Promise.all([
          fetch('http://localhost:8080/genders').then(r => r.json()),
          fetch('http://localhost:8080/courses').then(r => r.json())
        ]);
        setGenders(gendersRes);
        setCourses(coursesRes);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
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
      userTypeId,
    }
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");
      
      const payload = {
        nome: data.nome,
        sobrenome: data.sobrenome,
        email: data.email,
        senha: data.senha,
        telefone: data.telefone,
        foto: "",
        userTypeId: Number(data.userTypeId),
        genderId: Number(data.genderId),
        courseId: Number(data.courseId),
        userAddressesDTO: null
      };
      
      await authService.register(payload);
      
      // Redireciona para login com mensagem via state
      navigate("/login", {
        state: { message: "Cadastro realizado! Faça login para continuar." },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="text-gray-600 mt-2">Preencha seus dados para começar</p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")} className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            label="Email"
            type="email"
            placeholder="seu@email.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Telefone"
            type="tel"
            placeholder="11999999999"
            error={errors.telefone?.message}
            {...register("telefone")}
          />

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
                label: c.nome
              }))}
            />
          </div>

          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            error={errors.senha?.message}
            {...register("senha")}
          />

          <Input
            label="Confirmar senha"
            type="password"
            placeholder="Digite a senha novamente"
            error={errors.confirmarSenha?.message}
            {...register("confirmarSenha")}
          />

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        {/* Link de retorno para login */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Já tem conta?{" "}
          <Link to="/login" className="text-red-600 hover:text-red-700 font-medium">
            Fazer login
          </Link>
        </div>
      </Card>
    </div>
  );
}
