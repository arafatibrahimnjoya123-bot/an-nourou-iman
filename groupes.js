let tousGroupes = [];

async function chargerGroupes(){
  try{
    const snap = await db.collection("groupes").get();
    tousGroupes = []; snap.forEach(d=> tousGroupes.push({id:d.id, ...d.data()}));

    let villes = [...new Set(tousGroupes.map(g=>g.ville).filter(Boolean))];
    let selV = document.getElementById('filtreVilleGroupe');
    if(selV) selV.innerHTML = `<option value="">Toutes les villes</option>` + villes.map(v=>`<option value="${v}">${v}</option>`).join('');

    // FIX - value = NOM, pas ID
    let selG = document.getElementById('insGroupe');
    if(selG) selG.innerHTML = `<option value="">-- Choisis un groupe --</option>` + tousGroupes.map(g=>`<option value="${g.nom}" data-id="${g.id}" data-ville="${g.ville||''}">${g.nom} - ${g.ville} - ${g.niveau}</option>`).join('') + `<option value="Nouveau groupe demandé">➕ Je ne vois pas ma ville - Créer un groupe pour moi</option>`;

    if(tousGroupes.length===0) document.getElementById('listeGroupes').innerHTML = `<div style="text-align:center;padding:20px;background:white;border-radius:14px">👥 Aucun groupe pour l'instant.<br><small>Inscris-toi, le Directeur va créer un groupe pour ta ville.</small></div>`;
    else afficherGroupes();

  }catch(e){ 
    let el = document.getElementById('listeGroupes');
    if(el) el.innerHTML = "❌ "+e.message; 
  }
}

function afficherGroupes(){
  let recherche = (document.getElementById('rechercheGroupe').value||"").toLowerCase();
  let filtreV = document.getElementById('filtreVilleGroupe').value;
  let list = tousGroupes.filter(g=>{ 
    if(filtreV && g.ville!==filtreV) return false; 
    if(recherche && !((g.nom||"").toLowerCase().includes(recherche) || (g.ville||"").toLowerCase().includes(recherche))) return false; 
    return true; 
  });
  if(list.length===0){ document.getElementById('listeGroupes').innerHTML = "Aucun groupe trouvé"; return; }
  document.getElementById('listeGroupes').innerHTML = list.map(g=>`
  <div style="background:white;padding:14px;border-radius:18px;margin:10px 0;display:flex;gap:12px;align-items:center;border:2px solid #FDBA74;box-shadow:0 4px 14px rgba(0,0,0,.05)">
  <div style="width:62px;height:62px;border-radius:14px;background:#FFF7ED;display:flex;align-items:center;justify-content:center;font-size:28px">👥</div>
  <div style="flex:1"><b>${g.nom}</b><br><small>📍 ${g.ville} • 📚 ${g.niveau}</small><br><small>🕐 ${g.dispo||''} • 👨‍🏫 ${g.enseignant||''}</small><br><small>💰 ${g.fraisMensuel||0} FCFA / mois • 👥 Max: ${g.maxEleves||8} élèves</small></div>
  <button onclick="voirGroupe('${g.id}')" style="background:#FF7A3D;color:white;border:none;padding:10px 14px;border-radius:12px;font-weight:800">Voir →</button>
  </div>`).join('');
}

function voirGroupe(id){
  let g = tousGroupes.find(x=>x.id===id); if(!g) return;
  document.getElementById('detailGroupe').innerHTML = `<div style="text-align:center;font-size:50px">👥</div><h2>${g.nom}</h2><p>📍 <b>${g.ville}</b> - ${g.quartier||''}<br>📚 Niveau: ${g.niveau}<br>🕐 Disponibilité: ${g.dispo||''}<br>👨‍🏫 Enseignant: ${g.enseignant||''}<br>📱 Enseignant WhatsApp: ${g.enseignantTel||''}</p><p>${g.description||''}</p><div style="background:#FFF7ED;padding:12px;border-radius:12px"><b>💰 Frais :</b><br>Mensuel: ${g.fraisMensuel||0} FCFA<br>Places: ${g.maxEleves||8} élèves max</div>`;
  // FIX : on met le NOM, et on coche Groupe d'Études
  let sel = document.getElementById('insGroupe');
  if(sel) sel.value = g.nom;
  let radioGroupe = document.querySelector('input[value=Groupe]');
  if(radioGroupe) radioGroupe.checked = true;
  if(typeof changerTypeIns === 'function') changerTypeIns();
  document.getElementById('modalGroupe').style.display = 'block';
}
function fermerModalGroupe(){ document.getElementById('modalGroupe').style.display='none'; }

// FIX : Lancement automatique
document.addEventListener('DOMContentLoaded', chargerGroupes);