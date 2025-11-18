export function normalizeRequest(r) {
  if (!r || typeof r !== 'object') return r;

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
    // DTOs
    originDTO: r.originDTO || r.originDto || r.origin || r.origem || null,
    destinationDTO: r.destinationDTO || r.destinationDto || r.destination || r.destino || null,
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
