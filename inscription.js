// ===== inscription.js CORRIGÉ - MÊMES CHAMPS QUE index.html / GESTION / ADMIN / RÉSULTATS =====
function changerTypeIns(){
  let radio = document.querySelector('input[name=typeIns]:checked');
  let type = radio ? radio.value : "Ecole";
  let blocE = document.getElementById('blocEcole');
  let blocG = document.getElementById('blocGroupe');
  if(blocE) blocE.style.display = type==='Ecole' ? 'block' : 'none';
  if(blocG) blocG.style.display = type==='Groupe' ? 'block' : 'none';
}

function nettoyerTelInscription(t){
  // ✅ Pareil partout : on enlève +237, espaces, tirets → juste 9 chiffres
  return String(t||"").replace(/[^0-9]/g,"").replace(/^237/,"").slice(-9);
}

async function envoyerInscription(){
  let radio = document.querySelector('input[name=typeIns]:checked');
  let type = radio ? radio.value : "Ecole";

  let ecoleVal = document.getElementById('insEcole')?.value || "";
  let groupeVal = document.getElementById('insGroupe')?.value || "";
  let niveau = document.getElementById('insNiveau')?.value || "";
  let enfant = document.getElementById('insEnfant')?.value.trim() || "";
  let dateNaissance = document.getElementById('insDateNaissance')?.value || "";
  let lieuNaissance = document.getElementById('insLieuNaissance')?.value.trim() || "";
  let sexe = document.getElementById('insSexe')?.value || ""; // ✅ NOUVEAU : il faut le champ Sexe dans le HTML
  let parent = document.getElementById('insParent')?.value.trim() || "";
  let telBrut = document.getElementById('insTel')?.value || "";
  let tel = nettoyerTelInscription(telBrut);
  let quartier = document.getElementById('insQuartier')?.value.trim() || "";
  let ville = document.getElementById('insVille') ? document.getElementById('insVille').value.trim() : "";
  let dispo = document.getElementById('insDispo') ? document.getElementById('insDispo').value : "";
  let msg = document.getElementById('msgInscription');

  if(type==='Ecole' && !ecoleVal){ msg.textContent="⚠️ Choisis d'abord l'école"; msg.style.color="red"; return; }
  if(type==='Groupe' && !groupeVal){ msg.textContent="⚠️ Choisis un groupe"; msg.style.color="red"; return; }
  if(type==='Groupe' && groupeVal==="Nouveau groupe demandé" && !ville){ msg.textContent="⚠️ Mets ta ville / quartier pour créer ton groupe"; msg.style.color="red"; return; }
  if(!enfant || !parent || !tel || !dateNaissance || !lieuNaissance || !sexe){
    msg.textContent="⚠️ Remplis Enfant, Date, Lieu, Sexe, Parent et WhatsApp"; msg.style.color="red"; return;
  }
  if(tel.length < 9){ msg.textContent="⚠️ Téléphone incomplet. Mets 9 chiffres, ex : 697919116"; msg.style.color="red"; return; }
  if(new Date(dateNaissance) > new Date()){ msg.textContent="⚠️ Date de naissance dans le futur ? Vérifie."; msg.style.color="red"; return; }

  let age = Math.floor((new Date() - new Date(dateNaissance)) / (1000*60*60*24*365.25));

  // ✅ On cherche par ID || NOM - ça marche dans les 2 cas, comme avant
  // On supporte les 2 noms de variables : toutesEcoles / ECOLES_INSCRIPTION, tousGroupes / GROUPES_INSCRIPTION
  let listeEcoles = (typeof toutesEcoles !== 'undefined' && toutesEcoles.length) ? toutesEcoles : (typeof ECOLES_INSCRIPTION !== 'undefined' ? ECOLES_INSCRIPTION : []);
  let listeGroupes = (typeof tousGroupes !== 'undefined' && tousGroupes.length) ? tousGroupes : (typeof GROUPES_INSCRIPTION !== 'undefined' ? GROUPES_INSCRIPTION : []);

  let ecoleNomChoisi = "", ecoleIdChoisi = "", ecoleQuartierChoisi = "";
  let groupeNomChoisi = "", groupeIdChoisi = "", groupeVilleChoisie = "";

  if(type==='Ecole'){
    // Le select peut être "id||nom" (index.html corrigé) ou juste "nom" (ancien)
    let parts = String(ecoleVal).split("||");
    if(parts.length===2){ ecoleIdChoisi = parts[0]; ecoleNomChoisi = parts[1]; }
    else ecoleNomChoisi = ecoleVal;
    let ecole = listeEcoles.find(e=> e.nom===ecoleNomChoisi || e.id===ecoleNomChoisi || e.id===ecoleIdChoisi);
    if(ecole){ ecoleIdChoisi = ecole.id || ecoleIdChoisi; ecoleNomChoisi = ecole.nom || ecoleNomChoisi; ecoleQuartierChoisi = ecole.quartier || ecole.ville || ""; }
  }
  if(type==='Groupe'){
    let parts = String(groupeVal).split("||");
    if(parts.length===2){ groupeIdChoisi = parts[0]; groupeNomChoisi = parts[1]; }
    else groupeNomChoisi = groupeVal;
    let groupe = listeGroupes.find(g=> g.nom===groupeNomChoisi || g.id===groupeNomChoisi || g.id===groupeIdChoisi);
    if(groupe){ groupeIdChoisi = groupe.id || groupeIdChoisi; groupeNomChoisi = groupe.nom || groupeNomChoisi; groupeVilleChoisie = groupe.ville || groupe.quartier || ""; }
  }

  msg.textContent="⏳ Envoi..."; msg.style.color="black";
  try{
    // ✅ ANTI-DOUBLON : même enfant + même téléphone = déjà inscrit
    let deja = await db.collection("inscriptions").where("tel","==",tel).get();
    let existe = false;
    deja.forEach(d=>{
      let c = d.data();
      let nomBdd = String(c.enfant||c.nomEnfant||"").trim().toLowerCase();
      if(nomBdd === enfant.trim().toLowerCase()) existe = true;
    });
    if(existe){
      msg.textContent = "⚠️ "+enfant+" est déjà inscrit avec ce téléphone ("+tel+"). Va voir le Directeur si tu veux modifier.";
      msg.style.color="red"; return;
    }

    await db.collection("inscriptions").add({
      // ✅ MÊMES CHAMPS QUE index.html corrigé, Gestion, Admin, Résultats
      type: type || "",
      enfant: enfant || "",
      nomEnfant: enfant || "",
      parent: parent || "",
      tel: tel || "",
      telephone: tel || "",
      telParent: tel || "",
      niveau: niveau || "",
      classe: niveau || "",
      age: age || 0,
      dateNaissance: dateNaissance || "",
      naissance: dateNaissance || "",
      lieuNaissance: lieuNaissance || "",
      sexe: sexe || "",
      genre: sexe || "",
      quartier: quartier || "",
      ville: ville || groupeVilleChoisie || "",
      dispo: dispo || "",
      disponibilite: dispo || "",
      // ✅ École : on envoie ecole + ecoleNom + ecoleId, pas juste ecoleNom
      ecole: type==='Ecole' ? ecoleNomChoisi : "",
      ecoleNom: type==='Ecole' ? ecoleNomChoisi : "",
      ecoleId: type==='Ecole' ? ecoleIdChoisi : "",
      ecoleQuartier: ecoleQuartierChoisi || "",
      // ✅ Groupe : on envoie groupe + groupeNom + groupeId
      groupe: type==='Groupe' ? groupeNomChoisi : "",
      groupeNom: type==='Groupe' ? groupeNomChoisi : "",
      groupeId: type==='Groupe' ? groupeIdChoisi : "",
      groupeVille: groupeVilleChoisie || ville || "",
      groupeQuartier: ville || "",
      // ✅ STATUT CORRIGÉ : en_attente, pas "Nouvelle" - le DG valide dans Admin
      statut: "en_attente",
      status: "en_attente",
      date: new Date().toLocaleDateString('fr-FR'),
      dateInscription: new Date().toLocaleDateString('fr-FR'),
      createdAt: new Date()
    });

    msg.textContent = "✅ Inscription envoyée pour "+enfant+" - "+(type==='Ecole' ? ecoleNomChoisi : groupeNomChoisi)+". Le Directeur va la valider. Garde bien ce téléphone : "+tel+" pour voir les résultats.";
    msg.style.color="green";

    // B - WHATSAPP AUTO - on garde ton idée
    let nomLieu = type==='Ecole' ? ecoleNomChoisi : (groupeNomChoisi || ville);
    let messageWA = "Assalamou Aleykoum " + parent + ", merci pour l'inscription de " + enfant + " à An Nourou Iman (" + nomLieu + "). Nous avons bien reçu votre demande. Le Directeur va vous recontacter.";
    let lienWA = "https://wa.me/237" + tel + "?text=" + encodeURIComponent(messageWA);
    window.open(lienWA, "_blank");

    document.getElementById('insEnfant').value="";
    document.getElementById('insDateNaissance').value="";
    document.getElementById('insLieuNaissance').value="";
    document.getElementById('insParent').value="";
    document.getElementById('insTel').value="";
    document.getElementById('insQuartier').value="";
    if(document.getElementById('insSexe')) document.getElementById('insSexe').value="";
    if(document.getElementById('insVille')) document.getElementById('insVille').value="";
    try{ if(typeof chargerElevesPaiementAccueil==='function') chargerElevesPaiementAccueil(); }catch(e){}
  }catch(e){ msg.textContent="❌ "+e.message; msg.style.color="red"; }
}

// FIX : On attend que la page soit prête avant de charger
document.addEventListener('DOMContentLoaded', ()=>{
  if(typeof chargerEcoles === 'function') chargerEcoles();
  if(typeof chargerGroupes === 'function') chargerGroupes();
  if(typeof chargerEcolesGroupesInscription === 'function') chargerEcolesGroupesInscription();
  changerTypeIns();
  let savedLang = localStorage.getItem('langue_groupe');
  if(savedLang && typeof changerLangue === 'function') setTimeout(()=>changerLangue(savedLang), 400);
});