(async function () {
  await requireAuth();
  await carregarClientes();
})();

async function carregarClientes() {
  const { data, error } = await supabaseClient
    .from('clientes')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    alert(error.message);
    return;
  }

  document.getElementById('tbClientes').innerHTML = (data || []).map(c => `
    <tr>
      <td>${c.nome || ''}</td>
      <td>${c.cpf_cnpj || ''}</td>
      <td>${c.telefone || ''}</td>
      <td>${c.email || ''}</td>
    </tr>
  `).join('');
}

document.getElementById('clienteForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    nome: document.getElementById('nome').value.trim(),
    cpf_cnpj: document.getElementById('cpf_cnpj').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    email: document.getElementById('email').value.trim(),
    endereco: document.getElementById('endereco').value.trim(),
    observacoes: document.getElementById('observacoes').value.trim(),
  };

  const { error } = await supabaseClient.from('clientes').insert(payload);
  if (error) {
    alert(error.message);
    return;
  }

  e.target.reset();
  await carregarClientes();
});
