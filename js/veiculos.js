(async function () {
  await requireAuth();
  await carregarVeiculos();
})();

async function carregarVeiculos() {
  const { data, error } = await supabaseClient
    .from('veiculos')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  document.getElementById('tbVeiculos').innerHTML = (data || []).map(v => `
    <tr>
      <td>${v.nome || ''}</td>
      <td>${v.placa || ''}</td>
      <td>${v.modelo || ''}</td>
      <td>${v.capacidade || ''}</td>
      <td>${v.status || ''}</td>
    </tr>
  `).join('');
}

document.getElementById('veiculoForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    nome: document.getElementById('nome').value.trim(),
    placa: document.getElementById('placa').value.trim(),
    modelo: document.getElementById('modelo').value.trim(),
    capacidade: Number(document.getElementById('capacidade').value || 0),
    ano: Number(document.getElementById('ano').value || 0),
    status: document.getElementById('status').value,
    observacoes: document.getElementById('observacoes').value.trim()
  };

  const { error } = await supabaseClient.from('veiculos').insert(payload);
  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  await carregarVeiculos();
});
