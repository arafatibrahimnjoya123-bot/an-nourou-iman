// auth vient déjà de firebase.js, on ne le redéclare pas
let photoEcole = ""; let filtreIns = "Toutes";
let filtrePaiementAdmin = "tous";
let cacheEcoles=[], cacheGroupes=[], cacheIns=[], cachePaiements=[], cacheBulletins=[], cacheFraisParEcole={};

function showTabAdmin(id, btn){
  ['tabDashboard','tabEcoles','tabGroupes','tabInscriptions','tabPaiements','tabBulletins','tabDivers'].forEach(t=>{
    let el=document.getElementById(t); if(el) el.style.display = (t===id?'block':'none');
  });
  document.querySelectorAll('.admin-tab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  if(id==='tabInscriptions') chargerInscriptions();
  if(id==='tabEcoles') chargerEcolesAdmin();
  if(id==='tabGroupes') chargerGroupesAdmin();
  if(id==='tabPaiements') chargerPaiementsAdmin();
  if(id==='tabBulletins') chargerBulletinsAdmin();
  if(id==='tabDashboard') chargerDashboardDG();
  if(id==='tabDivers') chargerDiversAdmin();
}
async function seConnecter(){ let e=document.getElementById('email').value.trim(); let p=document.getElementById('password').value; try{ await auth.signInWithEmailAndPassword(e,p); }catch(err){ document.getElementById('msg').textContent="❌ "+err.code; } }
function seDeconnecter(){ auth.signOut(); }
auth.onAuthStateChanged(async u=>{
  if(!u){ document.getElementById('loginCard').style.display='block'; document.getElementById('adminPanel').style.display='none'; return; }
  document.getElementById('loginCard').style.display='none';
  document.getElementById('adminPanel').style.display='none';
  let emailConnecte = u.email.trim().toLowerCase();
  let estSousDirecteur = false;
  try{
    let snapE = await db.collection("ecoles").get();
    snapE.forEach(d=>{ let mail = (d.data().sousDirecteurEmail || "").trim().toLowerCase(); if(mail && mail === emailConnecte) estSousDirecteur = true; });
    let snapG = await db.collection("groupes").get();
    snapG.forEach(d=>{ let mail = (d.data().sousDirecteurEmail || "").trim().toLowerCase(); if(mail && mail === emailConnecte) estSousDirecteur = true; });
  }catch(e){}
  if(estSousDirecteur){ alert("⛔ Accès Directeur uniquement. Tu es redirigé vers ta page Gestion."); await auth.signOut(); window.location.href = "gestion.html"; return; }
  // ===== BLOCAGE SECRÉTAIRE - SANS GÂTER LE RESTE =====
  try{
    let docU = await db.collection("utilisateurs").doc(emailConnecte).get();
    if(docU.exists){
      let roleU = String(docU.data().role || "").toLowerCase().trim();
      if(roleU === "secretaire"){
        alert("⛔ Accès réservé au Directeur.\n\nToi tu es Secrétaire, ton espace c'est gestion.html, pas ici.");
        await auth.signOut();
        window.location.href = "gestion.html";
        return;
      }
      if(roleU && roleU !== "directeur" && roleU !== "admin" && roleU !== "directeur general" && roleU !== "directeur_general"){
        alert("⛔ Accès réservé au Directeur. Tu es redirigé vers gestion.html");
        await auth.signOut();
        window.location.href = "gestion.html";
        return;
      }
    }
  }catch(e){ console.log("Vérification rôle admin:", e.message); }
  document.getElementById('adminPanel').style.display='block';
  document.getElementById('adminEmail').textContent=u.email;
  chargerEcolesAdmin(); chargerGroupesAdmin(); chargerInscriptions(); chargerPaiementsAdmin(); chargerBulletinsAdmin(); chargerDashboardDG(); chargerDiversAdmin();
});
function normaliserDG(t){ return (t||"").toString().trim().toLowerCase(); }
function fraisPourEcole(nomEcole){
  if(cacheFraisParEcole[normaliserDG(nomEcole)]) return cacheFraisParEcole[normaliserDG(nomEcole)];
  let ec = cacheEcoles.find(e=>normaliserDG(e.nom)===normaliserDG(nomEcole));
  if(ec) return Number(ec.fraisMensuel||ec.fraisInscription||0);
  let gr = cacheGroupes.find(g=>normaliserDG(g.nom)===normaliserDG(nomEcole));
  if(gr) return Number(gr.fraisMensuel||0);
  return 0;
}
function soldeEleveAdmin(nomEleve, nomEcole){
  let totalPaye = 0;
  cachePaiements.forEach(p=>{ if(normaliserDG(p.enfantNom)===normaliserDG(nomEleve)) totalPaye += Number(p.montant||0); });
  let frais = fraisPourEcole(nomEcole);
  let reste = Math.max(0, frais - totalPaye);
  let type = frais===0 ? "indefini" : totalPaye===0 ? "nonpaye" : reste===0 ? "paye" : "avance";
  let badge = type==="paye" ? `<span class="badge badge-paye">✓ PAYÉ</span>` : type==="avance" ? `<span class="badge badge-avance">◐ AVANCE</span>` : type==="nonpaye" ? `<span class="badge badge-nonpaye">✗ NON PAYÉ</span>` : `<span class="badge">Frais non défini</span>`;
  return {totalPaye, reste, frais, type, badge};
}
async function chargerDashboardDG(){
  try{
    let snapE = await db.collection("ecoles").get(); cacheEcoles=[]; snapE.forEach(d=>cacheEcoles.push({id:d.id,...d.data()}));
    let snapG = await db.collection("groupes").get(); cacheGroupes=[]; snapG.forEach(d=>cacheGroupes.push({id:d.id,...d.data()}));
    let snapI = await db.collection("inscriptions").get(); cacheIns=[]; snapI.forEach(d=>cacheIns.push({id:d.id,...d.data()}));
    let snapP = await db.collection("paiements").get(); cachePaiements=[]; snapP.forEach(d=>cachePaiements.push({id:d.id,...d.data()}));
    let snapB = await db.collection("bulletins").get(); cacheBulletins=[]; snapB.forEach(d=>cacheBulletins.push({id:d.id,...d.data()}));
    try{ let snapF = await db.collection("configFrais").get(); cacheFraisParEcole={}; snapF.forEach(d=>{ let f=d.data(); if(f.ecoleNom) cacheFraisParEcole[normaliserDG(f.ecoleNom)]=Number(f.montant||0); }); }catch(e){}
    let totalEleves = cacheIns.length;
    let acceptes = cacheIns.filter(x=>x.statut==="Accepte").length;
    let enAttente = cacheIns.filter(x=>!x.statut || (x.statut!=="Accepte" && x.statut!=="Refuse")).length;
    let totalEncaisse = cachePaiements.reduce((s,p)=>s+Number(p.montant||0),0);
    let hEcole = `<h3>🏫 Par École</h3>`;
    cacheEcoles.forEach(ec=>{
      let insEc = cacheIns.filter(x=>normaliserDG(x.ecoleNom)===normaliserDG(ec.nom) || normaliserDG(x.groupeNom)===normaliserDG(ec.nom));
      let acc = insEc.filter(x=>x.statut==="Accepte").length;
      let att = insEc.filter(x=>!x.statut || (x.statut!=="Accepte" && x.statut!=="Refuse")).length;
      let payEc = cachePaiements.filter(p=>normaliserDG(p.ecoleNom)===normaliserDG(ec.nom)).reduce((s,p)=>s+Number(p.montant||0),0);
      hEcole += `<div style="background:#F1F8E9;padding:12px;border-radius:12px;margin:8px 0"><b>${ec.nom}</b> - ${ec.quartier||""}<br><small>👶 ${insEc.length} inscrits - ✅ ${acc} acceptés - ⏳ ${att} en attente<br>💰 Encaissé : ${payEc.toLocaleString('fr-FR')} FCFA - Frais : ${fraisPourEcole(ec.nom)} FCFA<br>👤 Sous-Directeur : ${ec.sousDirecteurEmail||"—"}</small></div>`;
    });
    if(!cacheEcoles.length) hEcole += `<p>Aucune école.</p>`;
    document.getElementById('parEcoleDG').innerHTML = hEcole;
    let hGroupe = `<h3>👥 Par Groupe</h3>`;
    cacheGroupes.forEach(gr=>{
      let insGr = cacheIns.filter(x=>normaliserDG(x.groupeNom)===normaliserDG(gr.nom) || normaliserDG(x.ecoleNom)===normaliserDG(gr.nom));
      let acc = insGr.filter(x=>x.statut==="Accepte").length;
      let att = insGr.filter(x=>!x.statut || (x.statut!=="Accepte" && x.statut!=="Refuse")).length;
      let payGr = cachePaiements.filter(p=>normaliserDG(p.ecoleNom)===normaliserDG(gr.nom)).reduce((s,p)=>s+Number(p.montant||0),0);
      hGroupe += `<div style="background:#F1F8E9;padding:12px;border-radius:12px;margin:8px 0"><b>${gr.nom}</b> - ${gr.ville||""}<br><small>👶 ${insGr.length} inscrits - ✅ ${acc} acceptés - ⏳ ${att} en attente<br>💰 Encaissé : ${payGr.toLocaleString('fr-FR')} FCFA<br>👨‍🏫 ${gr.enseignant||""}</small></div>`;
    });
    if(!cacheGroupes.length) hGroupe += `<p>Aucun groupe.</p>`;
    document.getElementById('parGroupeDG').innerHTML = hGroupe;
    document.getElementById('statsDG').innerHTML = `
      <div style="background:#0F3D2E;color:white;padding:14px;border-radius:14px;text-align:center"><b style="font-size:22px">${cacheEcoles.length}</b><br>Écoles</div>
      <div style="background:#66BB6A;color:white;padding:14px;border-radius:14px;text-align:center"><b style="font-size:22px">${cacheGroupes.length}</b><br>Groupes</div>
      <div style="background:#E8F5E9;padding:14px;border-radius:14px;text-align:center"><b style="font-size:22px">${totalEleves}</b><br>Inscriptions</div>
      <div style="background:#C8E6C9;padding:14px;border-radius:14px;text-align:center"><b style="font-size:22px">${acceptes}</b><br>Acceptés</div>
      <div style="background:#FFE0B2;padding:14px;border-radius:14px;text-align:center"><b style="font-size:22px">${enAttente}</b><br>⏳ En attente</div>
      <div style="background:#0F3D2E;color:white;padding:14px;border-radius:14px;text-align:center"><b style="font-size:18px">${totalEncaisse.toLocaleString('fr-FR')} FCFA</b><br>Encaissé total</div>`;
    let alertes = [];
    if(enAttente>0) alertes.push(`<div style="background:#FFF9C4;padding:12px;border-radius:12px;margin:6px 0">⏳ <b>${enAttente} élève(s) en attente</b> - Tu dois accepter ou refuser.</div>`);
    if(!alertes.length) alertes.push(`<div style="background:#C8E6C9;padding:12px;border-radius:12px">✅ Tout est à jour.</div>`);
    document.getElementById('alertesDG').innerHTML = alertes.join('');
    let attList = cacheIns.filter(x=>!x.statut || (x.statut!=="Accepte" && x.statut!=="Refuse")).slice(0,5);
    document.getElementById('attenteDG').innerHTML = attList.length ? attList.map(c=>`<div style="background:#F1F8E9;padding:10px;border-radius:12px;margin:6px 0"><b>${c.enfant}</b> - ${c.ecoleNom||c.groupeNom||""}<br><button onclick="accepterInscription('${c.id}')" style="background:#2E7D32;color:white;border:none;padding:6px 10px;border-radius:10px">✅ Accepter</button> <button onclick="refuserInscription('${c.id}')" style="background:#E53935;color:white;border:none;padding:6px 10px;border-radius:10px">❌ Refuser</button></div>`).join('') : "Aucune en attente.";
    let dern = [...cachePaiements].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);
    document.getElementById('derniersPaiementsDG').innerHTML = dern.length ? dern.map(p=>`<div style="background:#F1F8E9;padding:10px;border-radius:12px;margin:6px 0"><b>${p.enfantNom}</b> - ${Number(p.montant||0).toLocaleString('fr-FR')} FCFA - ${p.ecoleNom||""}</div>`).join('') : "Aucun paiement.";
    let parEleve = {};
    cacheBulletins.forEach(b=>{ if(!parEleve[b.eleve]) parEleve[b.eleve]=[]; parEleve[b.eleve].push(Number(b.moyenne||b.note||0)); });
    let meilleurs = Object.keys(parEleve).map(n=>({nom:n, moy: parEleve[n].reduce((a,b)=>a+b,0)/parEleve[n].length})).sort((a,b)=>b.moy-a.moy).slice(0,5);
    document.getElementById('meilleursDG').innerHTML = meilleurs.length ? meilleurs.map((m,i)=>`<div style="background:#E8F5E9;padding:10px;border-radius:12px;margin:6px 0">#${i+1} <b>${m.nom}</b> - ${m.moy.toFixed(2)} / 20</div>`).join('') : "Aucun bulletin.";
  }catch(e){ console.log(e); }
}
async function publierDivers(){
  let titre=document.getElementById('divTitre').value.trim();
  let msg=document.getElementById('divMessage').value.trim();
  let type=document.getElementById('divType').value;
  let ecole=document.getElementById('divEcole').value.trim();
  if(!titre||!msg) return alert("Mets le titre + le message");
  await db.collection("divers").add({titre, message:msg, type, ecole, date:new Date().toISOString(), par:"Directeur"});
  document.getElementById('msgDivers').textContent="✅ Publié ! Tout le monde le voit sur l'Accueil.";
  document.getElementById('divTitre').value=""; document.getElementById('divMessage').value=""; document.getElementById('divEcole').value="";
  chargerDiversAdmin();
}
async function chargerDiversAdmin(){
  try{
    let snap=await db.collection("divers").get(); let list=[]; snap.forEach(d=>list.push({id:d.id,...d.data()}));
    list.sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    document.getElementById('listeDiversAdmin').innerHTML = list.length ? list.map(d=>`<div style="background:#F1F8E9;padding:12px;border-radius:12px;margin:8px 0"><b>${d.type} - ${d.titre}</b><br><small>${d.message}<br>🏫 ${d.ecole||"Pour tout le monde"} - ${d.date?new Date(d.date).toLocaleDateString('fr-FR'):""}</small><br><button onclick="supprimerDivers('${d.id}')" style="background:#FFCDD2;border:none;padding:6px 10px;border-radius:10px;margin-top:6px">🗑️ Supprimer</button></div>`).join('') : "Aucune annonce.";
  }catch(e){}
}
async function supprimerDivers(id){ if(confirm("Supprimer cette annonce ?")){ await db.collection("divers").doc(id).delete(); chargerDiversAdmin(); } }
document.getElementById('ecPhoto').onchange=function(e){ let f=e.target.files[0]; if(!f) return; let r=new FileReader(); r.onload=function(ev){ photoEcole=ev.target.result; let pr=document.getElementById('previewEcole'); pr.src=photoEcole; pr.style.display='block'; }; r.readAsDataURL(f); };
async function sauvegarderEcole(){
  let nom=document.getElementById('ecNom').value.trim(); let quartier=document.getElementById('ecQuartier').value.trim();
  if(!nom||!quartier){ document.getElementById('msgEcole').textContent="⚠️ Mets le nom + le quartier"; return; }
  let data={ nom, quartier, responsable:document.getElementById('ecResponsable').value.trim(), whatsapp:document.getElementById('ecWhatsapp').value.trim(), sousDirecteurEmail: document.getElementById('ecSousDirecteur').value.trim(), fraisInscription:Number(document.getElementById('ecFraisIns').value||0), fraisMensuel:Number(document.getElementById('ecFraisMens').value||0), horaires:document.getElementById('ecHoraires').value.trim()||"Lun - Ven : 14h - 18h", description:document.getElementById('ecDesc').value.trim(), photo:document.getElementById('ecPhotoUrl').value.trim()||photoEcole, niveaux:['Niveau 1','Niveau 2','Niveau 3','Niveau 4','Niveau 5'], date:new Date().toISOString() };
  let editId=document.getElementById('ecEditId').value;
  if(editId){ await db.collection("ecoles").doc(editId).update(data); document.getElementById('ecEditId').value=""; } else { await db.collection("ecoles").add(data); }
  document.getElementById('msgEcole').textContent="✅ École enregistrée !";
  document.getElementById('ecNom').value=""; document.getElementById('ecQuartier').value=""; document.getElementById('ecResponsable').value=""; document.getElementById('ecWhatsapp').value=""; document.getElementById('ecSousDirecteur').value=""; document.getElementById('ecFraisIns').value=""; document.getElementById('ecFraisMens').value=""; document.getElementById('ecDesc').value=""; document.getElementById('ecPhotoUrl').value=""; photoEcole=""; document.getElementById('previewEcole').style.display='none';
  chargerEcolesAdmin(); chargerDashboardDG();
}
async function chargerEcolesAdmin(){ let snap=await db.collection("ecoles").get(); let h=""; snap.forEach(d=>{ let e=d.data(); h+=`<div style="background:#F1F8E9;padding:12px;border-radius:12px;margin:8px 0;display:flex;gap:10px;align-items:center"><img src="${e.photo||''}" style="width:60px;height:60px;border-radius:10px;object-fit:cover"><div style="flex:1"><b>${e.nom}</b><br><small>📍 ${e.quartier} • 💰 ${e.fraisInscription} / ${e.fraisMensuel} FCFA<br>👤 Sous-Directeur: ${e.sousDirecteurEmail||'— Aucun —'}</small></div><button onclick="modifierEcole('${d.id}')" style="background:#C9A227;border:none;padding:8px 10px;border-radius:10px">✏️</button><button onclick="supprimerEcole('${d.id}')" style="background:#FFCDD2;border:none;padding:8px 10px;border-radius:10px">🗑️</button></div>`; }); document.getElementById('listeEcolesAdmin').innerHTML=h||"Aucune école."; }
async function modifierEcole(id){ let doc=await db.collection("ecoles").doc(id).get(); let e=doc.data(); document.getElementById('ecEditId').value=id; document.getElementById('ecNom').value=e.nom||""; document.getElementById('ecQuartier').value=e.quartier||""; document.getElementById('ecResponsable').value=e.responsable||""; document.getElementById('ecWhatsapp').value=e.whatsapp||""; document.getElementById('ecSousDirecteur').value=e.sousDirecteurEmail||""; document.getElementById('ecFraisIns').value=e.fraisInscription||""; document.getElementById('ecFraisMens').value=e.fraisMensuel||""; document.getElementById('ecHoraires').value=e.horaires||""; document.getElementById('ecDesc').value=e.description||""; document.getElementById('ecPhotoUrl').value=e.photo||""; window.scrollTo({top:0,behavior:'smooth'}); }
async function supprimerEcole(id){ if(confirm("Supprimer cette école ?")){ await db.collection("ecoles").doc(id).delete(); chargerEcolesAdmin(); chargerDashboardDG(); } }
async function sauvegarderGroupe(){
  let nom=document.getElementById('grNom').value.trim(); let ville=document.getElementById('grVille').value.trim(); let enseignant=document.getElementById('grEnseignant').value.trim();
  if(!nom||!ville||!enseignant){ document.getElementById('msgGroupe').textContent="⚠️ Mets Nom du groupe + Ville + Enseignant"; return; }
  let data={ nom, ville, quartier:document.getElementById('grQuartier').value.trim(), niveau:document.getElementById('grNiveau').value, dispo:document.getElementById('grDispo').value, enseignant, enseignantTel:document.getElementById('grEnseignantTel').value.trim(), sousDirecteurEmail: document.getElementById('grSousDirecteur').value.trim(), fraisMensuel:Number(document.getElementById('grFrais').value||0), maxEleves:Number(document.getElementById('grMax').value||8), description:document.getElementById('grDesc').value.trim(), date:new Date().toISOString() };
  let editId=document.getElementById('grEditId').value;
  if(editId){ await db.collection("groupes").doc(editId).update(data); document.getElementById('grEditId').value=""; } else { await db.collection("groupes").add(data); }
  document.getElementById('msgGroupe').textContent="✅ Groupe créé ! Il est déjà en ligne.";
  document.getElementById('grNom').value=""; document.getElementById('grVille').value=""; document.getElementById('grQuartier').value=""; document.getElementById('grEnseignant').value=""; document.getElementById('grEnseignantTel').value=""; document.getElementById('grSousDirecteur').value=""; document.getElementById('grFrais').value=""; document.getElementById('grMax').value=""; document.getElementById('grDesc').value="";
  chargerGroupesAdmin(); chargerDashboardDG();
}
async function chargerGroupesAdmin(){ let snap=await db.collection("groupes").get(); let h=""; snap.forEach(d=>{ let g=d.data(); h+=`<div style="background:#F1F8E9;padding:12px;border-radius:12px;margin:8px 0;display:flex;gap:10px;align-items:center"><div style="width:50px;height:50px;border-radius:12px;background:#C8E6C9;display:flex;align-items:center;justify-content:center;font-size:24px">👥</div><div style="flex:1"><b>${g.nom}</b><br><small>📍 ${g.ville} • 📚 ${g.niveau} • 🕐 ${g.dispo}<br>👨‍🏫 ${g.enseignant} • 💰 ${g.fraisMensuel} FCFA<br>👤 Sous-Directeur: ${g.sousDirecteurEmail||'— Aucun —'}</small></div><button onclick="modifierGroupe('${d.id}')" style="background:#C9A227;border:none;padding:8px 10px;border-radius:10px">✏️</button><button onclick="supprimerGroupe('${d.id}')" style="background:#FFCDD2;border:none;padding:8px 10px;border-radius:10px">🗑️</button></div>`; }); document.getElementById('listeGroupesAdmin').innerHTML=h||"Aucun groupe."; }
async function modifierGroupe(id){ let doc=await db.collection("groupes").doc(id).get(); let g=doc.data(); document.getElementById('grEditId').value=id; document.getElementById('grNom').value=g.nom||""; document.getElementById('grVille').value=g.ville||""; document.getElementById('grQuartier').value=g.quartier||""; document.getElementById('grNiveau').value=g.niveau||"Niveau 1"; document.getElementById('grDispo').value=g.dispo||""; document.getElementById('grEnseignant').value=g.enseignant||""; document.getElementById('grEnseignantTel').value=g.enseignantTel||""; document.getElementById('grSousDirecteur').value=g.sousDirecteurEmail||""; document.getElementById('grFrais').value=g.fraisMensuel||""; document.getElementById('grMax').value=g.maxEleves||""; document.getElementById('grDesc').value=g.description||""; window.scrollTo({top:0,behavior:'smooth'}); }
async function supprimerGroupe(id){ if(confirm("Supprimer ce groupe ?")){ await db.collection("groupes").doc(id).delete(); chargerGroupesAdmin(); chargerDashboardDG(); } }
function filtrerIns(f){ filtreIns=f; chargerInscriptions(); }
async function chargerInscriptions(){
  let snap=await db.collection("inscriptions").get();
  let list=[]; snap.forEach(d=>list.push({id:d.id,...d.data()}));
  list.sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  let recherche=(document.getElementById('rechercheIns')?.value||"").toLowerCase();
  let h="";
  list.forEach(c=>{
    if(filtreIns!=="Toutes" && c.type!==filtreIns) return;
    if(recherche && !((c.enfant||"").toLowerCase().includes(recherche)||(c.groupeVille||"").toLowerCase().includes(recherche)||(c.ecoleNom||"").toLowerCase().includes(recherche))) return;
    let badge = "";
    if(c.statut==="Accepte") badge = `<span class="badge badge-accepte">✅ ACCEPTÉ</span>`;
    else if(c.statut==="Refuse") badge = `<span class="badge badge-nonpaye">❌ REFUSÉ</span>`;
    else badge = `<span class="badge badge-attente">🆕 NOUVEAU</span>`;
    h+=`<div style="background:#F1F8E9;padding:12px;border-radius:12px;margin:8px 0;border-left:5px solid #0F3D2E">
    ${badge}<br>
    <b>${c.type==='Groupe'?'👥 GROUPE':'🏫 ÉCOLE'} - 👶 ${c.enfant} (${c.age} ans) - ${c.niveau}</b><br>
    <small>${c.type==='Groupe' ? `👥 ${c.groupeNom||'Nouveau groupe demandé'} - 📍 ${c.groupeVille||c.ville} • 🕐 ${c.dispo||''}` : `🏫 ${c.ecoleNom} - ${c.ecoleQuartier}`}</small><br>
    🎂 ${c.dateNaissance||''} • 🏥 ${c.lieuNaissance||''}<br>
    👤 ${c.parent} • 📱 ${c.tel}<br>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
      <button onclick="accepterInscription('${c.id}')" style="background:#2E7D32;color:white;border:none;padding:8px 10px;border-radius:10px;font-weight:bold">✅ Accepter</button>
      <button onclick="refuserInscription('${c.id}')" style="background:#E53935;color:white;border:none;padding:8px 10px;border-radius:10px;font-weight:bold">❌ Refuser</button>
      <button onclick="contacterParent('${c.tel}','${c.enfant}')" style="background:#25D366;color:white;border:none;padding:8px 10px;border-radius:10px;font-weight:bold">💬 Contacter parent</button>
      <button onclick="supprimerIns('${c.id}')" style="background:#FFCDD2;border:none;padding:8px 10px;border-radius:10px">🗑️</button>
    </div>
    </div>`;
  });
  document.getElementById('listeInscriptions').innerHTML=h||"Aucune inscription";
}
async function accepterInscription(id){ await db.collection("inscriptions").doc(id).update({ statut: "Accepte", dateAcceptation: new Date().toISOString() }); alert("✅ Inscription acceptée"); chargerInscriptions(); chargerDashboardDG(); }
async function refuserInscription(id){ if(!confirm("Refuser cette inscription ?")) return; await db.collection("inscriptions").doc(id).update({ statut: "Refuse", dateRefus: new Date().toISOString() }); alert("❌ Inscription refusée"); chargerInscriptions(); chargerDashboardDG(); }
async function supprimerIns(id){ if(confirm("Supprimer ?")){ await db.collection("inscriptions").doc(id).delete(); chargerInscriptions(); chargerDashboardDG(); } }
function contacterParent(tel,enfant){ let msg=encodeURIComponent(`Assalamou Aleykoum, c'est le Groupe An Nourou Iman. Pour l'inscription de ${enfant}, nous vous confirmons...`); window.open(`https://wa.me/237${tel}?text=${msg}`,'_blank'); }
function filtrerPaiementsAdmin(f, btn){
  filtrePaiementAdmin = f;
  document.querySelectorAll('#tabPaiements .btn-filtre').forEach(b=>b.classList.remove('actif'));
  if(btn) btn.classList.add('actif');
  chargerPaiementsAdmin();
}
async function chargerPaiementsAdmin(){
  try{
    let snapE = await db.collection("ecoles").get(); cacheEcoles=[]; snapE.forEach(d=>cacheEcoles.push({id:d.id,...d.data()}));
    let snapG = await db.collection("groupes").get(); cacheGroupes=[]; snapG.forEach(d=>cacheGroupes.push({id:d.id,...d.data()}));
    let snapI = await db.collection("inscriptions").get(); cacheIns=[]; snapI.forEach(d=>cacheIns.push({id:d.id,...d.data()}));
    let snapP = await db.collection("paiements").get(); cachePaiements=[]; snapP.forEach(d=>cachePaiements.push({id:d.id,...d.data()}));
    try{ let snapF = await db.collection("configFrais").get(); cacheFraisParEcole={}; snapF.forEach(d=>{ let f=d.data(); if(f.ecoleNom) cacheFraisParEcole[normaliserDG(f.ecoleNom)]=Number(f.montant||0); }); }catch(e){}
  }catch(e){}
  let recherche = (document.getElementById('recherchePaiementAdmin')?.value||"").toLowerCase();
  let totalEncaisse = cachePaiements.reduce((s,p)=>s+Number(p.montant||0),0);
  let nbPaye = 0, nbAvance = 0, nbNonPaye = 0;
  cacheIns.forEach(ins=>{
    let nomEcole = ins.ecoleNom || ins.groupeNom || "";
    let s = soldeEleveAdmin(ins.enfant, nomEcole);
    if(s.type==="paye") nbPaye++; else if(s.type==="avance") nbAvance++; else if(s.type==="nonpaye") nbNonPaye++;
  });
  let resume = document.getElementById('resumePaiementsAdmin');
  if(resume) resume.textContent = `💰 Encaissé : ${totalEncaisse.toLocaleString('fr-FR')} FCFA • ✓ Payés : ${nbPaye} • ◐ Avances : ${nbAvance} • ✗ Non payés : ${nbNonPaye} • ${cachePaiements.length} paiement(s)`;
  let liste = cacheIns.filter(ins=>{
    if(recherche && !(normaliserDG(ins.enfant).includes(recherche) || normaliserDG(ins.ecoleNom||ins.groupeNom).includes(recherche))) return false;
    if(filtrePaiementAdmin==="tous") return true;
    let s = soldeEleveAdmin(ins.enfant, ins.ecoleNom||ins.groupeNom||"");
    if(filtrePaiementAdmin==="paye") return s.type==="paye";
    if(filtrePaiementAdmin==="avance") return s.type==="avance";
    if(filtrePaiementAdmin==="nonpaye") return s.type==="nonpaye";
    return true;
  });
  let h = `<table class="table-blanc"><tr><th>N</th><th>Élève</th><th>École / Groupe</th><th>Statuts</th><th>Total / Payé / Reste</th><th>Action</th></tr>`;
  liste.forEach((ins,i)=>{
    let nomEcole = ins.ecoleNom || ins.groupeNom || "";
    let s = soldeEleveAdmin(ins.enfant, nomEcole);
    let badgeIns = ins.statut==="Accepte" ? `<span class="badge badge-accepte">ACCEPTÉ</span>` : ins.statut==="Refuse" ? `<span class="badge badge-nonpaye">REFUSÉ</span>` : `<span class="badge badge-attente">EN ATTENTE</span>`;
    h += `<tr><td>${i+1}</td><td><b>${ins.enfant}</b><br><small>${ins.niveau||""}</small></td><td>${nomEcole}</td><td>${badgeIns}<br>${s.badge}</td><td>Total <b>${s.frais}</b><br>Payé <b>${s.totalPaye}</b><br>Reste <b>${s.reste}</b></td><td><a class="lien-action" onclick="contacterParent('${ins.tel}','${ins.enfant}')">Relancer</a></td></tr>`;
  });
  h += `</table><p style="text-align:center">Affichés : ${liste.length} / ${cacheIns.length}</p>`;
  document.getElementById('listePaiementsAdmin').innerHTML = liste.length ? h : "Aucun paiement.";
  let hist = [...cachePaiements].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  let h2 = `<table class="table-blanc"><tr><th>N</th><th>Élève</th><th>Montant</th><th>Motif</th><th>Date</th><th>Action</th></tr>`;
  hist.forEach((p,i)=>{
    let dateAff = p.date ? new Date(p.date).toLocaleDateString('fr-FR') : (p.datePaiement||'');
    h2 += `<tr><td>${i+1}</td><td><b>${p.enfantNom}</b><br><small>${p.ecoleNom||""}</small></td><td><b>${Number(p.montant||0).toLocaleString('fr-FR')} FCFA</b></td><td>${p.motif||""}</td><td>${dateAff}</td><td><a class="lien-action" onclick="supprimerPaiement('${p.id}')">Supprimer</a></td></tr>`;
  });
  h2 += `</table>`;
  document.getElementById('historiquePaiementsAdmin').innerHTML = hist.length ? h2 : "Aucun paiement.";
}
async function supprimerPaiement(id){ if(confirm("Supprimer ce paiement ?")){ await db.collection("paiements").doc(id).delete(); chargerPaiementsAdmin(); chargerDashboardDG(); } }
async function chargerBulletinsAdmin(){
  let snap=await db.collection("bulletins").get();
  let list=[]; snap.forEach(d=>list.push({id:d.id,...d.data()}));
  list.sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  let h=`<table class="table-blanc"><tr><th>Élève</th><th>Matière</th><th>Note</th><th>École</th><th>Action</th></tr>`;
  list.forEach(b=>{
    let couleur = Number(b.moyenne||b.note) >= 10 ? "#1B5E20" : "#B71C1C";
    h+=`<tr><td><b>${b.eleve}</b></td><td>${b.matiere}</td><td style="font-weight:800;color:${couleur}">${b.moyenne||b.note} / 20</td><td>${b.ecoleNom||''}</td><td><a class="lien-action" onclick="supprimerBulletinAdmin('${b.id}')">Supprimer</a></td></tr>`;
  });
  h+=`</table>`;
  document.getElementById('listeBulletinsAdmin').innerHTML = list.length ? h : "Aucun bulletin.";
}
async function supprimerBulletinAdmin(id){ if(confirm("Supprimer ce bulletin ?")){ await db.collection("bulletins").doc(id).delete(); chargerBulletinsAdmin(); chargerDashboardDG(); } }