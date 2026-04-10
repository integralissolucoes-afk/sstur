const EMPRESA_FIXA = {
  empresa_nome: 'SUA EMPRESA DE TRANSPORTE',
  empresa_documento: '00.000.000/0001-00',
  empresa_endereco: 'Seu endereço aqui',
  empresa_telefone: '(85) 00000-0000',
  foro_cidade: 'Fortaleza/CE',
  cidade_assinatura: 'Fortaleza/CE'
};

let previewAtual = '';

(async function () {
  await requireAuth();
  await carregarAgendamentosParaContrato();
  await listarContratos();
})();

function preencherModelo(template, dados) {
  return template.replace(/\{\{(.*?)\}\}/g, (_, chave) => {
    const key = chave.trim();
    return dados[key] ?? `{{${key}}}`;
  });
}

function gerarNumeroContrato(id) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  return `${ano}-${String(id).padStart(5, '0')}`;
}

async function carregarAgendamentosParaContrato() {
  const { data } = await supabaseClient
    .from('agendamentos')
    .select('id,destino,data_saida,clientes(nome),veiculos(nome)')
    .order('id', { ascending: false });

  document.getElementById('agendamento_id').innerHTML = (data || []).map(a => `
    <option value="${a.id}">
      #${a.id} - ${a.clientes?.nome || ''} - ${a.destino} - ${a.data_saida}
    </option>
  `).join('');
}

async function listarContratos() {
  const { data } = await supabaseClient
    .from('contratos')
    .select('id,numero_contrato,status_assinatura,created_at,agendamento_id')
    .order('id', { ascending: false });

  document.getElementById('tbContratos').innerHTML = (data || []).map(c => `
    <tr>
      <td>${c.numero_contrato}</td>
      <td>#${c.agendamento_id}</td>
      <td>${c.status_assinatura}</td>
      <td>${new Date(c.created_at).toLocaleString('pt-BR')}</td>
    </tr>
  `).join('');
}

async function buscarDadosContrato(agendamentoId) {
  const { data: modelo, error: em } = await supabaseClient
    .from('modelos_contrato')
    .select('*')
    .eq('ativo', true)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (em) throw em;

  const { data: agendamento, error: ea } = await supabaseClient
    .from('agendamentos')
    .select('*, clientes(*), veiculos(*)')
    .eq('id', agendamentoId)
    .single();

  if (ea) throw ea;

  return { modelo, agendamento };
}

document.getElementById('btnGerar')?.addEventListener('click', async () => {
  const agendamentoId = Number(document.getElementById('agendamento_id').value);

  try {
    const { modelo, agendamento } = await buscarDadosContrato(agendamentoId);
    const numeroContrato = gerarNumeroContrato(agendamento.id);

    const dados = {
      ...EMPRESA_FIXA,
      numero_contrato: numeroContrato,
      cliente_nome: agendamento.clientes?.nome || '',
      cliente_documento: agendamento.clientes?.cpf_cnpj || '',
      cliente_endereco: agendamento.clientes?.endereco || '',
      cliente_telefone: agendamento.clientes?.telefone || '',
      local_saida: agendamento.local_saida || '',
      data_saida: agendamento.data_saida || '',
      hora_saida: agendamento.hora_saida || '',
      destino: agendamento.destino || '',
      local_retorno: agendamento.local_retorno || '',
      data_retorno: agendamento.data_retorno || '',
      hora_retorno: agendamento.hora_retorno || '',
      quantidade_passageiros: agendamento.quantidade_passageiros || '',
      veiculo_nome: agendamento.veiculos?.nome || '',
      veiculo_placa: agendamento.veiculos?.placa || '',
      veiculo_capacidade: agendamento.veiculos?.capacidade || '',
      valor_total: Number(agendamento.valor || 0).toFixed(2),
      forma_pagamento: agendamento.forma_pagamento || '',
      observacoes: agendamento.observacoes || '',
      data_emissao: new Date().toLocaleDateString('pt-BR')
    };

    previewAtual = preencherModelo(modelo.conteudo, dados);
    document.getElementById('previewContrato').textContent = previewAtual;

    const { error } = await supabaseClient.from('contratos').insert({
      numero_contrato: numeroContrato,
      agendamento_id: agendamento.id,
      modelo_id: modelo.id,
      conteudo_final: previewAtual,
      status_assinatura: 'pendente'
    });

    if (error && !String(error.message).includes('duplicate')) {
      throw error;
    }

    await listarContratos();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('btnImprimir')?.addEventListener('click', () => {
  if (!previewAtual) {
    alert('Gere um contrato antes.');
    return;
  }

  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head><title>Contrato</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px; white-space: pre-wrap;">${previewAtual}</body>
    </html>
  `);
  win.document.close();
  win.print();
});
