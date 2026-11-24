let toutesEcoles = [];

async function chargerEcoles(){
  if(typeof afficherNiveaux === 'function') afficherNiveaux();
  try{
    const snap = await db.collection("ecoles").get();
    toutesEcoles = []; 
    snap.forEach(d=> toutesEcoles.push({id:d.id, ...d.data()}));

    // 1. Filtre quartier
    let quartiers = [...new Set(toutesEcoles.map(e=>e.quartier).filter(Boolean))];
    let selQ = document.getElementById('filtreQuartier');
    if(selQ) selQ.innerHTML = `<option value="">Tous les quartiers</option>` + quartiers.map(q=>`<option value="${q}">${q}</option>`).join('');

    // 2. FIX - Le select d'inscription : value = NOM, pas ID
    // Sinon Admin ne retrouve plus l'école par son nom
    let selE = document.getElementById('insEcole');
    if(selE) selE.innerHTML = `<option value="">-- Choisis une école --</option>` + toutesEcoles.map(e=>`<option value="${e.nom}" data-id="${e.id}" data-quartier="${e.quartier||''}">${e.nom} - ${e.quartier}</option>`).join('');

    if(toutesEcoles.length===0) document.getElementById('listeEcoles').innerHTML = `<div style="text-align:center;padding:20px;background:white;border-radius:14px">🏫 Aucune école pour l'instant.</div>`;
    else afficherEcoles();

  }catch(e){ 
    let el = document.getElementById('listeEcoles');
    if(el) el.innerHTML = "❌ "+e.message; 
  }
}

function afficherEcoles(){
  let recherche = (document.getElementById('rechercheEcole').value||"").toLowerCase();
  let filtreQ = document.getElementById('filtreQuartier').value;
  let list = toutesEcoles.filter(e=>{ 
    if(filtreQ && e.quartier!==filtreQ) return false; 
    if(recherche && !((e.nom||"").toLowerCase().includes(recherche) || (e.quartier||"").toLowerCase().includes(recherche))) return false; 
    return true; 
  });
  if(list.length===0){ document.getElementById('listeEcoles').innerHTML = "Aucune école trouvée"; return; }
  document.getElementById('listeEcoles').innerHTML = list.map(e=>`
  <div style="background:white;padding:14px;border-radius:18px;margin:10px 0;display:flex;gap:12px;align-items:center;border:2px solid #FDE68A;box-shadow:0 4px 14px rgba(0,0,0,.05)">
  <img src="${e.photo||'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=200'}" style="width:82px;height:82px;border-radius:14px;object-fit:cover">
  <div style="flex:1"><b>☪️ ${e.nom}</b><br><small>📍 ${e.quartier} • 👤 ${e.responsable||''}</small><br><small>💰 ${e.fraisInscription||0} FCFA / Mensuel: ${e.fraisMensuel||0} FCFA</small><br><small>📚 ${e.niveaux ? e.niveaux.join(', ') : 'Niveau 1 au 5'}</small></div>
  <button onclick="voirEcole('${e.id}')" style="background:#0F3D2E;color:white;border:none;padding:10px 14px;border-radius:12px;font-weight:800">Voir →</button>
  </div>`).join('');
}

function voirEcole(id){
  let e = toutesEcoles.find(x=>x.id===id); if(!e) return;
  document.getElementById('detailEcole').innerHTML = `<img src="${e.photo||''}" style="width:100%;height:180px;object-fit:cover;border-radius:14px"><h2>☪️ ${e.nom}</h2><p>📍 <b>${e.quartier}</b><br>👤 ${e.responsable||''}<br>📱 ${e.whatsapp||''}</p><p>${e.description||''}</p><div style="background:#FEF3C7;padding:12px;border-radius:12px"><b>💰 Frais :</b><br>Inscription: ${e.fraisInscription||0} FCFA<br>Mensuel: ${e.fraisMensuel||0} FCFA</div><p>🕐 ${e.horaires||'Lun - Ven : 14h - 18h'}</p>`;
  // FIX : on met le NOM, pas l'ID, et on met le type sur École
  let sel = document.getElementById('insEcole');
  if(sel) sel.value = e.nom;
  let radioEcole = document.querySelector('input[value=Ecole]');
  if(radioEcole) radioEcole.checked = true;
  if(typeof changerTypeIns === 'function') changerTypeIns();
  document.getElementById('modalEcole').style.display = 'block';
}
function fermerModal(){ document.getElementById('modalEcole').style.display='none'; }

// FIX : Lancement automatique au chargement - c'est ça qui manquait
document.addEventListener('DOMContentLoaded', chargerEcoles);