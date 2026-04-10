(async function () {
  await requireAuth();
  await carregarSelects();
  await carregarAgendamentos();
})();

async function carregarSelects() {
  const [{ data: clientes }, { data: veiculos }] = await Promise.all([
    supabaseClient.from('clientes').select('id,nome').order('nome'),
    supabaseClient.from('veiculos').select('id,nome,status,capacidade').order('nome')
  ]);

  document.getElementById('cliente_id').innerHTML = (clientes || [])
    .map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

  document.getElementById('veiculo_id').innerHTML = (veiculos || [])
    .filter(v => v.status === 'ativo')
    .map(v => `<option value="${v.id}" data-capacidade="${v.capacidade || 0}">${v.nome}</option>`).join('');
}

async function carregarAgendamentos() {
  const { data, error } = await supabaseClient
    .from('agendamentos')
    .select(`
      id,
      data_saida,
      destino,
      quantidade_passageiros,
      valor,
      status,
      clientes(nome),
      veiculos(nome)
    `)
    .order('id', { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  document.getElementById('tbAgendamentos').innerHTML = (data || []).map(a => `
    <tr>
      <td>${a.clientes?.nome || ''}</td>
      <td>${a.veiculos?.nome || ''}</td>
      <td>${a.data_saida || ''}</td>
      <td>${a.destino || ''}</td>
      <td>${a.quantidade_passageiros || 0}</td>
      <td>R$ ${Number(a.valor || 0).toFixed(2)}</td>
      <td>${a.status || ''}</td>
    </tr>
  `).join('');
}

async function verificarConflitoVeiculo(veiculoId, dataSaida, dataRetorno) {
  const fim = dataRetorno || dataSaida;
  const { data, error } = await supabaseClient
    .from('agendamentos')
    .select('id,data_saida,data_retorno,status')
    .eq('veiculo_id', veiculoId)
    .neq('status', 'cancelado');

  if (error) throw error;

  return (data || []).some(item => {
    const inicioExistente = item.data_saida;
    const fimExistente = item.data_retorno || item.data_saida;
    return !(fim < inicioExistente || dataSaida > fimExistente);
  });
}

document.getElementById('agendamentoForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const veiculoSelect = document.getElementById('veiculo_id');
  const capacidade = Number(veiculoSelect.options[veiculoSelect.selectedIndex]?.dataset.capacidade || 0);
  const passageiros = Number(document.getElementById('quantidade_passageiros').value || 0);

  if (capacidade && passageiros > capacidade) {
    alert('A quantidade de passageiros excede a capacidade do veículo.');
    return;
  }

  const veiculo_id = Number(document.getElementById('veiculo_id').value);
  const data_saida = document.getElementById('data_saida').value;
  const data_retorno = document.getElementById('data_retorno').value;

  const conflito = await verificarConflitoVeiculo(veiculo_id, data_saida, data_retorno);
  if (conflito) {
    alert('Esse veículo já possui reserva para esse período.');
    return;
  }

  const payload = {
    cliente_id: Number(document.getElementById('cliente_id').value),
    veiculo_id,
    data_saida,
    hora_saida: document.getElementById('hora_saida').value,
    local_saida: document.getElementById('local_saida').value.trim(),
    destino: document.getElementById('destino').value.trim(),
    data_retorno: data_retorno || null,
    hora_retorno: document.getElementById('hora_retorno').value || null,
    local_retorno: document.getElementById('local_retorno').value.trim() || null,
    quantidade_passageiros: passageiros,
    valor: Number(document.getElementById('valor').value || 0),
    forma_pagamento: document.getElementById('forma_pagamento').value.trim(),
    observacoes: document.getElementById('observacoes').value.trim(),
    status: document.getElementById('status').value
  };

  const { error } = await supabaseClient.from('agendamentos').insert(payload);
  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  await carregarAgendamentos();
});
