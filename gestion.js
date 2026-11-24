// GESTION - Institut Nouroul Iymane
// NOUVEAU SYSTÈME :
// - Directeur -> voit TOUTES les écoles
// - Secrétaire du Directeur -> voit TOUTES les écoles
// - Sous-Directeur -> voit SEULEMENT SON école
let monEcoleId = "";
let monEcoleNom = "";
let monEcoleData = null;
let emailSD = "";
let passwordSD = "";
let filtreEleveActuel = "tous";
let filtrePaiementActuel = "tous";
let TOUS_ELEVES_GESTION = [];
let TOUS_PAIEMENTS_GESTION = [];
let TOUS_ENSEIGNANTS = [];
let TOUS_BULLETINS = [];
let TOUS_PRESENCES = [];
let fraisTotal = 0;
let typeComposition = "Oral + Écrit";
let matieresActivesIds = [];
let monRoleGestion = "sous-directeur"; // directeur | secretaire | sous-directeur
let modeToutesEcoles = false; // true = Directeur / Secrétaire, false = Sous-Directeur

const NOM_ECOLE_AR = "معهد نور الإيمان";
const MATIERES_AR = {"Coran":"القرآن","Hadith":"الحديث","Aquida":"العقيدة","Fiqh":"الفقه","Langue Arabe":"اللغة العربية","Sirah":"السيرة","Tawhid":"التوحيد","Adhab":"الآداب","Mémorisation":"الحفظ","Lecture":"القراءة","Écriture":"الكتابة","Mathématiques":"الرياضيات","Français":"الفرنسية"};

const MATIERES_ISLAMIQUES = [
  {id:"coran", fr:"Coran", ar:"القرآن", desc:"Mémorisation et récitation du Coran"},
  {id:"hadith", fr:"Hadith", ar:"الحديث", desc:"Paroles du Prophète ﷺ"},
  {id:"aqida", fr:"Aquida", ar:"العقيدة", desc:"Croyance islamique"},
  {id:"fiqh", fr:"Fiqh", ar:"الفقه", desc:"Jurisprudence islamique"},
  {id:"arabe", fr:"Langue Arabe", ar:"اللغة العربية", desc:"Lecture, écriture et grammaire arabe"},
  {id:"sira", fr:"Sirah", ar:"السيرة", desc:"Vie du Prophète ﷺ"},
  {id:"tawhid", fr:"Tawhid", ar:"التوحيد", desc:"Unicité d'Allah"},
  {id:"adhab", fr:"Adhab", ar:"الآداب", desc:"Comportement et bonnes manières"},
  {id:"memo", fr:"Mémorisation", ar:"الحفظ", desc:"Mémorisation Coran / Hadith"},
  {id:"lecture", fr:"Lecture", ar:"القراءة", desc:"Lecture arabe / français"},
  {id:"ecriture", fr:"Écriture", ar:"الكتابة", desc:"Écriture arabe / français"},
  {id:"maths", fr:"Mathématiques", ar:"الرياضيات", desc:"Calcul et mathématiques"},
  {id:"francais", fr:"Français", ar:"الفرنسية", desc:"Langue française"}
];

function nettoyerTelGestion(t){ if(!t) return ""; return String(t).replace(/[\s\-\+]/g,"").replace(/^237/,""); }
function nettoyerEmailGestion(e){ return String(e||"").toLowerCase().trim(); }
function nomMatiereBilingue(fr){ return fr + (MATIERES_AR[fr] ? " - " + MATIERES_AR[fr] : ""); }
function getMatieresActives(){ return MATIERES_ISLAMIQUES.filter(m=>matieresActivesIds.includes(m.id)); }
function getCoefGestion(matiereId){ return 1; }
// ✅ CORRIGÉ SEULEMENT : Formule du Directeur - On divise toujours par le nombre de matières FIXÉES, pas par le nombre composées. Matière manquante = 0
function getNbMatieresFixees(){ let n = getMatieresActives().length; return n > 0 ? n : 1; }
function calculerMoyenneTrimestre(lignes){ let total = 0; lignes.forEach(l=> total += Number(l.moyenne||0)); return total / getNbMatieresFixees(); }

