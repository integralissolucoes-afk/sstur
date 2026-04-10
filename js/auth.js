async function requireAuth() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data.session) {
    window.location.href = 'login.html';
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}
