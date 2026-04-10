(async function () {
  await requireAuth();

  const [{ count: clientes }, { count: veiculos }, { count: agendamentos }] = await Promise.all([
    supabaseClient.from('clientes').select('*', { count: 'exact', head: true }),
    supabaseClient.from('veiculos').select('*', { count: 'exact', head: true }),
    supabaseClient.from('agendamentos').select('*', { count: 'exact', head: true })
  ]);

  document.getElementById('mClientes').textContent = clientes || 0;
  document.getElementById('mVeiculos').textContent = veiculos || 0;
  document.getElementById('mAgendamentos').textContent = agendamentos || 0;

  const { data } = await supabaseClient
    .from('agendamentos')
    .select(`
      id,
      destino,
      data_saida,
      status,
      clientes(nome),
      veiculos(nome)
    `)
    .order('id', { ascending: false })
    .limit(10);

  const tbody = document.getElementById('tbRecentes');
  tbody.innerHTML = (data || []).map(item => `
    <tr>
      <td>${item.clientes?.nome || ''}</td>
      <td>${item.veiculos?.nome || ''}</td>
      <td>${item.data_saida || ''}</td>
      <td>${item.destino || ''}</td>
      <td>${item.status || ''}</td>
    </tr>
  `).join('');
})();