function showTabGestion(id, btn){
  ['tabDashboard','tabEleves','tabPaiements','tabEnseignants','tabBulletins','tabPresence','tabAnnuel','tabParametres'].forEach(x=>{
    let el=document.getElementById(x); if(el) el.style.display='none';
  });
  let cible=document.getElementById(id); if(cible) cible.style.display='block';
  document.querySelectorAll('.gestion-tab').forEach(b=>b.classList.remove('actif'));
  if(btn) btn.classList.add('actif');
  if(id==='tabEleves') chargerElevesGestion();
  if(id==='tabPaiements') chargerPaiementsGestion();
  if(id==='tabEnseignants') chargerEnseignants();
  if(id==='tabBulletins') chargerBulletins();
  if(id==='tabPresence') chargerPresence();
  if(id==='tabAnnuel') chargerBulletins();
  if(id==='tabParametres'){ afficherChoixMatieres(); chargerDivers(); }
}
function toggleMenuFlottant(){ let m=document.getElementById('menuFlottant'); m.style.display=(m.style.display==="block"?"none":"block"); }
function imprimerFeuilleActuelle(){ window.print(); }
function telechargerPDFActuel(){ window.print(); }
function partagerWhatsAppActuel(){ let t="Institut Nouroul Iymane - "+(monEcoleNom||""); window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank"); }

async function seConnecterGestion(){
  let email=nettoyerEmailGestion(document.getElementById('email').value);
  let password=document.getElementById('password').value;
  let msg=document.getElementById('msg');
  if(!email||!password){ msg.textContent="❌ Mets Email et Mot de passe"; return; }
  msg.style.color="#666"; msg.textContent="⏳ Vérification...";
  try{
    let cred=await auth.signInWithEmailAndPassword(email,password);
    emailSD=email; passwordSD=password;
    await chargerMonEcoleGestion(email);
  }catch(e){ msg.style.color="red"; msg.textContent="❌ "+e.message; }
}
function seDeconnecterGestion(){ try{ auth.signOut(); }catch(e){} localStorage.removeItem("gestion_session"); location.reload(); }

// ✅ NOUVEAU : 3 portes d'entrée dans gestion.html
// 1. Directeur -> voit TOUT
// 2. Secrétaire du Directeur -> voit TOUT
// 3. Sous-Directeur -> voit SEULEMENT SON école
async function verifierRoleDirection(email){
  // On cherche dans plusieurs collections possibles, pour ne pas bloquer
  let collections = ["utilisateurs","admins","directeurs","roles","secretaires"];
  for(let col of collections){
    try{
      let snap = await db.collection(col).where("email","==",email).limit(1).get();
      if(!snap.empty){
        let d = snap.docs[0].data();
        let role = String(d.role||d.fonction||d.type||"").toLowerCase();
        if(role.includes("directeur") && !role.includes("sous")) return "directeur";
        if(role.includes("secretaire") || role.includes("secrétaire") || role.includes("secretary")) return "secretaire";
        if(role.includes("directeur")) return "directeur";
      }
    }catch(e){}
  }
  // Sécurité : si l'email contient "directeur" ou "secretaire", on le laisse passer comme direction
  if(email.includes("directeur") || email.includes("director")) return "directeur";
  if(email.includes("secretaire") || email.includes("secret")) return "secretaire";
  return null;
}

async function chargerMonEcoleGestion(email){
  let msg=document.getElementById('msg');
  try{
    // 1. D'abord, est-ce que c'est un Sous-Directeur d'une école ?
    let snap=await db.collection("ecoles").get();
    let trouve=null;
    snap.forEach(doc=>{
      let d=doc.data();
      let em=nettoyerEmailGestion(d.sousDirecteurEmail||d.sousDirecteur||d.sous_directeur||d.emailSousDirecteur||d.email||"");
      if(em===email) trouve={id:doc.id,...d};
    });
    if(!trouve){
      let snapG=await db.collection("groupes").get();
      snapG.forEach(doc=>{
        let d=doc.data();
        let em=nettoyerEmailGestion(d.sousDirecteurEmail||d.sousDirecteur||d.email||"");
        if(em===email) trouve={id:doc.id,...d};
      });
    }
    // 2. Si ce n'est pas un Sous-Directeur, est-ce le Directeur ou le Secrétaire ?
    let roleDirection = null;
    if(!trouve) roleDirection = await verifierRoleDirection(email);
    // 3. Si toujours rien, on regarde si c'est le premier compte Directeur dans ecoles (champ directeurEmail)
    if(!trouve && !roleDirection){
      let snap2=await db.collection("ecoles").get();
      snap2.forEach(doc=>{
        let d=doc.data();
        let emD=nettoyerEmailGestion(d.directeurEmail||d.directeur||d.emailDirecteur||"");
        let emS=nettoyerEmailGestion(d.secretaireEmail||d.secretaire||d.emailSecretaire||"");
        if(emD===email) roleDirection="directeur";
        if(emS===email) roleDirection="secretaire";
      });
    }
    if(trouve){
      // ✅ SOUS-DIRECTEUR : une seule école
      monRoleGestion="sous-directeur"; modeToutesEcoles=false;
      monEcoleId=trouve.id; monEcoleNom=trouve.nom||"École"; monEcoleData=trouve;
    } else if(roleDirection){
      // ✅ DIRECTEUR / SECRÉTAIRE : TOUTES les écoles
      monRoleGestion=roleDirection; modeToutesEcoles=true;
      monEcoleId="TOUTES"; monEcoleNom="TOUTES LES ÉCOLES"; monEcoleData={nom:"TOUTES LES ÉCOLES"};
    } else {
      msg.style.color="red";
      msg.textContent="❌ Email introuvable. Le Directeur doit d'abord te créer dans Admin -> Écoles (comme Sous-Directeur) ou comme Directeur / Secrétaire.";
      return;
    }
    document.getElementById('loginCard').style.display='none';
    document.getElementById('gestionPanel').style.display='block';
    document.getElementById('gestionEmail').textContent=email + " - " + (monRoleGestion==="directeur" ? "👑 DIRECTEUR - Voit tout" : monRoleGestion==="secretaire" ? "📝 SECRÉTAIRE DU DIRECTEUR - Voit tout" : "👨‍💼 SOUS-DIRECTEUR - "+monEcoleNom);
    document.getElementById('topEcole').textContent=monEcoleNom + (modeToutesEcoles ? " (TOUT)" : "");
    document.getElementById('monEcoleNom').textContent=monEcoleNom;
    document.getElementById('dateJour').textContent=new Date().toLocaleDateString('fr-FR');
    localStorage.setItem("gestion_session", JSON.stringify({email, ecoleId:monEcoleId, ecoleNom:monEcoleNom, role:monRoleGestion, toutes:modeToutesEcoles}));
    await chargerConfigMatieres();
    await chargerFraisTotal();
    chargerElevesGestion();
    chargerPaiementsGestion();
    chargerEnseignants();
    chargerBulletins();
    chargerPresence();
  }catch(e){ msg.textContent="❌ "+e.message; }
}

// ✅ Si Directeur / Secrétaire, il voit TOUT, sinon seulement son école
function estAMoiGestion(d){
  if(modeToutesEcoles) return true;
  let e=(d.ecole||d.ecoleNom||"").toLowerCase();
  let g=(d.groupe||d.groupeNom||"").toLowerCase();
  let nom=(monEcoleNom||"").toLowerCase();
  if(!nom || nom==="toutes les écoles") return true;
  return e.includes(nom) || g.includes(nom) || !d.ecole;
}

// ✅ CORRECTION MATIÈRES : UN SEUL document canonique
async function publierMatieresPourSousDirecteur(){
  try{
    if(!monEcoleId && !monEcoleNom) return;
    let matieresDetail = getMatieresActives().map(m=>({id:m.id, fr:m.fr, ar:(m.ar||MATIERES_AR[m.fr]||""), nom:m.fr, nomBilingue:nomMatiereBilingue(m.fr), desc:m.desc||"", perso:!!m.perso}));
    let payload = {ecoleId:monEcoleId||"", ecoleNom:monEcoleNom||"", ecoleNomAr:NOM_ECOLE_AR, matieres:matieresActivesIds, matieresDetail:matieresDetail, matieresNoms:matieresDetail.map(m=>m.fr), typeComposition:typeComposition, date:new Date().toISOString()};
    await db.collection("matieres_publiees").doc("AN_NOUROU_IMAN").set(payload);
    if(monEcoleId && monEcoleId!=="TOUTES") await db.collection("matieres_publiees").doc(monEcoleId).set(payload);
    if(monEcoleId && monEcoleId!=="TOUTES") await db.collection("configMatieres").doc(monEcoleId).set(payload);
  }catch(e){ console.log("Pont matières:", e.message); }
}
function appliquerConfigMatieres(data){
  if(!data) return false;
  let liste = data.matieres || data.matieresActives || null;
  if(!liste || !liste.length) return false;
  if(data.matieresDetail && Array.isArray(data.matieresDetail)){
    data.matieresDetail.forEach(m=>{
      if(!MATIERES_ISLAMIQUES.find(x=>x.id===m.id)){
        MATIERES_ISLAMIQUES.push({id:m.id, fr:m.fr||m.nom, ar:m.ar||MATIERES_AR[m.fr||m.nom]||"", desc:m.desc||"Matière ajoutée par l'école", perso:!!m.perso});
      }
    });
  }
  matieresActivesIds = liste.slice();
  if(data.typeComposition) typeComposition = data.typeComposition;
  return true;
}
// ✅ CORRECTION : on prend le doc avec LE PLUS de matières, pas le premier
async function chargerConfigMatieres(){
  chargerMatieresPerso();
  try{ let locT = localStorage.getItem("typeComposition_"+monEcoleId); if(locT) typeComposition = locT; }catch(e){}
  try{
    let snap = await db.collection("matieres_publiees").limit(100).get();
    let meilleur = null, maxNb = 0;
    snap.forEach(doc=>{
      let d = doc.data();
      let nb = (d.matieresDetail && d.matieresDetail.length) || (d.matieres && d.matieres.length) || (d.matieresNoms && d.matieresNoms.length) || 0;
      if(nb > maxNb){ maxNb = nb; meilleur = d; }
    });
    if(meilleur && appliquerConfigMatieres(meilleur)){ majTitresFeuilles(); afficherChoixMatieres(); return; }
  }catch(e){}
  try{
    if(monEcoleId && monEcoleId!=="TOUTES"){
      let doc = await db.collection("configMatieres").doc(monEcoleId).get();
      if(doc.exists && doc.data().matieres && doc.data().matieres.length){
        matieresActivesIds = doc.data().matieres;
        if(doc.data().typeComposition) typeComposition = doc.data().typeComposition;
        majTitresFeuilles(); afficherChoixMatieres(); return;
      }
    }
  }catch(e){}
  try{ let loc = localStorage.getItem("matieresActives_"+monEcoleId); if(loc){ let arr = JSON.parse(loc); if(arr.length) matieresActivesIds = arr; } }catch(e){}
  majTitresFeuilles(); afficherChoixMatieres();
}
function chargerMatieresPerso(){
  try{
    let perso = JSON.parse(localStorage.getItem("matieresPerso_"+monEcoleId)||"[]");
    perso.forEach(m=>{ if(!MATIERES_ISLAMIQUES.find(x=>x.id===m.id)) MATIERES_ISLAMIQUES.push(m); });
  }catch(e){}
}
function majTitresFeuilles(){
  let noms = getMatieresActives().map(m=>m.fr).join(", ") || "Toutes";
  ["affichageMatieresActives","affichageMatieresBulletin","affichageMatieresAnnuel","affichageMatieresParametres"].forEach(id=>{
    let el=document.getElementById(id); if(el) el.textContent=noms;
  });
  ["affichageTypeComposition","affichageTypeCompositionBulletin","affichageTypeCompositionParam"].forEach(id=>{
    let el=document.getElementById(id); if(el) el.textContent=typeComposition;
  });
  let elF=document.getElementById('affichageFraisTotal'); if(elF) elF.textContent=fraisTotal?fraisTotal+" FCFA":"Non défini";
  ["titreEcoleEleves","titreEcolePresence","titreEcoleAnnuel","titreEcolePaiements","titreEcoleEnseignants"].forEach(id=>{
    let el=document.getElementById(id); if(el) el.textContent=monEcoleNom||"";
  });
  let elF2=document.getElementById('titreFraisEleves'); if(elF2) elF2.textContent=fraisTotal||0;
  let elD=document.getElementById('titreDateEleves'); if(elD) elD.textContent=new Date().toLocaleDateString('fr-FR');
  let elDP=document.getElementById('titreDatePresence'); if(elDP) elDP.textContent=new Date().toLocaleDateString('fr-FR');
  let elA=document.getElementById('titreEcoleArabe'); if(elA) elA.textContent=NOM_ECOLE_AR;
}
function afficherChoixMatieres(){
  let box=document.getElementById('listeChoixMatieres'); if(!box) return;
  let html="";
  MATIERES_ISLAMIQUES.forEach(m=>{
    let coche = matieresActivesIds.includes(m.id) ? "checked" : "";
    html+=`<label class="matiere-check"><input type="checkbox" class="check-matiere" value="${m.id}" ${coche}> <span><b>${m.fr}</b> - ${m.ar||""}<br><small style="color:#666">${m.desc||""}</small></span></label>`;
  });
  box.innerHTML=html;
  majTitresFeuilles();
}
function toutCocherMatieres(){ document.querySelectorAll('.check-matiere').forEach(c=>c.checked=true); }
function toutDecocherMatieres(){ document.querySelectorAll('.check-matiere').forEach(c=>c.checked=false); }
async function sauvegarderMatieresActives(){
  let coches=[...document.querySelectorAll('.check-matiere:checked')].map(c=>c.value);
  let msg=document.getElementById('msgMatieres');
  if(!coches.length){ msg.style.color="red"; msg.textContent="❌ Coche au moins 1 matière"; return; }
  matieresActivesIds=coches;
  try{ localStorage.setItem("matieresActives_"+monEcoleId, JSON.stringify(coches)); }catch(e){}
  try{ localStorage.setItem("typeComposition_"+monEcoleId, typeComposition); }catch(e){}
  try{
    if(monEcoleId && monEcoleId!=="TOUTES") await db.collection("configMatieres").doc(monEcoleId).set({ecoleId:monEcoleId, ecoleNom:monEcoleNom, matieres:coches, typeComposition:typeComposition, date:new Date().toISOString()});
  }catch(e){ console.log(e.message); }
  await publierMatieresPourSousDirecteur();
  majTitresFeuilles(); afficherChoixMatieres();
  msg.style.color="green"; msg.textContent="✅ Matières enregistrées : "+getMatieresActives().map(m=>m.fr).join(", ")+" - Le Sous-Directeur les voit maintenant.";
  chargerElevesGestion();
}
async function chargerFraisTotal(){
  try{
    if(monEcoleId && monEcoleId!=="TOUTES"){
      let doc=await db.collection("configMatieres").doc(monEcoleId).get();
      if(doc.exists && doc.data().fraisTotal) fraisTotal=Number(doc.data().fraisTotal||0);
    }
  }catch(e){}
  try{ let loc=localStorage.getItem("fraisTotal_"+monEcoleId); if(loc) fraisTotal=Number(loc||0); }catch(e){}
  majTitresFeuilles();
}
async function definirFraisTotal(){
  let v=Number(document.getElementById('inputFraisTotal').value||0);
  if(!v){ alert("Mets un montant"); return; }
  fraisTotal=v;
  try{ localStorage.setItem("fraisTotal_"+monEcoleId, String(v)); }catch(e){}
  try{ if(monEcoleId && monEcoleId!=="TOUTES") await db.collection("configMatieres").doc(monEcoleId).set({ecoleId:monEcoleId, ecoleNom:monEcoleNom, fraisTotal:v, matieres:matieresActivesIds, typeComposition:typeComposition, date:new Date().toISOString()}, {merge:true}); }catch(e){}
  majTitresFeuilles();
  alert("✅ Frais défini : "+v+" FCFA");
}

// ---------- ÉLÈVES ----------
async function chargerElevesGestion(){
  let box=document.getElementById('listeElevesGestion'); if(!box) return;
  try{
    let snap=await db.collection("inscriptions").limit(200).get();
    TOUS_ELEVES_GESTION=[];
    snap.forEach(doc=>{ let d={id:doc.id,...doc.data()}; if(estAMoiGestion(d)) TOUS_ELEVES_GESTION.push(d); });
    let snapP=await db.collection("paiements").limit(200).get();
    TOUS_PAIEMENTS_GESTION=[]; snapP.forEach(doc=>TOUS_PAIEMENTS_GESTION.push({id:doc.id,...doc.data()}));
    afficherElevesGestion(filtreEleveActuel);
    majDashboard();
  }catch(e){ box.innerHTML="❌ "+e.message; }
}
function soldeEleve(nom){
  let totalPaye=0;
  TOUS_PAIEMENTS_GESTION.forEach(p=>{ if((p.enfant||"").toLowerCase()===(nom||"").toLowerCase() && p.statut==="valide") totalPaye+=Number(p.montant||0); });
  let reste=Math.max(0, fraisTotal - totalPaye);
  let statut = fraisTotal>0 && totalPaye>=fraisTotal ? "paye" : totalPaye>0 ? "avance" : "nonpaye";
  return {totalPaye, reste, statut};
}
function majDashboard(){
  let total=TOUS_ELEVES_GESTION.length;
  let accepte=TOUS_ELEVES_GESTION.filter(e=>e.statut==="valide"||e.statut==="validé").length;
  let attente=total-accepte;
  let paye=0, nonpaye=0, encaisse=0;
  TOUS_ELEVES_GESTION.forEach(e=>{
    let nom=e.enfant||e.nomEnfant||"";
    let s=soldeEleve(nom);
    encaisse+=s.totalPaye;
    if(s.statut==="paye") paye++; else nonpaye++;
  });
  let el=(id,v)=>{ let e=document.getElementById(id); if(e) e.textContent=v; };
  el('statTotal',total); el('statAccepte',accepte); el('statEnAttente',attente); el('statPaye',paye); el('statNonPaye',nonpaye); el('statMontant',encaisse+" FCFA");
  let alertBox=document.getElementById('alertesJour');
  if(alertBox) alertBox.innerHTML = nonpaye>0 ? `🔴 <b>${nonpaye}</b> élève(s) doivent encore payer. Va dans Paiements > Relancer impayés.` : `🎉 Tout le monde a payé. Alhamdoulillah.`;
  let der=document.getElementById('derniersPaiementsDashboard');
  if(der){
    let h=""; TOUS_PAIEMENTS_GESTION.slice(-5).reverse().forEach(p=>{ h+=`<p style="font-size:12px">💰 <b>${p.enfant||""}</b> - ${p.montant||0} FCFA - ${p.motif||""} - ${p.statut||""}</p>`; });
    der.innerHTML=h||"<p class='muted centre'>Aucun paiement.</p>";
  }
  let selP=document.getElementById('paiementEleve');
  if(selP){
    let cur=selP.value;
    selP.innerHTML=`<option value="">— Choisis l'élève —</option>`;
    TOUS_ELEVES_GESTION.forEach(e=>{ let nom=e.enfant||e.nomEnfant||""; selP.innerHTML+=`<option value="${nom}">${nom} - ${e.niveau||""} - ${e.ecole||e.groupe||""}</option>`; });
    if(cur) selP.value=cur;
  }
  let selB=document.getElementById('bulEleve');
  if(selB){
    let cur=selB.value;
    selB.innerHTML=`<option value="">— Choisis l'élève —</option>`;
    TOUS_ELEVES_GESTION.forEach(e=>{ let nom=e.enfant||e.nomEnfant||""; selB.innerHTML+=`<option value="${nom}">${nom} - ${e.ecole||e.groupe||""}</option>`; });
    if(cur) selB.value=cur;
  }
}
function afficherElevesGestion(filtre){
  let box=document.getElementById('listeElevesGestion'); if(!box) return;
  let q=(document.getElementById('rechercheEleve')?.value||"").toLowerCase();
  let liste=TOUS_ELEVES_GESTION.filter(e=>{
    let nom=e.enfant||e.nomEnfant||"";
    let s=soldeEleve(nom);
    if(filtre==="paye" && s.statut!=="paye") return false;
    if(filtre==="avance" && s.statut!=="avance") return false;
    if(filtre==="nonpaye" && s.statut!=="nonpaye") return false;
    if(filtre==="attente" && (e.statut==="valide"||e.statut==="validé")) return false;
    if(filtre==="accepte" && !(e.statut==="valide"||e.statut==="validé")) return false;
    if(q && !JSON.stringify(e).toLowerCase().includes(q)) return false;
    return true;
  });
  if(!liste.length){ box.innerHTML=`<p class="centre muted">Aucun élève.</p>`; return; }
  let html=`<table class="table-blanc"><thead><tr><th>Enfant</th><th>Parent</th><th>Niveau / École</th><th>Paiement</th><th>Statut DG</th><th>Action</th></tr></thead><tbody>`;
  liste.forEach(e=>{
    let nom=e.enfant||e.nomEnfant||"";
    let s=soldeEleve(nom);
    let badgePaye = s.statut==="paye" ? `<span class="badge badge-paye">✓ PAYÉ</span>` : s.statut==="avance" ? `<span class="badge badge-avance">◐ AVANCE ${s.totalPaye}/${fraisTotal}</span>` : `<span class="badge badge-nonpaye">✗ NON PAYÉ - Reste ${s.reste}</span>`;
    let badgeDG = (e.statut==="valide"||e.statut==="validé") ? `<span class="badge badge-accepte">ACCEPTÉ DG</span>` : `<span class="badge badge-attente">EN ATTENTE DG</span>`;
    html+=`<tr><td><b>${nom}</b></td><td>${e.parent||""}<br><small>${e.tel||""}</small></td><td>${e.niveau||""}<br><small>${e.ecole||e.groupe||""}</small></td><td>${badgePaye}</td><td>${badgeDG}</td><td><button class="lien-action" onclick="validerEleveGestion('${e.id}')">✅ Valider DG</button></td></tr>`;
  });
  html+=`</tbody></table>`; box.innerHTML=html;
}
function filtrerEleves(filtre, btn){
  filtreEleveActuel=filtre;
  document.querySelectorAll('#tabEleves .btn-filtre').forEach(b=>b.classList.remove('actif'));
  if(btn) btn.classList.add('actif');
  afficherElevesGestion(filtre);
}
async function validerEleveGestion(id){
  try{ await db.collection("inscriptions").doc(id).update({statut:"valide"}); chargerElevesGestion(); }catch(e){ alert("❌ "+e.message); }
}
function telechargerListeElevesPDF(){ window.print(); }
function telechargerEleves(){
  let txt="📋 LISTE ÉLÈVES - "+monEcoleNom+"\n";
  TOUS_ELEVES_GESTION.forEach(e=>{ txt+=`- ${e.enfant||e.nomEnfant||""} - ${e.niveau||""} - ${e.ecole||e.groupe||""} - ${e.parent||""}\n`; });
  window.open("https://wa.me/?text="+encodeURIComponent(txt),"_blank");
}
// ---------- PAIEMENTS ----------
function onElevePaiementChange(){
  let nom=document.getElementById('paiementEleve').value;
  let eleve=TOUS_ELEVES_GESTION.find(e=>(e.enfant||e.nomEnfant||"")===nom);
  document.getElementById('paiementClasse').value=eleve?eleve.niveau||"":"";
  let box=document.getElementById('infoSoldeEleve');
  if(!eleve){ box.style.display="none"; return; }
  let s=soldeEleve(nom);
  box.style.display="block";
  box.innerHTML=`<b>${nom}</b> - ${eleve.ecole||eleve.groupe||""} - Déjà payé : <b>${s.totalPaye} FCFA</b> - Reste : <b style="color:red">${s.reste} FCFA</b> - Frais total : ${fraisTotal} FCFA`;
  calculerResteApresPaiement();
}
function calculerResteApresPaiement(){
  let nom=document.getElementById('paiementEleve').value;
  let m=Number(document.getElementById('paiementMontant').value||0);
  let box=document.getElementById('apercuApresPaiement');
  if(!nom||!m){ box.style.display="none"; return; }
  let s=soldeEleve(nom);
  let resteApres=Math.max(0, s.reste - m);
  box.style.display="block";
  box.innerHTML=`Après ce paiement de <b>${m} FCFA</b>, il restera : <b>${resteApres} FCFA</b>`;
}
async function enregistrerPaiementFormulaire(){
  let eleve=document.getElementById('paiementEleve').value;
  let montant=Number(document.getElementById('paiementMontant').value||0);
  let motif=document.getElementById('paiementMotif').value;
  let date=document.getElementById('paiementDate').value;
  let msg=document.getElementById('msgPaiement');
  if(!eleve||!montant){ msg.style.color="red"; msg.textContent="❌ Choisis l'élève et le montant"; return; }
  let e=TOUS_ELEVES_GESTION.find(x=>(x.enfant||x.nomEnfant||"")===eleve);
  try{
    await db.collection("paiements").add({enfant:eleve, parent:e?e.parent||"":"", tel:e?e.tel||"":"", montant, motif, mode:"Espèces", statut:"valide", ecole:e?e.ecole||e.groupe||monEcoleNom:monEcoleNom, date:date||new Date().toLocaleDateString('fr-FR'), createdAt:new Date()});
    msg.style.color="green"; msg.textContent="✅ Paiement enregistré : "+montant+" FCFA pour "+eleve;
    document.getElementById('paiementMontant').value="";
    chargerPaiementsGestion(); chargerElevesGestion();
  }catch(er){ msg.style.color="red"; msg.textContent="❌ "+er.message; }
}
function chargerPaiementsGestion(){ afficherPaiementsGestion(filtrePaiementActuel); chargerHistoriquePaiements(); }
function afficherPaiementsGestion(filtre){
  let box=document.getElementById('listePaiementsGestion'); if(!box) return;
  if(!TOUS_ELEVES_GESTION.length){ box.innerHTML=`<p class="centre muted">Charge les élèves d'abord.</p>`; return; }
  let liste=TOUS_ELEVES_GESTION.filter(e=>{
    let s=soldeEleve(e.enfant||e.nomEnfant||"");
    if(filtre==="paye" && s.statut!=="paye") return false;
    if(filtre==="avance" && s.statut!=="avance") return false;
    if(filtre==="nonpaye" && s.statut!=="nonpaye") return false;
    return true;
  });
    if(!liste.length){ box.innerHTML=`<p class="centre muted">Aucun élève dans ce filtre.</p>`; return; }
  let html=`<table class="table-blanc"><thead><tr><th>Élève</th><th>Déjà payé</th><th>Reste</th><th>Statut</th><th>Action</th></tr></thead><tbody>`;
  liste.forEach(e=>{
    let nom=e.enfant||e.nomEnfant||"";
    let s=soldeEleve(nom);
    let badge = s.statut==="paye" ? `<span class="badge badge-paye">✓ PAYÉ</span>` : s.statut==="avance" ? `<span class="badge badge-avance">◐ AVANCE</span>` : `<span class="badge badge-nonpaye">✗ NON PAYÉ</span>`;
    html+=`<tr><td><b>${nom}</b><br><small>${e.parent||""} - ${e.tel||""} - ${e.ecole||e.groupe||""}</small></td><td><b>${s.totalPaye}</b></td><td><b style="color:red">${s.reste}</b></td><td>${badge}</td><td><a class="lien-action" href="https://wa.me/237${nettoyerTelGestion(e.tel||"")}?text=${encodeURIComponent("Salam "+(e.parent||"")+", il reste "+s.reste+" FCFA pour "+nom+" - "+monEcoleNom)}" target="_blank">💬 Relancer</a></td></tr>`;
  });
  html+=`</tbody></table>`; box.innerHTML=html;
}
function filtrerPaiements(filtre, btn){
  filtrePaiementActuel=filtre;
  document.querySelectorAll('#tabPaiements .btn-filtre').forEach(b=>b.classList.remove('actif'));
  if(btn) btn.classList.add('actif');
  afficherPaiementsGestion(filtre);
}
function relancerTousLesImpayes(){
  let impayes=TOUS_ELEVES_GESTION.filter(e=>soldeEleve(e.enfant||e.nomEnfant||"").statut!=="paye");
  if(!impayes.length){ alert("🎉 Tout le monde a payé"); return; }
  let txt="Salam, rappel paiement - "+monEcoleNom+" :\n";
  impayes.forEach(e=>{ txt+=`- ${e.enfant||""} (${e.ecole||e.groupe||""}) : reste ${soldeEleve(e.enfant||"").reste} FCFA\n`; });
  window.open("https://wa.me/?text="+encodeURIComponent(txt),"_blank");
}
function chargerHistoriquePaiements(){
  let box=document.getElementById('historiquePaiements'); if(!box) return;
  if(!TOUS_PAIEMENTS_GESTION.length){ box.innerHTML=`<p class="centre muted">Aucun historique.</p>`; return; }
  let html=`<table class="table-blanc"><thead><tr><th>Enfant</th><th>Montant</th><th>Motif</th><th>Date</th><th>Statut</th></tr></thead><tbody>`;
  TOUS_PAIEMENTS_GESTION.slice().reverse().forEach(p=>{
    html+=`<tr><td><b>${p.enfant||""}</b></td><td><b>${p.montant||0}</b></td><td>${p.motif||""}</td><td>${p.date||""}</td><td>${p.statut||""}</td></tr>`;
  });
  html+=`</tbody></table>`; box.innerHTML=html;
}
function telechargerPaiementsPDF(){ window.print(); }
function partagerPaiementsWhatsApp(){ relancerTousLesImpayes(); }
function telechargerHistoriquePaiementsPDF(){ window.print(); }
async function effacerHistoriquePaiements(){
  if(!confirm("Effacer l'historique des paiements ?")) return;
  try{ let snap=await db.collection("paiements").limit(200).get(); for(let doc of snap.docs){ let d=doc.data(); if(estAMoiGestion(d)) await db.collection("paiements").doc(doc.id).delete(); } chargerPaiementsGestion(); }catch(e){ alert("❌ "+e.message); }
}

// ---------- ENSEIGNANTS ----------
async function ajouterEnseignant(){
  let nom=document.getElementById('ensNom').value.trim();
  let tel=document.getElementById('ensTel').value.trim();
  let role=document.getElementById('ensRole').value;
  let matiere=document.getElementById('ensMatiere').value;
  let classe=document.getElementById('ensClasse').value;
  let salaire=Number(document.getElementById('ensSalaire').value||0);
  if(!nom||!tel){ alert("❌ Mets Nom et Téléphone"); return; }
  try{
    await db.collection("enseignants").add({nom, tel, role, matiere, classe, salaire, ecole:monEcoleNom, ecoleId:monEcoleId, date:new Date().toLocaleDateString('fr-FR'), createdAt:new Date()});
    document.getElementById('ensNom').value=""; document.getElementById('ensTel').value=""; document.getElementById('ensSalaire').value="";
    chargerEnseignants();
  }catch(e){ alert("❌ "+e.message); }
}
async function chargerEnseignants(){
  let box=document.getElementById('listeEnseignants'); if(!box) return;
  try{
    let snap=await db.collection("enseignants").limit(100).get();
    TOUS_ENSEIGNANTS=[];
    snap.forEach(doc=>{ let d={id:doc.id,...doc.data()}; if(estAMoiGestion(d)) TOUS_ENSEIGNANTS.push(d); });
    let sel=document.getElementById('selectEnseignantCom');
    if(sel){ sel.innerHTML=`<option value="">— Choisis —</option>`; TOUS_ENSEIGNANTS.forEach(e=>sel.innerHTML+=`<option value="${e.tel}">${e.nom} - ${e.role} - ${e.ecole||""}</option>`); }
    if(!TOUS_ENSEIGNANTS.length){ box.innerHTML=`<p class="centre muted">Aucun enseignant.</p>`; return; }
    let html=`<table class="table-blanc"><thead><tr><th>Nom</th><th>Rôle / Matière</th><th>Tél</th><th>Salaire</th><th>Action</th></tr></thead><tbody>`;
    TOUS_ENSEIGNANTS.forEach(e=>{
      html+=`<tr><td><b>${e.nom}</b></td><td>${e.role}<br><small>${e.matiere||""} - ${e.classe||""} - ${e.ecole||""}</small></td><td>${e.tel}</td><td>${e.salaire||0}</td><td><button class="lien-action" onclick="supprimerEnseignant('${e.id}')">🗑️ Supprimer</button></td></tr>`;
    });
    html+=`</tbody></table>`; box.innerHTML=html;
  }catch(e){ box.innerHTML="❌ "+e.message; }
}
async function supprimerEnseignant(id){ if(!confirm("Supprimer cet enseignant ?")) return; try{ await db.collection("enseignants").doc(id).delete(); chargerEnseignants(); }catch(e){ alert("❌ "+e.message); } }
function telechargerEnseignantsPDF(){ window.print(); }
function creerGroupeWhatsAppEnseignants(){
  if(!TOUS_ENSEIGNANTS.length){ alert("Aucun enseignant"); return; }
  let txt="Groupe Enseignants - "+monEcoleNom+" :\n"+TOUS_ENSEIGNANTS.map(e=>e.nom+" - "+e.tel).join("\n");
  window.open("https://wa.me/?text="+encodeURIComponent(txt),"_blank");
}
function envoyerMessageTousEnseignants(){
  if(!TOUS_ENSEIGNANTS.length){ alert("Aucun enseignant"); return; }
  let msg=prompt("Ton message aux enseignants :");
  if(!msg) return;
  TOUS_ENSEIGNANTS.forEach(e=>{ window.open("https://wa.me/237"+nettoyerTelGestion(e.tel)+"?text="+encodeURIComponent(msg),"_blank"); });
}
function envoyerMessageUnEnseignant(){
  let tel=document.getElementById('selectEnseignantCom').value;
  let msg=document.getElementById('msgEnseignantCom').value.trim();
  if(!tel||!msg){ alert("Choisis l'enseignant et écris le message"); return; }
  window.open("https://wa.me/237"+nettoyerTelGestion(tel)+"?text="+encodeURIComponent(msg),"_blank");
}
async function effacerHistoriquePaiementsEnseignants(){ if(confirm("Effacer les enseignants ?")){ try{ for(let e of TOUS_ENSEIGNANTS) await db.collection("enseignants").doc(e.id).delete(); chargerEnseignants(); }catch(er){ alert(er.message); } } }

// ---------- BULLETINS ----------
function chargerNotesExistantes(){
  let eleve=document.getElementById('bulEleve').value;
  let tri=document.getElementById('bulTrimestre').value;
  let form=document.getElementById('formNotes');
  if(!form) return;
  if(!eleve){ form.innerHTML=""; return; }
  let actifs=getMatieresActives();
  if(!actifs.length){ form.innerHTML=`<p class="centre" style="color:red">❌ Aucune matière active. Va dans Paramètres.</p>`; return; }
  let html=`<h3 style="text-align:center">Notes - ${eleve} - ${tri}</h3><table class="table-blanc"><thead><tr><th>Matière</th><th>Oral /10</th><th>Écrit /10</th><th>Total /20</th></tr></thead><tbody>`;
  actifs.forEach(m=>{
    let exist=TOUS_BULLETINS.find(b=>b.eleve===eleve && b.trimestre===tri && b.matiere===m.fr);
    let oral=exist?exist.oral||0:0, ecrit=exist?exist.ecrit||0:0;
    html+=`<tr><td><b>${m.fr}</b><br><small>${m.ar||""}</small></td><td><input type="number" min="0" max="10" step="0.5" class="note-input" data-matiere="${m.fr}" data-type="oral" value="${oral}" oninput="calculerTotalLigne(this)"></td><td><input type="number" min="0" max="10" step="0.5" class="note-input" data-matiere="${m.fr}" data-type="ecrit" value="${ecrit}" oninput="calculerTotalLigne(this)"></td><td><b class="total-ligne" data-matiere="${m.fr}">${(Number(oral)+Number(ecrit)).toFixed(1)}</b></td></tr>`;
  });
  html+=`</tbody></table>`; form.innerHTML=html;
}
function calculerTotalLigne(input){
  let mat=input.dataset.matiere;
  let oral=Number(document.querySelector(`input[data-matiere="${mat}"][data-type="oral"]`)?.value||0);
  let ecrit=Number(document.querySelector(`input[data-matiere="${mat}"][data-type="ecrit"]`)?.value||0);
  let el=document.querySelector(`.total-ligne[data-matiere="${mat}"]`);
  if(el) el.textContent=(oral+ecrit).toFixed(1);
}
async function enregistrerBulletinComplet(){
  let eleve=document.getElementById('bulEleve').value;
  let tri=document.getElementById('bulTrimestre').value;
  let annee=document.getElementById('bulAnnee').value;
  let app=document.getElementById('bulAppreciationGenerale').value;
  let msg=document.getElementById('msgBulletin');
  if(!eleve){ msg.style.color="red"; msg.textContent="❌ Choisis l'élève"; return; }
  let inputs=[...document.querySelectorAll('#formNotes input[data-matiere]')];
  if(!inputs.length){ msg.style.color="red"; msg.textContent="❌ Aucune matière active"; return; }
  try{
    for(let inp of inputs){
      let mat=inp.dataset.matiere, type=inp.dataset.type, val=Number(inp.value||0);
      let exist=TOUS_BULLETINS.find(b=>b.eleve===eleve && b.trimestre===tri && b.matiere===mat);
      if(exist){
        let upd={}; upd[type]=val; upd.moyenne=(type==="oral" ? val + Number(exist.ecrit||0) : Number(exist.oral||0) + val);
        await db.collection("bulletins").doc(exist.id).update(upd);
      }else{
        let data={eleve, trimestre:tri, annee, matiere:mat, oral:type==="oral"?val:0, ecrit:type==="ecrit"?val:0, moyenne:val, appreciation:app, ecole:monEcoleNom, ecoleId:monEcoleId, createdAt:new Date()};
        await db.collection("bulletins").add(data);
      }
    }
    msg.style.color="green"; msg.textContent="✅ Bulletin enregistré pour "+eleve+" - "+tri;
    chargerBulletins();
  }catch(e){ msg.style.color="red"; msg.textContent="❌ "+e.message; }
}
async function chargerBulletins(){
  try{
    let snap=await db.collection("bulletins").limit(300).get();
    TOUS_BULLETINS=[];
    snap.forEach(doc=>{ let d={id:doc.id,...doc.data()}; if(estAMoiGestion(d)) TOUS_BULLETINS.push(d); });
    afficherBulletins();
  }catch(e){ let box=document.getElementById('listeBulletins'); if(box) box.innerHTML="❌ "+e.message; }
}
function afficherBulletins(){
  let box=document.getElementById('listeBulletins'); if(!box) return;
  if(!TOUS_BULLETINS.length){ box.innerHTML=`<p class="centre muted">Aucun bulletin.</p>`; return; }
  let nbFixe = getNbMatieresFixees();
  let parEleve={};
  TOUS_BULLETINS.forEach(b=>{ let k=b.eleve+"||"+b.trimestre; if(!parEleve[k]) parEleve[k]={eleve:b.eleve, trimestre:b.trimestre, total:0, nb:0}; parEleve[k].total+=Number(b.moyenne||0); parEleve[k].nb++; });
  let html=`<table class="table-blanc"><thead><tr><th>Élève</th><th>Trimestre</th><th>Composé / Fixé</th><th>Moyenne</th><th>Action</th></tr></thead><tbody>`;
  Object.values(parEleve).forEach(g=>{
    let moy=(g.total / nbFixe).toFixed(2);
    html+=`<tr><td><b>${g.eleve}</b></td><td>${g.trimestre}</td><td>${g.nb} / ${nbFixe}</td><td><b>${moy} / 20</b></td><td><button class="lien-action" onclick="voirBulletinDetail('${g.eleve}','${g.trimestre}')">👁️ Voir</button></td></tr>`;
  });
  html+=`</tbody></table><p class="centre muted" style="font-size:12px">Formule du Directeur : Moyenne = Somme des notes / ${nbFixe} matières fixées. Matière manquante = 0.</p>`; box.innerHTML=html;
}
function voirBulletinDetail(eleve, tri){
  let lignes=TOUS_BULLETINS.filter(b=>b.eleve===eleve && b.trimestre===tri);
  let nbFixe = getNbMatieresFixees();
  let moy = calculerMoyenneTrimestre(lignes).toFixed(2);
  let html=`<div class="bulletin-page"><div class="b-head"><h2>☪️ INSTITUT NOUROUL IYMANE</h2><p>Bulletin - ${tri} - Année ${lignes[0]?.annee||"2026-2027"}</p></div><div class="b-infos"><div><b>Élève</b><br>${eleve}</div><div><b>École</b><br>${monEcoleNom}</div><div><b>Moyenne</b><br>${moy} / 20</div></div><table><thead><tr><th>Matière</th><th>Oral /10</th><th>Écrit /10</th><th>Total /20</th></tr></thead><tbody>`;
  lignes.forEach(l=>{ html+=`<tr><td>${l.matiere}</td><td>${l.oral||0}</td><td>${l.ecrit||0}</td><td><b>${l.moyenne||0}</b></td></tr>`; });
  getMatieresActives().forEach(m=>{
    if(!lignes.find(l=>l.matiere===m.fr)){
      html+=`<tr><td>${m.fr} <small style="color:red">(Absent)</small></td><td>0</td><td>0</td><td><b style="color:red">0</b></td></tr>`;
    }
  });
  html+=`</tbody></table><div class="b-total"><span>MOYENNE GÉNÉRALE (Somme / ${nbFixe} matières fixées)</span><span>${moy} / 20</span></div><div class="b-app">${lignes[0]?.appreciation||""}</div><div class="b-sign"><div>Le Sous-Directeur / Secrétaire<br><br>___________</div><div>Le Parent<br><br>___________</div></div></div>`;
  document.getElementById('zoneImpression').innerHTML=html; document.getElementById('zoneImpression').style.display="block";
  window.print();
}
function telechargerBulletinsPDF(){ window.print(); }
async function effacerHistoriqueBulletins(){
  if(!confirm("Effacer tous les bulletins ?")) return;
  try{ for(let b of TOUS_BULLETINS) await db.collection("bulletins").doc(b.id).delete(); chargerBulletins(); }catch(e){ alert(e.message); }
}

// ---------- PRÉSENCE ----------
async function chargerPresence(){
  let box=document.getElementById('listePresence'); if(!box) return;
  try{
    let snap=await db.collection("presences").limit(50).get();
    TOUS_PRESENCES=[]; snap.forEach(doc=>TOUS_PRESENCES.push({id:doc.id,...doc.data()}));
    if(!TOUS_ELEVES_GESTION.length) await chargerElevesGestion();
    let html=`<table class="table-blanc"><thead><tr><th>✔️ Présent</th><th>Élève</th><th>Parent / École</th></tr></thead><tbody>`;
    TOUS_ELEVES_GESTION.forEach(e=>{
      let nom=e.enfant||e.nomEnfant||"";
      html+=`<tr><td><input type="checkbox" checked data-nom="${nom}" style="width:20px;height:20px"></td><td><b>${nom}</b></td><td>${e.parent||""} - ${e.ecole||e.groupe||""}</td></tr>`;
    });
    html+=`</tbody></table>`; box.innerHTML=html;
    let hist=document.getElementById('historiquePresence');
    if(hist){
      let h=""; TOUS_PRESENCES.slice(-10).reverse().forEach(p=>{ h+=`<p style="font-size:12px">${p.date||""} - ${p.ecole||""} - Présents: <b>${p.presents}</b> - Absents: <b style="color:red">${p.absents}</b> - ${(p.absentsNoms||[]).join(", ")}</p>`; });
      hist.innerHTML=h||"<p class='muted centre'>Aucune présence.</p>";
    }
    let d=document.getElementById('datePresence'); if(d && !d.value) d.value=new Date().toISOString().slice(0,10);
  }catch(e){ box.innerHTML="❌ "+e.message; }
}
async function sauvegarderPresence(){
  let checks=[...document.querySelectorAll('#listePresence input[type=checkbox]')];
  let presents=0, absents=0, absentsNoms=[];
  checks.forEach(c=>{ if(c.checked) presents++; else { absents++; absentsNoms.push(c.dataset.nom); } });
  try{
    await db.collection("presences").add({ecole:monEcoleNom, ecoleId:monEcoleId, date:document.getElementById('datePresence').value||new Date().toLocaleDateString('fr-FR'), presents, absents, absentsNoms, sousDirecteur:emailSD, role:monRoleGestion, createdAt:new Date()});
    alert("✅ Présence enregistrée : "+presents+" présents, "+absents+" absents");
    chargerPresence();
  }catch(e){ alert("❌ "+e.message); }
}
function telechargerPresencePDF(){ window.print(); }
async function effacerHistoriquePresence(){
  if(!confirm("Effacer l'historique présence ?")) return;
  try{ for(let p of TOUS_PRESENCES) await db.collection("presences").doc(p.id).delete(); chargerPresence(); }catch(e){ alert(e.message); }
}

// ---------- ANNUEL ----------
function calculerBilanAnnuel(){
  let box=document.getElementById('zoneBilanEcole'); if(!box) return;
  if(!TOUS_BULLETINS.length){ box.innerHTML=`<p class="centre muted">Aucun bulletin.</p>`; return; }
  let nbFixe = getNbMatieresFixees();
  let parEleveTri = {};
  TOUS_BULLETINS.forEach(b=>{
    let k = b.eleve+"||"+b.trimestre;
    if(!parEleveTri[k]) parEleveTri[k]={eleve:b.eleve, trimestre:b.trimestre, total:0};
    parEleveTri[k].total += Number(b.moyenne||0);
  });
  let parEleve = {};
  Object.values(parEleveTri).forEach(g=>{
    let moyTri = g.total / nbFixe;
    if(!parEleve[g.eleve]) parEleve[g.eleve]={totalTri:0, nbTri:0};
    parEleve[g.eleve].totalTri += moyTri;
    parEleve[g.eleve].nbTri++;
  });
  let html=`<table class="table-blanc"><thead><tr><th>Élève</th><th>Moyenne Annuelle</th><th>Résultat</th></tr></thead><tbody>`;
  Object.keys(parEleve).sort().forEach(nom=>{
    let d=parEleve[nom]; let moy=(d.totalTri/d.nbTri).toFixed(2);
    html+=`<tr><td><b>${nom}</b></td><td><b>${moy} / 20</b></td><td>${moy>=10?"✅ ADMIS":"❌ NON ADMIS"}</td></tr>`;
  });
  html+=`</tbody></table><p class="centre muted" style="font-size:12px">Moyenne Trimestre = Somme / ${nbFixe} matières fixées. Moyenne Annuelle = (T1+T2+T3) / Nombre de trimestres composés.</p>`; box.innerHTML=html;
  let box2=document.getElementById('listeBulletinsAnnuels'); if(box2) box2.innerHTML=html;
}
function telechargerBilanAnnuelPDF(){ window.print(); }

// ---------- DIVERS - CORRIGÉ : Chronométré - Disparaît tout seul à l'accueil ----------
async function publierDivers(){
  let titre=document.getElementById('diversTitre').value.trim();
  let texte=document.getElementById('diversTexte').value.trim();
  let dureeJours=Number(document.getElementById('diversDuree') ? document.getElementById('diversDuree').value : 7);
  if(!titre||!texte){ alert("Mets Titre et Message"); return; }
  // ⏰ Date d'expiration = maintenant + durée choisie
  let expireLe = new Date();
  expireLe.setDate(expireLe.getDate() + dureeJours);
  try{
    await db.collection("divers").add({titre, texte, ecole:monEcoleNom, ecoleId:monEcoleId, date:new Date().toLocaleDateString('fr-FR'), expireLe: expireLe.toISOString(), dureeJours: dureeJours, createdAt:new Date()});
    document.getElementById('diversTitre').value=""; document.getElementById('diversTexte').value="";
    alert("✅ Divers publié pour "+dureeJours+" jours. Il va disparaître tout seul à l'accueil après.");
    chargerDivers();
  }catch(e){ alert("❌ "+e.message); }
}
async function chargerDivers(){
  let box=document.getElementById('listeDivers'); if(!box) return;
  try{
    let snap=await db.collection("divers").limit(20).get();
    let maintenant=new Date();
    let h=""; snap.forEach(doc=>{ let d=doc.data(); if(!estAMoiGestion(d)) return;
      let statut="";
      if(d.expireLe){
        let exp=new Date(d.expireLe);
        let resteJours=Math.ceil((exp - maintenant)/(1000*60*60*24));
        if(maintenant > exp) statut=` <small style="color:red">⏰ Expirée - Plus visible à l'accueil</small>`;
        else statut=` <small style="color:green">⏰ Encore ${resteJours} jour(s) à l'accueil</small>`;
      }
      h+=`<p style="font-size:13px"><b>${d.titre||""}</b> - ${d.texte||""} <small>(${d.date||""})</small>${statut} <button class="lien-action" onclick="supprimerDivers('${doc.id}')">🗑️ Supprimer</button></p>`;
    });
    box.innerHTML=h||"<p class='muted centre'>Aucun divers.</p>";
  }catch(e){ box.innerHTML="❌ "+e.message; }
}
async function supprimerDivers(id){
  if(!confirm("Supprimer cette annonce ? Elle va disparaître de l'accueil.")) return;
  try{ await db.collection("divers").doc(id).delete(); chargerDivers(); }catch(e){ alert("❌ "+e.message); }
}
async function effacerToutHistorique(){
  let code=prompt("Écris EFFACER pour valider");
  if(code!=="EFFACER"){ alert("Annulé"); return; }
  try{
    for(let b of TOUS_BULLETINS) await db.collection("bulletins").doc(b.id).delete();
    for(let p of TOUS_PRESENCES) await db.collection("presences").doc(p.id).delete();
    for(let p of TOUS_PAIEMENTS_GESTION) await db.collection("paiements").doc(p.id).delete();
    alert("✅ Tout effacé");
    chargerElevesGestion(); chargerPaiementsGestion(); chargerBulletins(); chargerPresence();
  }catch(e){ alert(e.message); }
}

// ---------- AUTO LOGIN ----------
if(typeof auth!=="undefined"){
  auth.onAuthStateChanged(async (user)=>{
    if(user){
      let s=localStorage.getItem("gestion_session");
      if(s){
        try{ let j=JSON.parse(s); if(j.email===user.email){ monRoleGestion=j.role||"sous-directeur"; modeToutesEcoles=!!j.toutes; await chargerMonEcoleGestion(user.email); } }catch(e){}
      }
    }
  });
}
window.addEventListener('load', ()=>{
  let s=localStorage.getItem("gestion_session");
  if(s && typeof auth!=="undefined" && auth.currentUser){
    try{ let j=JSON.parse(s); chargerMonEcoleGestion(j.email); }catch(e){}
  }
});
  
 