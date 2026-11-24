function showSection(id, btn) {
  document.querySelectorAll('.section-page').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'secParcours') afficherNiveaux();
  if (id === 'secEcoles') afficherEcoles();
  if (id === 'secGroupes') afficherGroupes();
}