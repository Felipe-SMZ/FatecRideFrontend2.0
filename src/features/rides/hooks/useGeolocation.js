// features/map/hooks/useGeolocation.js
import { useState } from 'react';
import api from '@shared/lib/api';
import { toast } from 'react-hot-toast';

export function useGeolocation() {
    const [isLoading, setIsLoading] = useState(false);

    const searchLocation = async (address) => {
        if (!address.trim()) {
            toast.error('Endereço não pode estar vazio');
            return null;
        }

        try {
            setIsLoading(true);
            const { data } = await api.get('/local', {
                params: { local: address }
            });

            if (!data || !data.lat || !data.lon) {
                toast.error('Localização não encontrada');
                return null;
            }

            return {
                coords: {
                    lat: parseFloat(data.lat),
                    lon: parseFloat(data.lon)
                },
                address: {
                    cidade: data.cidade || data.address?.city || '',
                    logradouro: data.logradouro || data.address?.road || '',
                    numero: data.numero || '',
                    bairro: data.bairro || data.address?.suburb || '',
                    cep: data.cep || data.address?.postcode || ''
                },
                displayName: data.display_name
            };
        } catch (error) {
            console.error('Erro ao buscar localização:', error);
            toast.error('Erro ao buscar localização');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const searchCEP = async (cep) => {
        try {
            const cleanCEP = cep.replace(/\D/g, '');
            if (cleanCEP.length !== 8) {
                toast.error('CEP inválido');
                return null;
            }

            const { data } = await api.get(`/cep/${cleanCEP}`);
            return data;
        } catch (error) {
            toast.error('CEP não encontrado');
            return null;
        }
    };

    return {
        searchLocation,
        searchCEP,
        isLoading
    };
}