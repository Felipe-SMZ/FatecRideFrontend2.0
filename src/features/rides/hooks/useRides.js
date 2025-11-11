// features/rides/hooks/useRides.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ridesService } from '../services/ridesService';
import { toast } from 'react-hot-toast';

// Hook para buscar caronas ativas
export function useActiveRides() {
    return useQuery({
        queryKey: ['rides', 'active'],
        queryFn: ridesService.getActive,
        staleTime: 2 * 60 * 1000, // 2 minutos
        retry: 2
    });
}

// Hook para criar carona
export function useCreateRide() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ridesService.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['rides']);
            toast.success('Carona criada com sucesso!');
        },
        onError: (error) => {
            toast.error(error.message || 'Erro ao criar carona');
        }
    });
}

// Hook para cancelar carona
export function useCancelRide() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ridesService.cancel,
        onSuccess: () => {
            queryClient.invalidateQueries(['rides']);
            toast.success('Carona cancelada com sucesso!');
        },
        onError: (error) => {
            toast.error(error.message || 'Erro ao cancelar carona');
        }
    });
}

// Hook para histórico com paginação
export function useRideHistory(page = 0, type = 'motorista') {
    return useQuery({
        queryKey: ['rides', 'history', type, page],
        queryFn: () => ridesService.getHistory(page, 5),
        keepPreviousData: true // Mantém dados anteriores durante loading
    });
}