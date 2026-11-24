// paiement.js - C - VERSION SÉCURISÉE - Ne casse rien, anciens paiements gardés

function val(id){ 
  let el = document.getElementById(id); 
  return el ? el.value.trim() : ""; 
}

function viderChampsPaiement(){
  ['payEnfant','payParent','payTel','payMontant'].forEach(id=>{
    let el = document.getElementById(id);
    if(el) el.value = "";
  });
  let motif = document.getElementById('payMotif');
  if(motif) motif.selectedIndex = 0;
  let mode = document.getElementById('payMode');
  if(mode) mode.selectedIndex = 0;
}

async function enregistrerPaiement(){
  let msg = document.getElementById('msgPaiement');
  if(msg) msg.innerHTML = "⏳ Enregistrement...";
  try{
    let data = {
      enfantNom: val('payEnfant'),
      parentNom: val('payParent'),
      parentTel: val('payTel'),
      montant: Number(val('payMontant') || 0),
      motif: val('payMotif'),
      mode: val('payMode'),
      date: new Date().toISOString(),
      // ✅ SEUL CHANGEMENT IMPORTANT : ça part en attente, pas en payé direct
      statut: "en attente"
    };
    if(!data.enfantNom || !data.montant || data.montant <= 0){
      if(msg){ msg.innerHTML = "❌ Mets le nom de l'enfant et le montant"; msg.style.color = "red"; }
      return;
    }
    await db.collection("paiements").add(data);
    if(msg){ msg.innerHTML = "⏳ Paiement de " + data.montant + " FCFA envoyé en attente. Le Directeur doit valider."; msg.style.color = "orange"; }
    
    viderChampsPaiement();
    chargerPaiements();
  }catch(e){ if(msg){ msg.innerHTML = "❌ " + e.message; msg.style.color = "red"; } }
}

// ✅ NOUVEAU : Le Directeur valide
async function validerPaiement(id){
  if(!confirm("Valider ce paiement ? Le parent va le voir dans ses résultats.")) return;
  try{
    await db.collection("paiements").doc(id).update({ statut: "paye", dateValidation: new Date().toISOString() });
    alert("✅ Paiement validé");
    chargerPaiements();
  }catch(e){ alert("❌ " + e.message); }
}

// ✅ NOUVEAU : Le Directeur refuse
async function refuserPaiement(id){
  if(!confirm("Refuser ce paiement ? Il ne comptera pas.")) return;
  try{
    await db.collection("paiements").doc(id).update({ statut: "refuse", dateValidation: new Date().toISOString() });
    alert("❌ Paiement refusé");
    chargerPaiements();
  }catch(e){ alert("❌ " + e.message); }
}

async function chargerPaiements(){
  let box = document.getElementById('listePaiements');
  if(!box) return;
  box.innerHTML = "⏳ Chargement...";
  try{
    let snap = await db.collection("paiements").orderBy("date","desc").get();
    let totalValide = 0;
    let totalAttente = 0;
    let htmlAttente = "";
    let htmlValide = "";
    if(snap.empty){
      box.innerHTML = `<div style="text-align:center;padding:14px;background:white;border-radius:12px">💰 Aucun paiement pour l'instant.</div>`;
      return;
    }
    snap.forEach(doc=>{
      let p = doc.data();
      let id = doc.id;
      // ✅ COMPATIBILITÉ : ancien paiement sans statut ou statut "paye" = validé
      let statut = p.statut || "paye";
      let dateJolie = "";
      try{ dateJolie = new Date(p.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'}); }catch(e){ dateJolie = p.date||""; }
      
      if(statut === "en attente"){
        totalAttente += Number(p.montant || 0);
        htmlAttente += `<div style="background:#FFF9C4;padding:12px;border-radius:12px;margin:8px 0;border:2px solid #FFC107">
          <b>⏳ EN ATTENTE - ${p.enfantNom}</b> - <b>${p.montant} FCFA</b><br>
          <small>📝 ${p.motif} • 💳 ${p.mode} • 👤 ${p.parentNom||""} • 📱 ${p.parentTel||""}<br>📅 ${dateJolie}</small><br>
          <button onclick="validerPaiement('${id}')" style="background:#66BB6A;color:white;border:none;padding:8px 14px;border-radius:8px;font-weight:800;margin-top:8px;cursor:pointer">✅ Valider</button>
          <button onclick="refuserPaiement('${id}')" style="background:#EF5350;color:white;border:none;padding:8px 14px;border-radius:8px;font-weight:800;margin-top:8px;margin-left:6px;cursor:pointer">❌ Refuser</button>
        </div>`;
      } else if(statut === "paye"){
        totalValide += Number(p.montant || 0);
        htmlValide += `<div style="background:#FDF8EE;padding:12px;border-radius:12px;margin:8px 0;border:1px solid #FDE68A">
          <b>💰 ${p.enfantNom}</b> - <b>${p.montant} FCFA</b> <span style="background:#66BB6A;color:white;padding:2px 8px;border-radius:20px;font-size:11px">✅ VALIDÉ</span><br>
          <small>📝 ${p.motif} • 💳 ${p.mode} • 👤 ${p.parentNom||""} • 📱 ${p.parentTel||""}<br>📅 ${dateJolie}</small>
        </div>`;
      }
      // Si statut = refuse, on ne l'affiche pas dans le total, on le cache
    });
    box.innerHTML = `<h3 style="text-align:center">💰 Total validé : ${totalValide.toLocaleString('fr-FR')} FCFA</h3>
    <p style="text-align:center;color:#E65100;font-weight:700">⏳ En attente : ${totalAttente.toLocaleString('fr-FR')} FCFA</p>
    <h3 style="text-align:center;color:#E65100">⏳ En attente de validation</h3>` + (htmlAttente || `<p style="text-align:center">Aucun paiement en attente.</p>`) + `<h3 style="text-align:center">✅ Paiements validés</h3>` + htmlValide;
  }catch(e){
    box.innerHTML = "❌ " + e.message;
  }
}