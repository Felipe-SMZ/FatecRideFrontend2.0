import { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiLoader } from 'react-icons/fi';

/**
 * AddressAutocomplete - Campo de busca com sugestões do OpenStreetMap
 * 
 * @param {string} label - Rótulo do campo
 * @param {string} value - Valor atual
 * @param {function} onChange - Callback quando valor muda
 * @param {function} onSelect - Callback quando endereço é selecionado
 * @param {string} placeholder - Texto placeholder
 * @param {boolean} disabled - Se o campo está desabilitado
 */
export function AddressAutocomplete({
    label,
    value = '',
    onChange,
    onSelect,
    placeholder = 'Digite para buscar...',
    disabled = false
}) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);
    const timeoutRef = useRef(null);

    // Fecha sugestões ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Busca sugestões com debounce
    useEffect(() => {
        // Limpa timeout anterior
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Se não tem valor, limpa sugestões
        if (!value || value.length < 5) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        // Debounce: aguarda 800ms após parar de digitar
        timeoutRef.current = setTimeout(async () => {
            await searchAddress(value);
        }, 800);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value]);

    /**
     * Busca endereços no OpenStreetMap via backend
     */
    const searchAddress = async (query) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // Busca através do backend (resolve CORS)
            const response = await fetch(
                `http://localhost:8080/local?local=${encodeURIComponent(query)}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                console.log('🗺️ Dados do OSM:', data);
                // Backend retorna apenas 1 resultado, vamos criar array
                setSuggestions([data]);
                setShowSuggestions(true);
            } else {
                console.warn('⚠️ Endereço não encontrado');
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error('Erro ao buscar sugestões:', error);
            setSuggestions([]);
            setShowSuggestions(false);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Formata o display name para ficar mais limpo
     */
    const formatDisplayName = (suggestion) => {
        // Backend retorna estrutura do OSM
        if (suggestion.display_name) {
            const parts = suggestion.display_name.split(',');
            return parts.slice(0, 3).join(',');
        }
        
        // Fallback: montar nome a partir do address
        if (suggestion.address) {
            const parts = [];
            if (suggestion.address.road) parts.push(suggestion.address.road);
            if (suggestion.address.suburb || suggestion.address.neighbourhood) {
                parts.push(suggestion.address.suburb || suggestion.address.neighbourhood);
            }
            if (suggestion.address.city || suggestion.address.town) {
                parts.push(suggestion.address.city || suggestion.address.town);
            }
            return parts.join(', ');
        }
        
        return 'Endereço encontrado';
    };

    /**
     * Extrai cidade do endereço OSM, evitando "county" que retorna região metropolitana
     */
    const extractCidade = (suggestion) => {
        const { address = {}, display_name = '' } = suggestion;
        
        // Primeiro, tentar campos diretos do OSM (SEM county)
        let cidade = address.city || 
                     address.town || 
                     address.village || 
                     address.municipality;
        
        // Se não achou, tentar extrair do display_name
        if (!cidade && display_name) {
            // Display_name format: "Local, Bairro, Cidade, Região, Estado, CEP, País"
            const parts = display_name.split(',').map(p => p.trim());
            
            // Lista de cidades conhecidas da região metropolitana de SP
            const cidadesConhecidas = [
                'São Paulo', 'Cotia', 'Vargem Grande Paulista', 'Taboão da Serra',
                'Osasco', 'Carapicuíba', 'Barueri', 'Santana de Parnaíba',
                'Itapecerica da Serra', 'Embu das Artes', 'Guarulhos', 'Santo André',
                'São Bernardo do Campo', 'São Caetano do Sul', 'Diadema', 'Mauá',
                'Ribeirão Pires', 'Rio Grande da Serra', 'Suzano', 'Mogi das Cruzes',
                'Jandira', 'Itapevi', 'Votorantim', 'Sorocaba', 'Rio de Janeiro'
            ];
            
            // Procurar cidade conhecida no display_name
            for (const part of parts) {
                if (cidadesConhecidas.includes(part)) {
                    cidade = part;
                    break;
                }
            }
            
            // Se não achou cidade conhecida, pegar parte antes do Estado
            if (!cidade && parts.length >= 3) {
                // Procurar índice de "São Paulo" (estado) ou "Rio de Janeiro" (estado)
                const estadoIndex = parts.findIndex((p, idx) => 
                    idx > 2 && (p === 'São Paulo' || p === 'Rio de Janeiro')
                );
                
                // Pegar parte anterior ao estado (provavelmente a cidade)
                if (estadoIndex > 0) {
                    const candidato = parts[estadoIndex - 1];
                    // Evitar pegar "Região Metropolitana" ou similares
                    if (!candidato.includes('Região') && !candidato.includes('Metropolitana')) {
                        cidade = candidato;
                    }
                }
            }
        }
        
        // Fallback final
        return cidade || 'São Paulo';
    };

    /**
     * Quando usuário seleciona uma sugestão
     */
    const handleSelectSuggestion = (suggestion) => {
        const formatted = formatDisplayName(suggestion);
        onChange({ target: { value: formatted } });
        setShowSuggestions(false);
        
        // Chama callback com os dados completos
        if (onSelect) {
            // Extrair cidade de forma inteligente (evita região metropolitana)
            const cidade = extractCidade(suggestion);
            
            // Logradouro
            const logradouro = suggestion.address?.road || 
                              suggestion.address?.footway ||
                              suggestion.address?.path ||
                              'Não especificado';
            
            // Bairro
            const bairro = suggestion.address?.suburb || 
                          suggestion.address?.neighbourhood ||
                          suggestion.address?.quarter ||
                          suggestion.address?.district ||
                          '';
            
            console.log('✅ Endereço extraído:', {
                cidade,
                logradouro,
                bairro,
                display_name: suggestion.display_name
            });
            
            onSelect({
                coords: { 
                    lat: parseFloat(suggestion.lat), 
                    lng: parseFloat(suggestion.lon) 
                },
                address: {
                    cidade: cidade,
                    logradouro: logradouro,
                    numero: suggestion.address?.house_number || 'S/N',
                    bairro: bairro,
                    cep: suggestion.address?.postcode || ''
                },
                fullData: suggestion
            });
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}

            {/* Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {loading ? (
                        <FiLoader className="h-5 w-5 text-gray-400 animate-spin" />
                    ) : (
                        <FiMapPin className="h-5 w-5 text-gray-400" />
                    )}
                </div>
                
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
                        w-full pl-10 pr-4 py-2.5 
                        border-2 border-gray-300 rounded-lg
                        focus:border-fatecride-blue focus:ring-2 focus:ring-fatecride-blue focus:ring-opacity-20
                        disabled:bg-gray-100 disabled:cursor-not-allowed
                        transition-colors
                    `}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                />
            </div>

            {/* Sugestões */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={suggestion.place_id || index}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                        >
                            <div className="flex items-start gap-3">
                                <FiMapPin className="w-5 h-5 text-fatecride-blue mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {formatDisplayName(suggestion)}
                                    </p>
                                    {suggestion.address && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {[
                                                suggestion.address.suburb || suggestion.address.neighbourhood,
                                                suggestion.address.city || suggestion.address.town || 'São Paulo',
                                                suggestion.address.state || 'SP'
                                            ].filter(Boolean).join(' - ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Hint */}
            <p className="mt-1 text-xs text-gray-500">
                Digite pelo menos 5 caracteres (ex: "Terminal Cotia")
            </p>
        </div>
    );
}
