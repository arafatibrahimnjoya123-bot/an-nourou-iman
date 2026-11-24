function changerTypeIns(){
  let radio = document.querySelector('input[name=typeIns]:checked');
  let type = radio ? radio.value : "Ecole";
  let blocE = document.getElementById('blocEcole');
  let blocG = document.getElementById('blocGroupe');
  if(blocE) blocE.style.display = type==='Ecole' ? 'block' : 'none';
  if(blocG) blocG.style.display = type==='Groupe' ? 'block' : 'none';
}

async function envoyerInscription(){
  let radio = document.querySelector('input[name=typeIns]:checked');
  let type = radio ? radio.value : "Ecole";

  // FIX : maintenant ce sont des NOMS, pas des ID
  let ecoleNomChoisi = document.getElementById('insEcole').value;
  let groupeNomChoisi = document.getElementById('insGroupe').value;
  let niveau = document.getElementById('insNiveau').value;
  let enfant = document.getElementById('insEnfant').value.trim();
  let dateNaissance = document.getElementById('insDateNaissance').value;
  let lieuNaissance = document.getElementById('insLieuNaissance').value.trim();
  let parent = document.getElementById('insParent').value.trim();
  let tel = document.getElementById('insTel').value.trim();
  let quartier = document.getElementById('insQuartier').value.trim();
  let ville = document.getElementById('insVille') ? document.getElementById('insVille').value.trim() : "";
  let dispo = document.getElementById('insDispo') ? document.getElementById('insDispo').value : "";
  let msg = document.getElementById('msgInscription');

  if(type==='Ecole' && !ecoleNomChoisi){ msg.textContent="⚠️ Choisis d'abord l'école"; msg.style.color="red"; return; }
  if(type==='Groupe' && !groupeNomChoisi){ msg.textContent="⚠️ Choisis un groupe"; msg.style.color="red"; return; }
  if(type==='Groupe' && groupeNomChoisi==="Nouveau groupe demandé" && !ville){ msg.textContent="⚠️ Mets ta ville / quartier pour créer ton groupe"; msg.style.color="red"; return; }
  if(!enfant || !parent || !tel || !dateNaissance || !lieuNaissance){ msg.textContent="⚠️ Remplis Enfant, Date, Lieu, Parent et WhatsApp"; msg.style.color="red"; return; }

  let age = Math.floor((new Date() - new Date(dateNaissance)) / (1000*60*60*24*365.25));

  // FIX : on cherche par NOM ou par ID - ça marche dans les 2 cas
  let ecole = (typeof toutesEcoles !== 'undefined') ? toutesEcoles.find(e=> e.nom===ecoleNomChoisi || e.id===ecoleNomChoisi) : null;
  let groupe = (typeof tousGroupes !== 'undefined') ? tousGroupes.find(g=> g.nom===groupeNomChoisi || g.id===groupeNomChoisi) : null;

  msg.textContent="⏳ Envoi..."; msg.style.color="black";
  try{
    await db.collection("inscriptions").add({
      type: type || "",
      ecoleId: type === 'Ecole' ? (ecole ? ecole.id : "") : "",
      ecoleNom: type === 'Ecole' ? (ecole ? ecole.nom : ecoleNomChoisi) : "",
      ecoleQuartier: (ecole && (ecole.quartier || ecole.ville)) || "",
      groupeId: type === 'Groupe' ? (groupe ? groupe.id : "") : "",
      groupeNom: type === 'Groupe' ? (groupe ? groupe.nom : groupeNomChoisi) : "",
      groupeVille: (groupe && (groupe.ville || groupe.quartier)) || ville || "",
      ville: ville || "",
      dispo: dispo || "",
      niveau: niveau || "",
      enfant: enfant || "",
      age: age || 0,
      dateNaissance: dateNaissance || "",
      lieuNaissance: lieuNaissance || "",
      parent: parent || "",
      tel: tel || "",
      quartier: quartier || "",
      date: new Date().toISOString(),
      statut: "Nouvelle"
    });
    
    msg.textContent = "✅ Inscription envoyée ! Le Directeur va te contacter. Barakallahou Fik.";
    msg.style.color="green";

    // B - WHATSAPP AUTO
    let nomLieu = ecole ? ecole.nom : (groupe ? groupe.nom : ville);
    let messageWA = "Assalamou Aleykoum " + parent + ", merci pour l'inscription de " + enfant + " à An Nourou Iman (" + nomLieu + "). Nous avons bien reçu votre demande. Le Directeur va vous recontacter.";
    let telClean = String(tel).replace(/[^0-9]/g,'').slice(-9);
    let lienWA = "https://wa.me/237" + telClean + "?text=" + encodeURIComponent(messageWA);
    window.open(lienWA, "_blank");

    document.getElementById('insEnfant').value=""; 
    document.getElementById('insDateNaissance').value=""; 
    document.getElementById('insLieuNaissance').value=""; 
    document.getElementById('insParent').value=""; 
    document.getElementById('insTel').value="";
    document.getElementById('insQuartier').value="";
    if(document.getElementById('insVille')) document.getElementById('insVille').value="";
  }catch(e){ msg.textContent="❌ "+e.message; msg.style.color="red"; }
}

// FIX : On attend que la page soit prête avant de charger
document.addEventListener('DOMContentLoaded', ()=>{
  if(typeof chargerEcoles === 'function') chargerEcoles();
  if(typeof chargerGroupes === 'function') chargerGroupes();
  changerTypeIns();
  let savedLang = localStorage.getItem('langue_groupe');
  if(savedLang && typeof changerLangue === 'function') setTimeout(()=>changerLangue(savedLang), 400);
});