export function normalizeRequest(r) {
  if (!r || typeof r !== 'object') return r;

  // Extrair endereços dos DTOs
  const getAddressString = (dto) => {
    if (!dto) return null;
    if (typeof dto === 'string') return dto;
    
    const parts = [];
    if (dto.logradouro) parts.push(dto.logradouro);
    if (dto.numero) parts.push(dto.numero);
    if (dto.bairro) parts.push(dto.bairro);
    if (dto.cidade) parts.push(dto.cidade);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const originDTO = r.originDTO || r.originDto || r.origin || r.origem;
  const destinationDTO = r.destinationDTO || r.destinationDto || r.destination || r.destino;

  return {
    // ids
    id: r.id || r.id_solicitacao || r.idSolicitacao || null,
    id_solicitacao: r.id_solicitacao || r.id || r.idSolicitacao || null,
    id_carona: r.id_carona || r.idCarona || null,
    // motorista
    nome_motorista: r.nome_motorista || r.nomeMotorista || r.nome || r.driverName || null,
    curso_motorista: r.curso_motorista || r.cursoMotorista || r.curso || null,
    foto: r.foto || r.photo || null,
    // passageiro
    nome_passageiro: r.nome_passageiro || r.nomePassageiro || r.nome_passageiro || r.nome || null,
    curso_passageiro: r.curso_passageiro || r.cursoPassageiro || r.curso || null,
    foto_passageiro: r.foto_passageiro || r.fotoPassageiro || r.foto || null,
    // status
    status: r.status || r.situacao || null,
    id_status_solicitacao: r.id_status_solicitacao || r.idStatusSolicitacao || r.statusId || null,
    // endereços extraídos dos DTOs
    origem: getAddressString(originDTO),
    destino: getAddressString(destinationDTO),
    // DTOs originais
    originDTO: originDTO || null,
    destinationDTO: destinationDTO || null,
    // dados de timing
    data_carona: r.data_carona || r.dataCarona || r.data_hora || r.dataHora || null,
    data_hora: r.data_hora || r.dataHora || r.data_carona || r.dataCarona || null,
    // veiculo
    veiculo_marca: r.veiculo_marca || r.veiculoMarca || r.marca || null,
    veiculo_modelo: r.veiculo_modelo || r.veiculoModelo || r.modelo || null,
    veiculo_cor: r.veiculo_cor || r.veiculoCor || r.cor || null,
    veiculo_placa: r.veiculo_placa || r.veiculoPlaca || r.placa || null,
    // preserve original raw payload
    __raw: r
  };
}

export default normalizeRequest;
