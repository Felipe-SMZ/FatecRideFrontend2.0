// shared/utils/validators.js - Schemas Zod reutilizáveis
import { z } from 'zod';

export const emailSchema = z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase();

export const senhaSchema = z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha muito longa');

export const telefoneSchema = z
    .string()
    .min(10, 'Telefone inválido')
    .regex(/^\d+$/, 'Telefone deve conter apenas números');

export const placaSchema = z
    .string()
    .regex(/^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/, 'Placa inválida (formato: ABC1D23)');

export const cepSchema = z
    .string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido');

// Schemas completos
export const loginSchema = z.object({
    email: emailSchema,
    senha: senhaSchema
});

export const registerSchema = z.object({
    nome: z.string().min(2, 'Nome muito curto'),
    sobrenome: z.string().min(2, 'Sobrenome muito curto'),
    email: emailSchema,
    emailConfirmacao: emailSchema,
    senha: senhaSchema,
    senhaConfirmacao: senhaSchema,
    telefone: telefoneSchema,
    courseId: z.number().min(1, 'Selecione um curso'),
    genderId: z.number().min(1, 'Selecione um gênero'),
    foto: z.string().url('URL inválida').optional().or(z.literal(''))
}).refine(data => data.email === data.emailConfirmacao, {
    message: 'Os emails não coincidem',
    path: ['emailConfirmacao']
}).refine(data => data.senha === data.senhaConfirmacao, {
    message: 'As senhas não coincidem',
    path: ['senhaConfirmacao']
});

export const vehicleSchema = z.object({
    marca: z.string().min(2, 'Marca inválida'),
    modelo: z.string().min(2, 'Modelo inválido'),
    placa: placaSchema,
    cor: z.string().min(2, 'Cor inválida'),
    ano: z.number()
        .min(1900, 'Ano inválido')
        .max(new Date().getFullYear(), 'Ano não pode ser futuro'),
    vagas_disponiveis: z.number().min(1).max(10)
});