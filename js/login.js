document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Erro no login: ' + error.message);
    return;
  }

  window.location.href = 'index.html';
});
