let modeloAtualId = null;
let modeloAtualVersao = 1;

(async function () {
  await requireAuth();
  await carregarModelo();
})();

async function carregarModelo() {
  const { data, error } = await supabaseClient
    .from('modelos_contrato')
    .select('*')
    .eq('ativo', true)
    .order('id', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  modeloAtualId = data.id;
  modeloAtualVersao = data.versao;
  document.getElementById('conteudo').value = data.conteudo;
}

document.getElementById('btnSalvar')?.addEventListener('click', async () => {
  const conteudo = document.getElementById('conteudo').value;

  const { error: e1 } = await supabaseClient
    .from('modelos_contrato')
    .update({ ativo: false })
    .eq('id', modeloAtualId);

  if (e1) {
    alert(e1.message);
    return;
  }

  const { error: e2 } = await supabaseClient
    .from('modelos_contrato')
    .insert({
      nome: 'Contrato padrão',
      conteudo,
      ativo: true,
      versao: modeloAtualVersao + 1
    });

  if (e2) {
    alert(e2.message);
    return;
  }

  alert('Modelo salvo com nova versão.');
  await carregarModelo();
});
