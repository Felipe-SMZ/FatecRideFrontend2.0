import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesService } from "../services/vehiclesService";

/**
 * useVehicles - Hook customizado para gerenciar estado de veículos
 * 
 * Encapsula React Query para cache automático e sincronização.
 * Mutations invalidam cache automaticamente para manter dados atualizados.
 */

const VEHICLES_KEY = ["vehicles"];

export function useVehicles() {
  const queryClient = useQueryClient();

  /**
   * Query para listagem de veículos
   * staleTime: 5min - dados considerados "frescos" por esse período
   */
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: VEHICLES_KEY,
    queryFn: vehiclesService.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  /**
   * Mutation para criar veículo
   * onSuccess invalida cache para recarregar lista automaticamente
   */
  const createMutation = useMutation({
    mutationFn: vehiclesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLES_KEY });
    },
  });

  /**
   * Mutation para atualizar veículo
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => vehiclesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLES_KEY });
    },
  });

  /**
   * Mutation para deletar veículo
   */
  const deleteMutation = useMutation({
    mutationFn: vehiclesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLES_KEY });
    },
  });

  return {
    vehicles: vehicles || [],
    isLoading,
    error,
    createVehicle: createMutation.mutateAsync,
    updateVehicle: updateMutation.mutateAsync,
    deleteVehicle: deleteMutation.mutateAsync,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
  };
}

/**
 * useVehicle - Hook para buscar veículo individual
 * Útil para páginas de detalhes ou edição
 */
export function useVehicle(id) {
  return useQuery({
    queryKey: [...VEHICLES_KEY, id],
    queryFn: () => vehiclesService.getById(id),
    enabled: !!id, // Só executa se id existir
  });
}
