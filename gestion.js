// GESTION - Institut Nouroul Iymane - VERSION CORRIGEE - FAUX ID + NOM CASSE + NOTES + PRIX
// + CHOIX A : Secrétaire -> en_attente -> Directeur valide dans Admin.html -> SD voit
let monEcoleId = "";
let monEcoleNom = "";
let monEcoleData = null;
let emailSD = "";
let passwordSD = "";
let filtreEleveActuel = "tous";
let filtrePaiementActuel = "tous";
let filtreEcoleEleveActuel = "";
let filtreNiveauEleveActuel = "";
let TOUS_ELEVES_GESTION = [];
let TOUS_PAIEMENTS_GESTION = [];
let TOUS_ENSEIGNANTS = [];
let TOUS_BULLETINS = [];
let TOUS_PRESENCES = [];
let fraisTotal = 0;
let typeComposition = "Oral + Écrit";
let matieresActivesIds = [];
let monRoleGestion = "sous-directeur";
let modeToutesEcoles = false;
let fraisTotalEcole = 0;
let mesEleves = TOUS_ELEVES_GESTION;
let mesPaiements = TOUS_PAIEMENTS_GESTION;
function normaliser(t){ return String(t||"").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
function statutInscriptionEleve(e){
  let s = String(e.statut||e.status||"").toLowerCase();
  if(s==="valide" || s==="validé" || s==="validee" || s.includes("accept") || s.includes("accepte") || s==="approuve") return {type:"accepte", label:"ACCEPTÉ DG"};
  return {type:"attente", label:"EN ATTENTE DG"};
}
function syncFraisTotal(){ fraisTotalEcole = Number(fraisTotal||0); }
function syncMesListes(){ mesEleves = TOUS_ELEVES_GESTION; mesPaiements = TOUS_PAIEMENTS_GESTION; }
function statutPaiementValide(p){
  // CHOIX A : seul "valide" compte dans l'encaissé. "en_attente" ne compte PAS tant que le Directeur n'a pas validé dans Admin.
  let st = String(p.statut||p.status||"").toLowerCase().trim();
  if(!st) return false;
  return (st==="valide" || st==="validé" || st==="validee" || st==="paye" || st==="payé" || st==="payee" || st==="ok" || st==="confirme" || st==="confirmé");
}
function nomEcoleDeEleveSimple(e){ return e.ecoleNom || e.ecole || e.groupeNom || e.groupe || monEcoleNom || ""; }
function ecoleDeEleveBulletin(nomEleve){
  let e = TOUS_ELEVES_GESTION.find(x=> normaliser(x.enfant||x.nomEnfant||"")===normaliser(nomEleve));
  if(e) return e.ecole||e.ecoleNom||e.groupe||e.groupeNom||"";
  return "";
}
const NOM_ECOLE_AR = "معهد نور الإيمان";
const MATIERES_AR = {"Coran":"القرآن","Hadith":"الحديث","Aquida":"العقيدة","Fiqh":"الفقه","Langue Arabe":"اللغة العربية","Sirah":"السيرة","Tawhid":"التوحيد","Adhab":"الآداب","Mémorisation":"الحفظ","Lecture":"القراءة","Écriture":"الكتابة","Mathématiques":"الرياضيات","Français":"الفرنسية"};
const MATIERES_EN = {"Coran":"Quran","Hadith":"Hadith","Aquida":"Aqeedah","Fiqh":"Fiqh","Langue Arabe":"Arabic Language","Sirah":"Seerah","Tawhid":"Tawhid","Adhab":"Manners","Mémorisation":"Memorization","Lecture":"Reading","Écriture":"Writing","Mathématiques":"Mathematics","Français":"French"};
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
function getNbMatieresFixees(){ let n = getMatieresActives().length; return n > 0 ? n : 1; }
function calculerMoyenneTrimestre(lignes){ let total = 0; lignes.forEach(l=> total += Number(l.moyenne||0)); return total / getNbMatieresFixees(); }
function showTabGestion(id, btn){
  ['tabDashboard','tabEleves','tabPaiements','tabEnseignants','tabBulletins','tabPresence','tabAnnuel','tabParametres'].forEach(x=>{ let el=document.getElementById(x); if(el) el.style.display='none'; });
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
  try{ let cred=await auth.signInWithEmailAndPassword(email,password); emailSD=email; passwordSD=password; await chargerMonEcoleGestion(email); }
  catch(e){ msg.style.color="red"; msg.textContent="❌ "+e.message; }
}
function seDeconnecterGestion(){ try{ auth.signOut(); }catch(e){} localStorage.removeItem("gestion_session"); location.reload(); }
async function verifierRoleDirection(email){
  try{
    let docDirect = await db.collection("utilisateurs").doc(email).get();
    if(docDirect.exists){
      let d = docDirect.data();
      let role = String(d.role||d.fonction||d.type||"").toLowerCase();
      if(role.includes("secretaire") || role.includes("secrétaire") || role.includes("secretary")) return "secretaire";
      if(role.includes("directeur") && !role.includes("sous")) return "directeur";
      if(role.includes("directeur")) return "directeur";
    }
  }catch(e){}
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
  if(email.includes("directeur") || email.includes("director")) return "directeur";
  if(email.includes("secretaire") || email.includes("secret")) return "secretaire";
  return null;
}
async function chargerMonEcoleGestion(email){
  let msg=document.getElementById('msg');
  try{
    // ✅ FIX CHOIX A : on vérifie D'ABORD si c'est Directeur / Secrétaire.
    // Avant, si son Email était aussi Sous-Directeur d'une école, il devenait Sous-Directeur et ne voyait qu'une école.
    let roleDirection = await verifierRoleDirection(email);
    let snap=await db.collection("ecoles").get();
    let trouve=null;
    snap.forEach(doc=>{ let d=doc.data(); let em=nettoyerEmailGestion(d.sousDirecteurEmail||d.sousDirecteur||d.sous_directeur||d.emailSousDirecteur||d.email||""); if(em===email) trouve={id:doc.id,...d}; });
    if(!trouve){
      let snapG=await db.collection("groupes").get();
      snapG.forEach(doc=>{ let d=doc.data(); let em=nettoyerEmailGestion(d.sousDirecteurEmail||d.sousDirecteur||d.email||""); if(em===email) trouve={id:doc.id,...d}; });
    }
    if(!roleDirection){
      let snap2=await db.collection("ecoles").get();
      snap2.forEach(doc=>{ let d=doc.data(); let emD=nettoyerEmailGestion(d.directeurEmail||d.directeur||d.emailDirecteur||""); let emS=nettoyerEmailGestion(d.secretaireEmail||d.secretaire||d.emailSecretaire||""); if(emD===email) roleDirection="directeur"; if(emS===email) roleDirection="secretaire"; });
    }
    // ✅ Si c'est Directeur / Secrétaire, il gagne, même s'il est aussi Sous-Directeur d'une école
    if(roleDirection){ monRoleGestion=roleDirection; modeToutesEcoles=true; monEcoleId="TOUTES"; monEcoleNom="TOUTES LES ÉCOLES"; monEcoleData={nom:"TOUTES LES ÉCOLES"}; }
    else if(trouve){ monRoleGestion="sous-directeur"; modeToutesEcoles=false; monEcoleId=trouve.id; monEcoleNom=trouve.nom||"École"; monEcoleData=trouve; }
    else { msg.style.color="red"; msg.textContent="❌ Email introuvable. Le Directeur doit d'abord te créer dans Admin -> Écoles (comme Sous-Directeur) ou comme Directeur / Secrétaire."; return; }
    document.getElementById('loginCard').style.display='none';
    document.getElementById('gestionPanel').style.display='block';
    document.getElementById('gestionEmail').textContent=email + " - " + (monRoleGestion==="directeur" ? "👑 DIRECTEUR - Voit tout" : monRoleGestion==="secretaire" ? "📝 SECRÉTAIRE DU DIRECTEUR - Voit tout" : "👨‍💼 SOUS-DIRECTEUR - "+monEcoleNom);
    document.getElementById('topEcole').textContent=monEcoleNom + (modeToutesEcoles ? " (TOUT)" : "");
    document.getElementById('monEcoleNom').textContent=monEcoleNom;
    document.getElementById('dateJour').textContent=new Date().toLocaleDateString('fr-FR');
    localStorage.setItem("gestion_session", JSON.stringify({email, ecoleId:monEcoleId, ecoleNom:monEcoleNom, role:monRoleGestion, toutes:modeToutesEcoles}));
    await chargerConfigMatieres();
    await chargerFraisTotal();
    try{ await chargerToutLeNouveau(); }catch(e){}
    chargerElevesGestion(); chargerPaiementsGestion(); chargerEnseignants(); chargerBulletins(); chargerPresence();
  }catch(e){ msg.textContent="❌ "+e.message; }
}
function estAMoiGestion(d){
  if(modeToutesEcoles) return true;
  if(monRoleGestion==="directeur" || monRoleGestion==="secretaire") return true;
  let e = String(d.ecole||d.ecoleNom||d.ecoleId||"").toLowerCase();
  let g = String(d.groupe||d.groupeNom||"").toLowerCase();
  let nom = String(monEcoleNom||"").toLowerCase();
  if(!nom || nom==="toutes les écoles") return true;
  if(!e && !g) return true;
  return e.includes(nom) || g.includes(nom) || nom.includes(e) || nom.includes(g);
}
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
    data.matieresDetail.forEach(m=>{ if(!MATIERES_ISLAMIQUES.find(x=>x.id===m.id)){ MATIERES_ISLAMIQUES.push({id:m.id, fr:m.fr||m.nom, ar:m.ar||MATIERES_AR[m.fr||m.nom]||"", desc:m.desc||"Matière ajoutée par l'école", perso:!!m.perso}); } });
  }
  matieresActivesIds = liste.slice();
  if(data.typeComposition) typeComposition = data.typeComposition;
  return true;
}
async function chargerConfigMatieres(){
  chargerMatieresPerso();
  try{ let locT = localStorage.getItem("typeComposition_"+monEcoleId); if(locT) typeComposition = locT; }catch(e){}
  try{
    let snap = await db.collection("matieres_publiees").limit(100).get();
    let meilleur = null, maxNb = 0;
    snap.forEach(doc=>{ let d = doc.data(); let nb = (d.matieresDetail && d.matieresDetail.length) || (d.matieres && d.matieres.length) || (d.matieresNoms && d.matieresNoms.length) || 0; if(nb > maxNb){ maxNb = nb; meilleur = d; } });
    if(meilleur && appliquerConfigMatieres(meilleur)){ majTitresFeuilles(); afficherChoixMatieres(); return; }
  }catch(e){}
  try{
    if(monEcoleId && monEcoleId!=="TOUTES"){
      let doc = await db.collection("configMatieres").doc(monEcoleId).get();
      if(doc.exists && doc.data().matieres && doc.data().matieres.length){ matieresActivesIds = doc.data().matieres; if(doc.data().typeComposition) typeComposition = doc.data().typeComposition; majTitresFeuilles(); afficherChoixMatieres(); return; }
    }
  }catch(e){}
  try{ let loc = localStorage.getItem("matieresActives_"+monEcoleId); if(loc){ let arr = JSON.parse(loc); if(arr.length) matieresActivesIds = arr; } }catch(e){}
  majTitresFeuilles(); afficherChoixMatieres();
}
function chargerMatieresPerso(){ try{ let perso = JSON.parse(localStorage.getItem("matieresPerso_"+monEcoleId)||"[]"); perso.forEach(m=>{ if(!MATIERES_ISLAMIQUES.find(x=>x.id===m.id)) MATIERES_ISLAMIQUES.push(m); }); }catch(e){} }
function majTitresFeuilles(){
  let noms = getMatieresActives().map(m=>m.fr).join(", ") || "Toutes";
  ["affichageMatieresActives","affichageMatieresBulletin","affichageMatieresAnnuel","affichageMatieresParametres"].forEach(id=>{ let el=document.getElementById(id); if(el) el.textContent=noms; });
  ["affichageTypeComposition","affichageTypeCompositionBulletin","affichageTypeCompositionParam"].forEach(id=>{ let el=document.getElementById(id); if(el) el.textContent=typeComposition; });
  let elF=document.getElementById('affichageFraisTotal'); if(elF) elF.textContent=fraisTotal?fraisTotal+" FCFA":"Non défini";
  ["titreEcoleEleves","titreEcolePresence","titreEcoleAnnuel","titreEcolePaiements","titreEcoleEnseignants"].forEach(id=>{ let el=document.getElementById(id); if(el) el.textContent=monEcoleNom||""; });
  let elF2=document.getElementById('titreFraisEleves'); if(elF2) elF2.textContent=fraisTotal||0;
  let elD=document.getElementById('titreDateEleves'); if(elD) elD.textContent=new Date().toLocaleDateString('fr-FR');
  let elDP=document.getElementById('titreDatePresence'); if(elDP) elDP.textContent=new Date().toLocaleDateString('fr-FR');
  let elA=document.getElementById('titreEcoleArabe'); if(elA) elA.textContent=NOM_ECOLE_AR;
}
function afficherChoixMatieres(){
  let box=document.getElementById('listeChoixMatieres'); if(!box) return;
  let html="";
  MATIERES_ISLAMIQUES.forEach(m=>{ let coche = matieresActivesIds.includes(m.id) ? "checked" : ""; html+=`<label class="matiere-check"><input type="checkbox" class="check-matiere" value="${m.id}" ${coche}> <span><b>${m.fr}</b> - ${m.ar||""}<br><small style="color:#666">${m.desc||""}</small></span></label>`; });
  box.innerHTML=html; majTitresFeuilles();
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
  try{ if(monEcoleId && monEcoleId!=="TOUTES") await db.collection("configMatieres").doc(monEcoleId).set({ecoleId:monEcoleId, ecoleNom:monEcoleNom, fraisTotal:fraisTotal, matieres:coches, typeComposition:typeComposition, date:new Date().toISOString()}); }catch(e){ console.log(e.message); }
  await publierMatieresPourSousDirecteur(); majTitresFeuilles(); afficherChoixMatieres();
  msg.style.color="green"; msg.textContent="✅ Matières enregistrées : "+getMatieresActives().map(m=>m.fr).join(", ")+" - Le Sous-Directeur les voit maintenant.";
  chargerElevesGestion();
}
async function chargerFraisTotal(){
  try{ if(monEcoleId && monEcoleId!=="TOUTES"){ let doc=await db.collection("configMatieres").doc(monEcoleId).get(); if(doc.exists && doc.data().fraisTotal) fraisTotal=Number(doc.data().fraisTotal||0); } }catch(e){}
  try{ let loc=localStorage.getItem("fraisTotal_"+monEcoleId); if(loc) fraisTotal=Number(loc||0); }catch(e){}
  syncFraisTotal(); majTitresFeuilles();
}
async function definirFraisTotal(){
  let v=Number(document.getElementById('inputFraisTotal').value||0);
  if(!v){ alert("Mets un montant"); return; }
  fraisTotal=v; syncFraisTotal();
  try{ localStorage.setItem("fraisTotal_"+monEcoleId, String(v)); }catch(e){}
  try{ if(monEcoleId && monEcoleId!=="TOUTES") await db.collection("configMatieres").doc(monEcoleId).set({ecoleId:monEcoleId, ecoleNom:monEcoleNom, fraisTotal:v, matieres:matieresActivesIds, typeComposition:typeComposition, date:new Date().toISOString()}, {merge:true}); }catch(e){}
  majTitresFeuilles(); alert("✅ Frais défini : "+v+" FCFA");
}
async function chargerElevesGestion(){
  let box=document.getElementById('listeElevesGestion'); if(!box) return;
  try{
    let snap=await db.collection("inscriptions").limit(200).get();
    TOUS_ELEVES_GESTION=[]; snap.forEach(doc=>{ let d={id:doc.id,...doc.data()}; if(estAMoiGestion(d)) TOUS_ELEVES_GESTION.push(d); });
    let snapP=await db.collection("paiements").limit(500).get();
    TOUS_PAIEMENTS_GESTION=[]; snapP.forEach(doc=>TOUS_PAIEMENTS_GESTION.push({id:doc.id,...doc.data()}));
    syncMesListes(); afficherElevesGestion(filtreEleveActuel); majDashboard();
    if(typeof remplirFiltresEcole==="function") remplirFiltresEcole();
    afficherEffectifsParEcole();
  }catch(e){ box.innerHTML="❌ "+e.message; }
}
function soldeEleve(nom){
  let totalPaye=0;
  TOUS_PAIEMENTS_GESTION.forEach(p=>{ if((p.enfant||p.enfantNom||"").toLowerCase()===(nom||"").toLowerCase() && statutPaiementValide(p)) totalPaye+=Number(p.montant||0); });
  let reste=Math.max(0, fraisTotal - totalPaye);
  let statut = fraisTotal>0 && totalPaye>=fraisTotal ? "paye" : totalPaye>0 ? "avance" : "nonpaye";
  return {totalPaye, reste, statut, totalDu:fraisTotal, total:fraisTotal};
}
function majDashboard(){
  let total=TOUS_ELEVES_GESTION.length;
  let accepte=TOUS_ELEVES_GESTION.filter(e=>e.statut==="valide"||e.statut==="validé").length;
  let attente=total-accepte; let paye=0, nonpaye=0, encaisse=0;
  TOUS_ELEVES_GESTION.forEach(e=>{ let nom=e.enfant||e.nomEnfant||""; let s=soldeEleve(nom); encaisse+=s.totalPaye; if(s.statut==="paye") paye++; else nonpaye++; });
  let el=(id,v)=>{ let e=document.getElementById(id); if(e) e.textContent=v; };
  el('statTotal',total); el('statAccepte',accepte); el('statEnAttente',attente); el('statPaye',paye); el('statNonPaye',nonpaye); el('statMontant',encaisse+" FCFA");
  let alertBox=document.getElementById('alertesJour'); if(alertBox) alertBox.innerHTML = nonpaye>0 ? `🔴 <b>${nonpaye}</b> élève(s) doivent encore payer. Va dans Paiements > Relancer impayés.` : `🎉 Tout le monde a payé. Alhamdoulillah.`;
  let der=document.getElementById('derniersPaiementsDashboard');
  if(der){ let h=""; TOUS_PAIEMENTS_GESTION.slice(-5).reverse().forEach(p=>{ h+=`<p style="font-size:12px">💰 <b>${p.enfant||p.enfantNom||""}</b> - ${p.montant||0} FCFA - ${p.motif||""} - ${p.statut||""}</p>`; }); der.innerHTML=h||"<p class='muted centre'>Aucun paiement.</p>"; }
  let selP=document.getElementById('paiementEleve');
  if(selP){ let cur=selP.value; selP.innerHTML=`<option value="">— Choisis l'élève —</option>`; TOUS_ELEVES_GESTION.forEach(e=>{ let nom=e.enfant||e.nomEnfant||""; selP.innerHTML+=`<option value="${nom}">${nom} - ${e.niveau||""} - ${e.ecole||e.groupe||""}</option>`; }); if(cur) selP.value=cur; }
  let selB=document.getElementById('bulEleve');
  if(selB){ let cur=selB.value; selB.innerHTML=`<option value="">— Choisis l'élève —</option>`; TOUS_ELEVES_GESTION.forEach(e=>{ let nom=e.enfant||e.nomEnfant||""; selB.innerHTML+=`<option value="${nom}">${nom} - ${e.ecole||e.groupe||""}</option>`; }); if(cur) selB.value=cur; }
}
function afficherEffectifsParEcole(){
  let box=document.getElementById('effectifsParEcoleEleves'); if(!box) return;
  if(!TOUS_ELEVES_GESTION.length){ box.innerHTML=""; return; }
  let par={};
  TOUS_ELEVES_GESTION.forEach(e=>{ let n=nomEcoleDeEleveSimple(e)||"Sans école"; par[n]=(par[n]||0)+1; });
  let total=TOUS_ELEVES_GESTION.length;
  let chips = Object.keys(par).sort().map(n=> `<button onclick="choisirEcoleEleves('${n}')" class="btn-filtre" style="${filtreEcoleEleveActuel===n?'background:#66BB6A;color:white':''}">${n} : <b>${par[n]}</b></button>`).join(' ');
  box.innerHTML = `<div style="background:#F1F8E9;border:1px solid #C8E6C9;border-radius:10px;padding:8px;text-align:center;font-size:12px"><b>Effectifs par école — Total : ${total}</b><br><div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center"><button onclick="choisirEcoleEleves('')" class="btn-filtre" style="${!filtreEcoleEleveActuel?'background:#66BB6A;color:white':''}">Toutes : <b>${total}</b></button> ${chips}</div><div style="margin-top:6px" class="muted">${filtreEcoleEleveActuel ? `Tu vois : <b>${filtreEcoleEleveActuel}</b> — ${par[filtreEcoleEleveActuel]||0} élève(s)` : `Tu vois : <b>Toutes les écoles</b> — ${total} élève(s)`}</div></div>`;
}
function niveauxDeEcoleChoisie(){
  let liste = TOUS_ELEVES_GESTION.filter(e=>{ if(filtreEcoleEleveActuel && normaliser(nomEcoleDeEleveSimple(e))!==normaliser(filtreEcoleEleveActuel)) return false; return true; });
  let set = new Set(); liste.forEach(e=>{ if(e.niveau) set.add(e.niveau); }); return [...set].sort();
}
function remplirFiltreNiveauEleves(){
  let sel = document.getElementById('filtreNiveauEleves'); if(!sel) return;
  let niveaux = niveauxDeEcoleChoisie();
  let garde = sel.value;
  sel.innerHTML = `<option value="">— Tous les niveaux —</option>` + niveaux.map(n=>{ let nb = TOUS_ELEVES_GESTION.filter(e=>e.niveau===n && (!filtreEcoleEleveActuel || normaliser(nomEcoleDeEleveSimple(e))===normaliser(filtreEcoleEleveActuel))).length; return `<option value="${n}">${n} (${nb})</option>`; }).join('');
  if(garde && niveaux.includes(garde)) sel.value = garde; else filtreNiveauEleveActuel = "";
}
function choisirEcoleEleves(nom){
  filtreEcoleEleveActuel = nom||"";
  let sel=document.getElementById('filtreEcoleEleves'); if(sel) sel.value = nom||"";
  filtreNiveauEleveActuel = "";
  remplirFiltreNiveauEleves();
  afficherElevesGestion(filtreEleveActuel);
  afficherEffectifsParEcole();
}
function filtrerElevesParEcole(){
  let sel=document.getElementById('filtreEcoleEleves'); if(!sel) return;
  filtreEcoleEleveActuel = sel.value||"";
  filtreNiveauEleveActuel = "";
  remplirFiltreNiveauEleves();
  afficherElevesGestion(filtreEleveActuel);
  afficherEffectifsParEcole();
}
function filtrerElevesParNiveau(){
  let sel=document.getElementById('filtreNiveauEleves'); if(!sel) return;
  filtreNiveauEleveActuel = sel.value||"";
  afficherElevesGestion(filtreEleveActuel);
}
function afficherElevesGestion(filtre){
  let box=document.getElementById('listeElevesGestion'); if(!box) return;
  let q=(document.getElementById('rechercheEleve')?.value||"").toLowerCase();
  let liste=TOUS_ELEVES_GESTION.filter(e=>{
    let nom=e.enfant||e.nomEnfant||""; let s=soldeEleve(nom);
    if(filtreEcoleEleveActuel && normaliser(nomEcoleDeEleveSimple(e))!==normaliser(filtreEcoleEleveActuel)) return false;
    if(filtreNiveauEleveActuel && String(e.niveau||"")!==String(filtreNiveauEleveActuel)) return false;
    if(filtre==="paye" && s.statut!=="paye") return false;
    if(filtre==="avance" && s.statut!=="avance") return false;
    if(filtre==="nonpaye" && s.statut!=="nonpaye") return false;
    if(filtre==="attente" && (e.statut==="valide"||e.statut==="validé")) return false;
    if(filtre==="accepte" && !(e.statut==="valide"||e.statut==="validé")) return false;
    if(q && !JSON.stringify(e).toLowerCase().includes(q)) return false;
    return true;
  });
  afficherEffectifsParEcole();
  remplirFiltreNiveauEleves();
  let info=document.getElementById('infoFiltreEleves');
  if(info) info.innerHTML = `Tu vois : <b>${filtreEcoleEleveActuel||"Toutes les écoles"}</b> ${filtreNiveauEleveActuel?`— <b>${filtreNiveauEleveActuel}</b>`:"— Tous les niveaux"} — <b>${liste.length}</b> élève(s)`;
  if(!liste.length){ box.innerHTML=`<p class="centre muted">Aucun élève${filtreEcoleEleveActuel ? ` pour <b>${filtreEcoleEleveActuel}</b>` : ""} ${filtreNiveauEleveActuel||""}.</p>`; return; }
  let html=`<table class="table-blanc"><thead><tr><th>Enfant</th><th>Parent</th><th>Niveau</th><th>École / Groupe</th><th>Paiement</th><th>Statut DG</th><th>Action</th></tr></thead><tbody>`;
  liste.forEach(e=>{
    let nom=e.enfant||e.nomEnfant||""; let s=soldeEleve(nom);
    let nomEcole = nomEcoleDeEleveSimple(e) || "—";
    let badgePaye = s.statut==="paye" ? `<span class="badge badge-paye">✓ PAYÉ</span>` : s.statut==="avance" ? `<span class="badge badge-avance">◐ AVANCE ${s.totalPaye}/${s.totalDu||fraisTotal}</span>` : `<span class="badge badge-nonpaye">✗ NON PAYÉ - Reste ${s.reste}</span>`;
    let badgeDG = (e.statut==="valide"||e.statut==="validé") ? `<span class="badge badge-accepte">ACCEPTÉ DG</span>` : `<span class="badge badge-attente">EN ATTENTE DG</span>`;
    html+=`<tr><td><b>${nom}</b></td><td>${e.parent||""}<br><small>${e.tel||""}</small></td><td><b>${e.niveau||""}</b></td><td><b style="color:#1B5E20">${nomEcole}</b></td><td>${badgePaye}</td><td>${badgeDG}</td><td><button class="lien-action" onclick="validerEleveGestion('${e.id}')">✅ Valider</button> <button class="lien-action" style="color:red" onclick="supprimerEleveGestion('${e.id}','${nom}')">🗑️</button></td></tr>`;
  });
  html+=`</tbody></table><p class="centre muted" style="font-size:12px">Affichés : <b>${liste.length}</b> élève(s)${filtreEcoleEleveActuel ? ` — École : <b>${filtreEcoleEleveActuel}</b>` : ""}${filtreNiveauEleveActuel ? ` — Niveau : <b>${filtreNiveauEleveActuel}</b>` : ""}</p>`; box.innerHTML=html;
}
function filtrerEleves(filtre, btn){ filtreEleveActuel=filtre; document.querySelectorAll('#tabEleves .btn-filtre').forEach(b=>b.classList.remove('actif')); if(btn) btn.classList.add('actif'); afficherElevesGestion(filtre); }
async function validerEleveGestion(id){ try{ await db.collection("inscriptions").doc(id).update({statut:"valide"}); chargerElevesGestion(); }catch(e){ alert("❌ "+e.message); } }
async function supprimerEleveGestion(id, nom){
  if(!confirm("Supprimer "+nom+" ?\nSon inscription + ses paiements + ses bulletins seront supprimés.")) return;
  try{
    await db.collection("inscriptions").doc(id).delete();
    let snap = await db.collection("paiements").where("enfant","==",nom).get();
    for(let d of snap.docs) await db.collection("paiements").doc(d.id).delete();
    let snap2 = await db.collection("bulletins").where("eleve","==",nom).get();
    for(let d of snap2.docs) await db.collection("bulletins").doc(d.id).delete();
    alert("✅ "+nom+" supprimé"); chargerElevesGestion();
  }catch(e){ alert("❌ "+e.message); }
}
async function effacerElevesAffiches(){
  let ecole = filtreEcoleEleveActuel||"toutes les écoles";
  let niveau = filtreNiveauEleveActuel||"tous les niveaux";
  let aEffacer = TOUS_ELEVES_GESTION.filter(e=> (!filtreEcoleEleveActuel || normaliser(nomEcoleDeEleveSimple(e))===normaliser(filtreEcoleEleveActuel)) && (!filtreNiveauEleveActuel || String(e.niveau)===String(filtreNiveauEleveActuel)));
  if(!aEffacer.length) return alert("Aucun élève à effacer dans ce filtre.");
  let code = prompt(`Tu vas EFFACER ${aEffacer.length} élève(s) — ${ecole} — ${niveau}\n\nÉcris EFFACER pour valider :`);
  if(code!=="EFFACER") return alert("Annulé");
  try{ for(let e of aEffacer) await db.collection("inscriptions").doc(e.id).delete(); alert("✅ "+aEffacer.length+" élève(s) effacé(s)"); chargerElevesGestion(); }catch(e){ alert("❌ "+e.message); }
}
function telechargerListeElevesPDF(){ window.print(); }
function telechargerEleves(){ let txt="📋 LISTE ÉLÈVES - "+monEcoleNom+"\n"; TOUS_ELEVES_GESTION.forEach(e=>{ if(filtreEcoleEleveActuel && normaliser(nomEcoleDeEleveSimple(e))!==normaliser(filtreEcoleEleveActuel)) return; if(filtreNiveauEleveActuel && String(e.niveau)!==String(filtreNiveauEleveActuel)) return; txt+=`- ${e.enfant||e.nomEnfant||""} - ${e.niveau||""} - ${nomEcoleDeEleveSimple(e)} - ${e.parent||""}\n`; }); window.open("https://wa.me/?text="+encodeURIComponent(txt),"_blank"); }
function onElevePaiementChange(){
  let nom=document.getElementById('paiementEleve').value;
  let eleve=TOUS_ELEVES_GESTION.find(e=>(e.enfant||e.nomEnfant||"")===nom);
  document.getElementById('paiementClasse').value=eleve?eleve.niveau||"":"";
  let box=document.getElementById('infoSoldeEleve');
  if(!eleve){ box.style.display="none"; return; }
  let s=soldeEleve(nom); box.style.display="block";
  box.innerHTML=`<b>${nom}</b> - ${eleve.ecole||eleve.groupe||""} - Déjà payé : <b>${s.totalPaye} FCFA</b> - Reste : <b style="color:red">${s.reste} FCFA</b> - Frais total : ${s.totalDu||fraisTotal} FCFA`;
  calculerResteApresPaiement();
}
function calculerResteApresPaiement(){
  let nom=document.getElementById('paiementEleve').value; let m=Number(document.getElementById('paiementMontant').value||0); let box=document.getElementById('apercuApresPaiement');
  if(!nom||!m){ box.style.display="none"; return; }
  let s=soldeEleve(nom); let resteApres=Math.max(0, s.reste - m); box.style.display="block"; box.innerHTML=`Après ce paiement de <b>${m} FCFA</b>, il restera : <b>${resteApres} FCFA</b>`;
}
// ✅ CHOIX A - CORRIGÉ : la Secrétaire envoie en EN_ATTENTE, le Directeur valide dans Admin.html
async function enregistrerPaiementFormulaire(){
  let eleve=document.getElementById('paiementEleve').value;
  let montant=Number(document.getElementById('paiementMontant').value||0);
  let motif=document.getElementById('paiementMotif').value;
  let date=document.getElementById('paiementDate').value;
  let msg=document.getElementById('msgPaiement');
  if(!eleve||!montant){ msg.style.color="red"; msg.textContent="❌ Choisis l'élève et le montant"; return; }
  let e=TOUS_ELEVES_GESTION.find(x=>(x.enfant||x.nomEnfant||"")===eleve) || {};
  let ecoleEleve = e.ecole || e.ecoleNom || e.groupe || e.groupeNom || "";
  let ecoleIdEleve = e.ecoleId || e.groupeId || e.idEcole || "";
  let groupeEleve = e.groupe || e.groupeNom || ecoleEleve || "";
  try{
    await db.collection("paiements").add({
      enfant:eleve,
      parent:e.parent||"",
      tel:e.tel||"",
      montant,
      motif,
      mode:"Espèces",
      statut:"en_attente",
      statutPaiement:"en_attente",
      ecole:ecoleEleve,
      ecoleNom:ecoleEleve,
      ecoleId:ecoleIdEleve,
      groupe:groupeEleve,
      groupeNom:groupeEleve,
      eleveId:e.id||"",
      niveau:e.niveau||"",
      envoyePar:"gestion-secretaire",
      envoyeParEmail:emailSD||"",
      ecoleSecretaire:monEcoleNom||"",
      date:date||new Date().toLocaleDateString('fr-FR'),
      createdAt:new Date()
    });
    msg.style.color="green";
    msg.textContent="✅ Paiement envoyé en attente : "+montant+" FCFA pour "+eleve+" ("+ecoleEleve+") - Le Directeur va le valider dans Admin.html, et le Sous-Directeur de "+ecoleEleve+" le verra après validation.";
    document.getElementById('paiementMontant').value="";
    chargerPaiementsGestion(); chargerElevesGestion();
  }catch(er){ msg.style.color="red"; msg.textContent="❌ "+er.message; }
}
async function chargerPaiementsGestion(){
  try{
    let snapP = await db.collection("paiements").limit(500).get();
    TOUS_PAIEMENTS_GESTION = [];
    snapP.forEach(doc=>{ TOUS_PAIEMENTS_GESTION.push({id:doc.id, ...doc.data()}); });
    syncMesListes();
  }catch(e){ console.log("Paiements:", e.message); }
  if(!TOUS_ELEVES_GESTION.length){ try{ await chargerElevesGestion(); }catch(e){} }
  afficherPaiementsGestion(filtrePaiementActuel);
  chargerHistoriquePaiements();
}
function afficherPaiementsGestion(filtre){
  let box=document.getElementById('listePaiementsGestion'); if(!box) return;
  if(!TOUS_ELEVES_GESTION.length){ box.innerHTML=`<p class="centre muted">Charge les élèves d'abord.</p>`; return; }
  let liste=TOUS_ELEVES_GESTION.filter(e=>{ let s=soldeEleve(e.enfant||e.nomEnfant||""); if(filtre==="paye" && s.statut!=="paye") return false; if(filtre==="avance" && s.statut!=="avance") return false; if(filtre==="nonpaye" && s.statut!=="nonpaye") return false; return true; });
  if(!liste.length){ box.innerHTML=`<p class="centre muted">Aucun élève dans ce filtre.</p>`; return; }
  let html=`<table class="table-blanc"><thead><tr><th>Élève</th><th>Déjà payé</th><th>Reste</th><th>Statut</th><th>Action</th></tr></thead><tbody>`;
  liste.forEach(e=>{ let nom=e.enfant||e.nomEnfant||""; let s=soldeEleve(nom); let badge = s.statut==="paye" ? `<span class="badge badge-paye">✓ PAYÉ</span>` : s.statut==="avance" ? `<span class="badge badge-avance">◐ AVANCE</span>` : `<span class="badge badge-nonpaye">✗ NON PAYÉ</span>`; html+=`<tr><td><b>${nom}</b><br><small>${e.parent||""} - ${e.tel||""} - ${e.ecole||e.groupe||""}</small></td><td><b>${s.totalPaye}</b></td><td><b style="color:red">${s.reste}</b></td><td>${badge}</td><td><a class="lien-action" href="https://wa.me/237${nettoyerTelGestion(e.tel||"")}?text=${encodeURIComponent("Salam "+(e.parent||"")+", il reste "+s.reste+" FCFA pour "+nom+" - "+monEcoleNom)}" target="_blank">💬 Relancer</a></td></tr>`; });
  html+=`</tbody></table>`; box.innerHTML=html;
}
function filtrerPaiements(filtre, btn){ filtrePaiementActuel=filtre; document.querySelectorAll('#tabPaiements .btn-filtre').forEach(b=>b.classList.remove('actif')); if(btn) btn.classList.add('actif'); afficherPaiementsGestion(filtre); }
function relancerTousLesImpayes(){
  let impayes=TOUS_ELEVES_GESTION.filter(e=>soldeEleve(e.enfant||e.nomEnfant||"").statut!=="paye");
  if(!impayes.length){ alert("🎉 Tout le monde a payé"); return; }
  let txt="Salam, rappel paiement - "+monEcoleNom+" :\n"; impayes.forEach(e=>{ txt+=`- ${e.enfant||""} (${e.ecole||e.groupe||""}) : reste ${soldeEleve(e.enfant||"").reste} FCFA\n`; }); window.open("https://wa.me/?text="+encodeURIComponent(txt),"_blank");
}
function chargerHistoriquePaiements(){
  let box=document.getElementById('historiquePaiements'); if(!box) return;
  if(!TOUS_PAIEMENTS_GESTION.length){ box.innerHTML=`<p class="centre muted">Aucun historique.</p>`; return; }
  let liste = TOUS_PAIEMENTS_GESTION.filter(p=>{
    if(modeToutesEcoles) return true;
    if(!p.ecole && !p.ecoleNom && !p.groupe) return true;
    return estAMoiGestion(p);
  });
  if(!liste.length){ box.innerHTML=`<p class="centre muted">Aucun historique pour ton école.</p>`; return; }
  let html=`<table class="table-blanc"><thead><tr><th>Enfant</th><th>Montant</th><th>Motif</th><th>Date</th><th>Statut</th></tr></thead><tbody>`;
  liste.slice().reverse().forEach(p=>{ html+=`<tr><td><b>${p.enfant||p.enfantNom||""}</b></td><td><b>${p.montant||0}</b></td><td>${p.motif||""}</td><td>${p.date||""}</td><td>${p.statut||"valide"}</td></tr>`; });
  html+=`</tbody></table>`; box.innerHTML=html;
}
function telechargerPaiementsPDF(){ window.print(); }
function partagerPaiementsWhatsApp(){ relancerTousLesImpayes(); }
function telechargerHistoriquePaiementsPDF(){ window.print(); }
async function effacerHistoriquePaiements(){ if(!confirm("Effacer l'historique des paiements ?")) return; try{ let snap=await db.collection("paiements").limit(500).get(); for(let doc of snap.docs){ let d=doc.data(); if(estAMoiGestion(d)) await db.collection("paiements").doc(doc.id).delete(); } chargerPaiementsGestion(); }catch(e){ alert("❌ "+e.message); } }
async function ajouterEnseignant(){
  let nom=document.getElementById('ensNom').value.trim(); let tel=document.getElementById('ensTel').value.trim(); let role=document.getElementById('ensRole').value; let matiere=document.getElementById('ensMatiere').value; let classe=document.getElementById('ensClasse').value; let salaire=Number(document.getElementById('ensSalaire').value||0);
  if(!nom||!tel){ alert("❌ Mets Nom et Téléphone"); return; }
  try{ await db.collection("enseignants").add({nom, tel, role, matiere, classe, salaire, ecole:monEcoleNom, ecoleId:monEcoleId, date:new Date().toLocaleDateString('fr-FR'), createdAt:new Date()}); document.getElementById('ensNom').value=""; document.getElementById('ensTel').value=""; document.getElementById('ensSalaire').value=""; chargerEnseignants(); }catch(e){ alert("❌ "+e.message); }
}
async function chargerEnseignants(){
  let box=document.getElementById('listeEnseignants'); if(!box) return;
  try{
    let snap=await db.collection("enseignants").limit(100).get(); TOUS_ENSEIGNANTS=[]; snap.forEach(doc=>{ let d={id:doc.id,...doc.data()}; if(estAMoiGestion(d)) TOUS_ENSEIGNANTS.push(d); });
    let sel=document.getElementById('selectEnseignantCom'); if(sel){ sel.innerHTML=`<option value="">— Choisis —</option>`; TOUS_ENSEIGNANTS.forEach(e=>sel.innerHTML+=`<option value="${e.tel}">${e.nom} - ${e.role} - ${e.ecole||""}</option>`); }
    if(!TOUS_ENSEIGNANTS.length){ box.innerHTML=`<p class="centre muted">Aucun enseignant.</p>`; return; }
    let html=`<table class="table-blanc"><thead><tr><th>Nom</th><th>Rôle / Matière</th><th>Tél</th><th>Salaire</th><th>Action</th></tr></thead><tbody>`;
    TOUS_ENSEIGNANTS.forEach(e=>{ html+=`<tr><td><b>${e.nom}</b></td><td>${e.role}<br><small>${e.matiere||""} - ${e.classe||""} - ${e.ecole||""}</small></td><td>${e.tel}</td><td>${e.salaire||0}</td><td><button class="lien-action" onclick="supprimerEnseignant('${e.id}')">🗑️ Supprimer</button></td></tr>`; });
    html+=`</tbody></table>`; box.innerHTML=html;
  }catch(e){ box.innerHTML="❌ "+e.message; }
}
async function supprimerEnseignant(id){ if(!confirm("Supprimer cet enseignant ?")) return; try{ await db.collection("enseignants").doc(id).delete(); chargerEnseignants(); }catch(e){ alert("❌ "+e.message); } }
function telechargerEnseignantsPDF(){ window.print(); }
function creerGroupeWhatsAppEnseignants(){ if(!TOUS_ENSEIGNANTS.length){ alert("Aucun enseignant"); return; } let txt="Groupe Enseignants - "+monEcoleNom+" :\n"+TOUS_ENSEIGNANTS.map(e=>e.nom+" - "+e.tel).join("\n"); window.open("https://wa.me/?text="+encodeURIComponent(txt),"_blank"); }
function envoyerMessageTousEnseignants(){ if(!TOUS_ENSEIGNANTS.length){ alert("Aucun enseignant"); return; } let msg=prompt("Ton message aux enseignants :"); if(!msg) return; TOUS_ENSEIGNANTS.forEach(e=>{ window.open("https://wa.me/237"+nettoyerTelGestion(e.tel)+"?text="+encodeURIComponent(msg),"_blank"); }); }
function envoyerMessageUnEnseignant(){ let tel=document.getElementById('selectEnseignantCom').value; let msg=document.getElementById('msgEnseignantCom').value.trim(); if(!tel||!msg){ alert("Choisis l'enseignant et écris le message"); return; } window.open("https://wa.me/237"+nettoyerTelGestion(tel)+"?text="+encodeURIComponent(msg),"_blank"); }
async function effacerHistoriquePaiementsEnseignants(){ if(confirm("Effacer les enseignants ?")){ try{ for(let e of TOUS_ENSEIGNANTS) await db.collection("enseignants").doc(e.id).delete(); chargerEnseignants(); }catch(er){ alert(er.message); } } }
// ===== BULLETIN BILINGUE FR-AR / EN-AR + ECOLE SPECIFIQUE - FIX FAUX ID + NOM CASSE =====
function getLangBulletin(){ return (document.getElementById('langueBulletin')?.value)||"fr-ar"; }
function nomMatiereBulletinSelonLangue(fr){
  let ar = MATIERES_AR[fr]||"";
  if(getLangBulletin()==="en-ar"){ let en = MATIERES_EN[fr]||fr; return en + " - " + ar; }
  return fr + (ar ? " - " + ar : "");
}
async function chargerNotesExistantes(){
  let eleve=document.getElementById('bulEleve').value; let tri=document.getElementById('bulTrimestre').value; let form=document.getElementById('formNotes'); if(!form) return;
  if(!eleve){ form.innerHTML=""; return; }
  if(!TOUS_BULLETINS.length){ try{ await chargerBulletins(); }catch(e){} }
  let actifs=getMatieresActives(); if(!actifs.length){ form.innerHTML=`<p class="centre" style="color:red">❌ Aucune matière active. Va dans Paramètres.</p>`; return; }
  let lang = getLangBulletin(); let isEn = lang==="en-ar";
  let titreTri = isEn ? (tri==="Trimestre 1"?"Term 1":tri==="Trimestre 2"?"Term 2":"Term 3") : tri;
  let hMatiere = isEn ? "Subject / المادة" : "Matière / المادة";
  let hOral = "Oral /10 / الشفهي";
  let hEcrit = isEn ? "Written /10 / الكتابي" : "Écrit /10 / الكتابي";
  let hTotal = "Total /20 / المجموع";
  let ecoleAff = ecoleDeEleveBulletin(eleve)||"";
  let html=`<h3 style="text-align:center">Notes - ${eleve} ${ecoleAff?` - ${ecoleAff}`:""} - ${titreTri}<br><span style="font-size:13px" dir="rtl">العلامات - ${eleve}</span></h3><table class="table-blanc"><thead><tr><th>${hMatiere}</th><th>${hOral}</th><th>${hEcrit}</th><th>${hTotal}</th></tr></thead><tbody>`;
  actifs.forEach(m=>{
    let exist=TOUS_BULLETINS.find(b=>b.trimestre===tri && normaliser(b.matiere)===normaliser(m.fr) && (normaliser(b.eleve)===normaliser(eleve) || normaliser(eleve).startsWith(normaliser(b.eleve)) || normaliser(b.eleve).startsWith(normaliser(eleve))));
    let oral=exist?exist.oral||0:0, ecrit=exist?exist.ecrit||0:0;
    html+=`<tr><td><b>${nomMatiereBulletinSelonLangue(m.fr)}</b></td><td><input type="number" min="0" max="10" step="0.5" class="note-input" data-matiere="${m.fr}" data-type="oral" value="${oral}" oninput="calculerTotalLigne(this)"></td><td><input type="number" min="0" max="10" step="0.5" class="note-input" data-matiere="${m.fr}" data-type="ecrit" value="${ecrit}" oninput="calculerTotalLigne(this)"></td><td><b class="total-ligne" data-matiere="${m.fr}">${(Number(oral)+Number(ecrit)).toFixed(1)}</b></td></tr>`;
  });
  html+=`</tbody></table>`; form.innerHTML=html;
}
function calculerTotalLigne(input){ let mat=input.dataset.matiere; let oral=Number(document.querySelector(`input[data-matiere="${mat}"][data-type="oral"]`)?.value||0); let ecrit=Number(document.querySelector(`input[data-matiere="${mat}"][data-type="ecrit"]`)?.value||0); let el=document.querySelector(`.total-ligne[data-matiere="${mat}"]`); if(el) el.textContent=(oral+ecrit).toFixed(1); }
async function enregistrerBulletinComplet(){
  let eleve=document.getElementById('bulEleve').value; let tri=document.getElementById('bulTrimestre').value; let annee=document.getElementById('bulAnnee').value; let app=document.getElementById('bulAppreciationGenerale').value; let msg=document.getElementById('msgBulletin');
  if(!eleve){ msg.style.color="red"; msg.textContent="❌ Choisis l'élève"; return; }
  let inputs=[...document.querySelectorAll('#formNotes input[data-matiere]')]; if(!inputs.length){ msg.style.color="red"; msg.textContent="❌ Aucune matière active"; return; }
  let ecoleEleve = ecoleDeEleveBulletin(eleve) || monEcoleNom;
  try{
    for(let inp of inputs){
      let mat=inp.dataset.matiere, type=inp.dataset.type, val=Number(inp.value||0);
      let exist=TOUS_BULLETINS.find(b=> normaliser(b.eleve)===normaliser(eleve) && b.trimestre===tri && normaliser(b.matiere)===normaliser(mat));
      if(exist && exist.source==="bulletins" && exist.realDocId){
        let upd={}; upd[type]=val;
        upd.moyenne=(type==="oral" ? val + Number(exist.ecrit||0) : Number(exist.oral||0) + val);
        upd.ecole=ecoleEleve; upd.ecoleEleve=ecoleEleve;
        await db.collection("bulletins").doc(exist.realDocId).update(upd);
      } else if(exist && exist.source!=="bulletins"){
        await db.collection("bulletins").add({eleve, trimestre:tri, annee, matiere:mat, oral:type==="oral"?val:0, ecrit:type==="ecrit"?val:0, moyenne:val, appreciation:app, ecole:ecoleEleve, ecoleEleve:ecoleEleve, ecoleId:monEcoleId, createdAt:new Date()});
      } else {
        await db.collection("bulletins").add({eleve, trimestre:tri, annee, matiere:mat, oral:type==="oral"?val:0, ecrit:type==="ecrit"?val:0, moyenne:val, appreciation:app, ecole:ecoleEleve, ecoleEleve:ecoleEleve, ecoleId:monEcoleId, createdAt:new Date()});
      }
    }
    msg.style.color="green"; msg.textContent="✅ Bulletin enregistré pour "+eleve+" ("+ecoleEleve+") - "+tri; await chargerBulletins(); await chargerNotesExistantes();
  }catch(e){ msg.style.color="red"; msg.textContent="❌ "+e.message; }
}
// ===== FIN PARTIE 1 - LA SUITE (chargerBulletins...) RESTE DANS TA PARTIE 2 =====
// ===== BOUTON LIAISON - QUE POUR LA SECRÉTAIRE, PAS POUR LE DIRECTEUR (il valide dans Admin.html) =====
function ajouterBoutonLiaisonDirecteur(){
  if(monRoleGestion !== "secretaire") return;
  if(document.getElementById('btnAllerLiaison')) return;
  let btn = document.createElement('a');
  btn.id = 'btnAllerLiaison';
  btn.href = 'liaison-gestion-sd.html';
  btn.target = '_blank';
  btn.textContent = '🔗 ALLER À LA LIAISON - Voir les paiements';
  btn.style.cssText = 'display:block;background:#0F3D2E;color:white;text-align:center;font-weight:800;font-size:15px;padding:14px 10px;border-radius:12px;margin:12px 0;text-decoration:none;box-shadow:0 3px 8px rgba(0,0,0,0.2)';
  let cible = document.getElementById('gestionEmail');
  if(cible && cible.parentNode){ cible.parentNode.insertBefore(btn, cible.nextSibling); return; }
  let panel = document.getElementById('gestionPanel');
  if(panel) panel.insertBefore(btn, panel.firstChild);
}
setTimeout(ajouterBoutonLiaisonDirecteur, 1000);

// ===== PARTIE 2 CORRIGÉE - CHOIX A : Directeur valide dans Admin.html, pas dans la Liaison =====
async function chargerBulletins(){
  try{
    if(!TOUS_ELEVES_GESTION.length){
      try{
        let snapE = await db.collection("inscriptions").limit(200).get();
        TOUS_ELEVES_GESTION = [];
        snapE.forEach(doc=>{ let d={id:doc.id,...doc.data()}; if(estAMoiGestion(d)) TOUS_ELEVES_GESTION.push(d); });
        syncMesListes();
      }catch(e){}
    }
    let tous=[];
    function ajouterNote(raw, source, docId){
      let listes = [];
      // FIX NOM : on ne fait PLUS {...raw, ...n} qui ecrasait le nom avec un bout d'ecole
      if(Array.isArray(raw.notes)) listes.push(...raw.notes.map(n=>({...n, _parentEleve: raw.eleve||raw.enfant||raw.nomEleve||"", _parentEcole: raw.ecole||raw.ecoleNom||"", _parentTrimestre: raw.trimestre||"", _parentAnnee: raw.annee||""})));
      if(Array.isArray(raw.eleves)) listes.push(...raw.eleves);
      if(Array.isArray(raw.lignes)) listes.push(...raw.lignes);
      if(Array.isArray(raw.resultats)) listes.push(...raw.resultats);
      if(!listes.length) listes.push(raw);
      listes.forEach(v=>{
        if(v.notes && Array.isArray(v.notes)){ v.notes.forEach(n=> ajouterNote({...v, ...n}, source, docId)); return; }
        let eleve = v.eleve || v.enfant || v.enfantNom || v.nomEleve || v.nomEnfant || v._parentEleve || v.nom || v.eleveNom || "";
        if(v._parentEleve && (!v.eleve || eleve.length < 4 || eleve.includes("Camp"))){ eleve = v._parentEleve; }
        let matiere = v.matiere || v.matiereNom || v.nomMatiere || v.subject || "";
        let oral = Number(v.oral ?? v.noteOral ?? v.oral1 ?? v.n1 ?? v.note1 ?? v.note_oral ?? 0);
        let ecrit = Number(v.ecrit ?? v.noteEcrit ?? v.ecrit1 ?? v.n2 ?? v.note2 ?? v.note_ecrit ?? 0);
        let moyenne = Number(v.moyenne ?? v.total ?? v.note ?? v.noteSur20 ?? (oral + ecrit));
        if(!eleve || !matiere) return;
        tous.push({
          id: source+"_"+docId+"_"+normaliser(eleve)+"_"+normaliser(matiere),
          realDocId: docId,
          source, eleve,
          trimestre: v.trimestre || v.periode || v.trim || v._parentTrimestre || "Trimestre 1",
          annee: v.annee || v._parentAnnee || "2026-2027",
          matiere, oral, ecrit, moyenne,
          appreciation: v.appreciation||"",
          ecole: v.ecole || v.ecoleNom || v.groupe || v.groupeNom || v._parentEcole || v.ecoleId || "",
          ecoleId: v.ecoleId || "", ecoleEleve: v.ecoleEleve || ""
        });
      });
    }
    let cols = ["bulletins","notes","notes_eleves","bulletins_enseignants","notes_trimestre","resultats","notesEleves","compositions","enseignants_notes"];
    for(let col of cols){ try{ let s = await db.collection(col).limit(500).get(); s.forEach(d=> ajouterNote(d.data(), col, d.id)); }catch(e){} }
    tous.forEach(b=>{
      let ee = ecoleDeEleveBulletin(b.eleve);
      b.ecoleEleve = ee || b.ecoleEleve || b.ecole || "";
      if(!b.ecole) b.ecole = b.ecoleEleve;
    });
    let filtreEcoleB = (document.getElementById('filtreEcoleBulletin')?.value)||"";
    let filtres = tous.filter(b=>{
      if(filtreEcoleB){
        let eb = b.ecoleEleve||b.ecole||"";
        if(!eb) return true;
        return normaliser(eb)===normaliser(filtreEcoleB);
      }
      if(!modeToutesEcoles){
        let eb = b.ecoleEleve||b.ecole||"";
        if(!eb) return true;
        return normaliser(eb)===normaliser(monEcoleNom) || normaliser(b.ecoleId)===normaliser(monEcoleId) || estAMoiGestion(b);
      }
      return true;
    });
    let map={}; filtres.forEach(b=>{ let k=normaliser(b.eleve)+"||"+b.trimestre+"||"+normaliser(b.matiere); map[k]=b; });
    TOUS_BULLETINS = Object.values(map);
    afficherBulletins();
    let info = document.getElementById('infoFiltreBulletin');
    if(info) info.innerHTML = filtreEcoleB ? `Tu vois : <b>${filtreEcoleB}</b> — <b>${TOUS_BULLETINS.length}</b> note(s)` : `Tu vois : <b>Toutes les écoles</b> — <b>${TOUS_BULLETINS.length}</b> note(s). Choisis une école en haut pour ne voir qu'elle.`;
    let msg=document.getElementById('msgBulletin'); if(msg) msg.innerHTML = `✅ ${TOUS_BULLETINS.length} notes trouvées. Brutes: ${tous.length}.`;
  }catch(e){ let box=document.getElementById('listeBulletins'); if(box) box.innerHTML="❌ "+e.message; }
}
async function chargerBulletinsTous(){ await chargerBulletins(); }
function afficherBulletins(){
  let box=document.getElementById('listeBulletins'); if(!box) return;
  if(!TOUS_BULLETINS.length){ box.innerHTML=`<p class="centre muted">Aucun bulletin. Les enseignants n'ont pas encore enregistré, ou clique sur Actualiser.</p>`; return; }
  let nbFixe = getNbMatieresFixees(); let parEleve={};
  TOUS_BULLETINS.forEach(b=>{ let k=b.eleve+"||"+b.trimestre; if(!parEleve[k]) parEleve[k]={eleve:b.eleve, trimestre:b.trimestre, total:0, nb:0}; parEleve[k].total+=Number(b.moyenne||0); parEleve[k].nb++; });
  let html=`<table class="table-blanc"><thead><tr><th>Élève</th><th>École</th><th>Trimestre</th><th>Composé / Fixé</th><th>Moyenne</th><th>Action</th></tr></thead><tbody>`;
  Object.values(parEleve).forEach(g=>{ let moy=(g.total / nbFixe).toFixed(2); let ex = TOUS_BULLETINS.find(b=>b.eleve===g.eleve); let ecoleAff = (ex && (ex.ecoleEleve||ex.ecole)) || ecoleDeEleveBulletin(g.eleve) || ""; html+=`<tr><td><b>${g.eleve}</b></td><td><b style="color:#1B5E20">${ecoleAff}</b></td><td>${g.trimestre}</td><td>${g.nb} / ${nbFixe}</td><td><b>${moy} / 20</b></td><td><button class="lien-action" onclick="voirBulletinDetail('${g.eleve}','${g.trimestre}')">👁️ Voir</button></td></tr>`; });
  html+=`</tbody></table><p class="centre muted" style="font-size:12px">Formule du Directeur : Moyenne = Somme des notes / ${nbFixe} matières fixées. Matière manquante = 0.</p>`; box.innerHTML=html;
}
function voirBulletinDetail(eleve, tri){
  let lignes=TOUS_BULLETINS.filter(b=>b.eleve===eleve && b.trimestre===tri);
  let nbFixe = getNbMatieresFixees(); let moy = calculerMoyenneTrimestre(lignes).toFixed(2);
  let isEn = getLangBulletin()==="en-ar";
  let ecoleSpecifique = (lignes[0] && (lignes[0].ecoleEleve||lignes[0].ecole)) || ecoleDeEleveBulletin(eleve) || monEcoleNom;
  let T = {
    institut: isEn ? "NOUROUL IYMANE INSTITUTE" : "INSTITUT NOUROUL IYMANE",
    institutAr: "معهد نور الإيمان",
    bulletin: isEn ? "Report Card" : "Bulletin", bulletinAr: "كشف النقاط",
    eleve: isEn ? "Student" : "Élève", eleveAr: "التلميذ",
    ecole: isEn ? "School" : "École", ecoleAr: "المدرسة",
    moyenne: isEn ? "Average" : "Moyenne", moyenneAr: "المعدل",
    matiere: isEn ? "Subject" : "Matière", matiereAr: "المادة",
    oral: "Oral /10", oralAr: "الشفهي",
    ecrit: isEn ? "Written /10" : "Écrit /10", ecritAr: "الكتابي",
    total: "Total /20", totalAr: "المجموع",
    moyGen: isEn ? "GENERAL AVERAGE (Sum / "+nbFixe+" fixed subjects)" : "MOYENNE GÉNÉRALE (Somme / "+nbFixe+" matières fixées)", moyGenAr: "المعدل العام",
    absent: "(Absent)", absentAr: "(غائب)",
    directeur: isEn ? "The Sub-Director / Secretary" : "Le Sous-Directeur / Secrétaire", directeurAr: "نائب المدير / السكرتيرة",
    parent: isEn ? "The Parent" : "Le Parent", parentAr: "الولي",
    trimestre: isEn ? (tri==="Trimestre 1"?"Term 1":tri==="Trimestre 2"?"Term 2":"Term 3") : tri,
    annee: isEn ? "Year" : "Année", anneeAr: "السنة"
  };
  let html=`<div class="bulletin-page"><div class="b-head"><h2>☪️ ${T.institut}</h2><p style="font-size:16px;font-weight:800" dir="rtl">${T.institutAr}</p><p>${T.bulletin} - ${T.trimestre} - ${T.annee} ${lignes[0]?.annee||"2026-2027"}</p><p dir="rtl" style="font-size:13px;font-weight:700">${T.bulletinAr} - ${T.trimestre} - ${T.anneeAr} ${lignes[0]?.annee||"2026-2027"}</p></div><div class="b-infos"><div><b>${T.eleve}<br><span dir="rtl">${T.eleveAr}</span></b><br>${eleve}</div><div><b>${T.ecole}<br><span dir="rtl">${T.ecoleAr}</span></b><br>${ecoleSpecifique}</div><div><b>${T.moyenne}<br><span dir="rtl">${T.moyenneAr}</span></b><br>${moy} / 20</div></div><table><thead><tr><th>${T.matiere} / ${T.matiereAr}</th><th>${T.oral} / ${T.oralAr}</th><th>${T.ecrit} / ${T.ecritAr}</th><th>${T.total} / ${T.totalAr}</th></tr></thead><tbody>`;
  lignes.forEach(l=>{ html+=`<tr><td>${nomMatiereBulletinSelonLangue(l.matiere)}</td><td>${l.oral||0}</td><td>${l.ecrit||0}</td><td><b>${l.moyenne||0}</b></td></tr>`; });
  getMatieresActives().forEach(m=>{ if(!lignes.find(l=>normaliser(l.matiere)===normaliser(m.fr))){ html+=`<tr><td>${nomMatiereBulletinSelonLangue(m.fr)} <small style="color:red">${T.absent} ${T.absentAr}</small></td><td>0</td><td>0</td><td><b style="color:red">0</b></td></tr>`; } });
  let appreciation = lignes[0]?.appreciation||"";
  let appreciationAr = "";
  if(appreciation){
    let low = appreciation.toLowerCase();
    if(low.includes("très bon")||low.includes("tres bon")||low.includes("excellent")) appreciationAr = "عمل ممتاز، واصل على هذا المنوال";
    else if(low.includes("bon travail")||low.includes("bien")) appreciationAr = "عمل جيد، واصل";
    else if(low.includes("encourag")||low.includes("effort")) appreciationAr = "تشجيع، واصل بذل الجهد";
    else if(low.includes("moyen")||low.includes("peut mieux")) appreciationAr = "يمكنك أن تفعل أفضل";
    else appreciationAr = appreciation;
  }
  html+=`</tbody></table><div class="b-total"><span>${T.moyGen}<br><span dir="rtl" style="font-size:11px">${T.moyGenAr}</span></span><span>${moy} / 20</span></div><div class="b-app"><b>${isEn?"Appreciation / ":"Appréciation / "}التقدير</b><br>${appreciation}<br><span dir="rtl">${appreciationAr}</span></div><div class="b-sign"><div>${T.directeur}<br><span dir="rtl">${T.directeurAr}</span><br><br>___________</div><div>${T.parent}<br><span dir="rtl">${T.parentAr}</span><br><br>___________</div></div></div>`;
  document.getElementById('zoneImpression').innerHTML=html; document.getElementById('zoneImpression').style.display="block"; window.print();
}
function telechargerBulletinsPDF(){ window.print(); }
async function effacerHistoriqueBulletins(){ if(!confirm("Effacer tous les bulletins ?")) return; try{ for(let b of TOUS_BULLETINS.filter(x=>x.source==="bulletins" && x.realDocId)) await db.collection("bulletins").doc(b.realDocId).delete(); chargerBulletins(); }catch(e){ alert(e.message); } }
async function chargerPresence(){
  try{
    if(!TOUS_ELEVES_GESTION.length) await chargerElevesGestion();
    let snap=await db.collection("presences").limit(200).get();
    let presences=[]; snap.forEach(d=> presences.push({id:d.id, ...d.data()}));
    TOUS_PRESENCES = presences;
    let stats={};
    TOUS_ELEVES_GESTION.forEach(e=>{ let nom=e.enfant||e.nomEnfant||""; stats[nom]={nom, ecole:nomEcoleDeEleveSimple(e), niveau:e.niveau||"", present:0, absent:0}; });
    presences.forEach(p=>{
      if(p.eleves && Array.isArray(p.eleves)){
        p.eleves.forEach(ev=>{ let nom=ev.nom||ev.eleve||ev.enfant||""; if(!stats[nom]) stats[nom]={nom, ecole:p.ecole||"", niveau:"", present:0, absent:0}; if(ev.present===false || ev.statut==="absent" || ev.absent) stats[nom].absent++; else stats[nom].present++; });
        return;
      }
      if(p.absentsNoms && Array.isArray(p.absentsNoms)){
        let ecoleJour = p.ecole||p.ecoleNom||p.groupe||"";
        p.absentsNoms.forEach(nom=>{ if(!stats[nom]) stats[nom]={nom, ecole:ecoleJour, niveau:"", present:0, absent:0}; stats[nom].absent++; });
        TOUS_ELEVES_GESTION.forEach(e=>{
          let nom=e.enfant||e.nomEnfant||"";
          if(p.absentsNoms.includes(nom)) return;
          if(ecoleJour && normaliser(nomEcoleDeEleveSimple(e))!==normaliser(ecoleJour) && ecoleJour!=="TOUTES LES ÉCOLES") return;
          stats[nom].present++;
        });
        return;
      }
    });
    let ecoleF = (document.getElementById('filtreEcolePresence')?.value)||"";
    let niveauF = (document.getElementById('filtreNiveauPresence')?.value)||"";
    let liste = Object.values(stats).filter(s=>{ if(ecoleF && normaliser(s.ecole)!==normaliser(ecoleF)) return false; if(niveauF && String(s.niveau)!==String(niveauF)) return false; return true; }).sort((a,b)=> a.nom.localeCompare(b.nom));
    let box=document.getElementById('listePresenceParEleve');
    if(!box) box=document.getElementById('listePresence');
    if(box){
      if(!liste.length) box.innerHTML=`<p class="centre muted">Aucun élève. L'appel doit être fait dans les écoles.</p>`;
      else{
        let h=`<table class="table-blanc"><thead><tr><th>Élève</th><th>École</th><th>Niveau</th><th>✅ Présences</th><th>❌ Absences</th><th>Total appels</th></tr></thead><tbody>`;
        liste.forEach(s=>{ let total=s.present+s.absent; h+=`<tr><td><b>${s.nom}</b></td><td><b style="color:#1B5E20">${s.ecole}</b></td><td>${s.niveau}</td><td><b style="color:green">${s.present}</b></td><td><b style="color:red">${s.absent}</b></td><td>${total}</td></tr>`; });
        h+=`</tbody></table><p class="centre muted" style="font-size:11px">Présence comptée depuis les appels faits dans les écoles. Si un élève a 0 / 0, son école n'a pas encore fait l'appel.</p>`;
        box.innerHTML=h;
      }
    }
    let selE=document.getElementById('filtreEcolePresence');
    if(selE && selE.options.length<=1){ let ecoles=new Set(); TOUS_ELEVES_GESTION.forEach(e=>ecoles.add(nomEcoleDeEleveSimple(e))); selE.innerHTML=`<option value="">— Toutes les écoles —</option>`+[...ecoles].sort().map(n=>`<option value="${n}">${n}</option>`).join(''); }
    let selN=document.getElementById('filtreNiveauPresence');
    if(selN && selN.options.length<=1){ let niv=new Set(); TOUS_ELEVES_GESTION.forEach(e=>{ if(e.niveau) niv.add(e.niveau); }); selN.innerHTML=`<option value="">— Tous les niveaux —</option>`+[...niv].sort().map(n=>`<option value="${n}">${n}</option>`).join(''); }
    let hist=document.getElementById('historiquePresence');
    if(hist){ let hh=""; presences.slice(-10).reverse().forEach(p=>{ hh+=`<p style="font-size:12px">${p.date||""} - ${p.ecole||""} - Présents: <b>${p.presents??""}</b> - Absents: <b style="color:red">${p.absents??""}</b> - ${(p.absentsNoms||[]).join(", ")}</p>`; }); hist.innerHTML=hh||"<p class='muted centre'>Aucune présence.</p>"; }
    let d=document.getElementById('datePresence'); if(d && !d.value) d.value=new Date().toISOString().slice(0,10);
  }catch(e){ console.log("Presence:", e.message); }
}
function filtrerPresenceParEcoleNiveau(){ chargerPresence(); }
async function sauvegarderPresence(){ alert("L'appel se fait dans les écoles, pas au secrétariat. Va voir le tableau par élève ci-dessus."); }
function telechargerPresencePDF(){ window.print(); }
async function effacerHistoriquePresence(){ if(!confirm("Effacer l'historique présence ?")) return; try{ for(let p of TOUS_PRESENCES) await db.collection("presences").doc(p.id).delete(); chargerPresence(); }catch(e){ alert(e.message); } }
function calculerBilanAnnuel(){
  let box=document.getElementById('zoneBilanEcole'); if(!box) return;
  if(!TOUS_BULLETINS.length){ box.innerHTML=`<p class="centre muted">Aucun bulletin.</p>`; return; }
  let nbFixe = getNbMatieresFixees(); let parEleveTri = {};
  TOUS_BULLETINS.forEach(b=>{ let k = b.eleve+"||"+b.trimestre; if(!parEleveTri[k]) parEleveTri[k]={eleve:b.eleve, trimestre:b.trimestre, total:0}; parEleveTri[k].total += Number(b.moyenne||0); });
  let parEleve = {}; Object.values(parEleveTri).forEach(g=>{ let moyTri = g.total / nbFixe; if(!parEleve[g.eleve]) parEleve[g.eleve]={totalTri:0, nbTri:0}; parEleve[g.eleve].totalTri += moyTri; parEleve[g.eleve].nbTri++; });
  let html=`<table class="table-blanc"><thead><tr><th>Élève</th><th>École</th><th>Moyenne Annuelle</th><th>Résultat</th></tr></thead><tbody>`;
  Object.keys(parEleve).sort().forEach(nom=>{ let d=parEleve[nom]; let moy=(d.totalTri/d.nbTri).toFixed(2); let ecoleAff = ecoleDeEleveBulletin(nom)||""; html+=`<tr><td><b>${nom}</b></td><td><b style="color:#1B5E20">${ecoleAff}</b></td><td><b>${moy} / 20</b></td><td>${moy>=10?"✅ ADMIS":"❌ NON ADMIS"}</td></tr>`; });
  html+=`</tbody></table><p class="centre muted" style="font-size:12px">Moyenne Trimestre = Somme / ${nbFixe} matières fixées. Moyenne Annuelle = (T1+T2+T3) / Nombre de trimestres composés.</p>`; box.innerHTML=html;
  let box2=document.getElementById('listeBulletinsAnnuels'); if(box2) box2.innerHTML=html;
}
function telechargerBilanAnnuelPDF(){ window.print(); }
async function publierDivers(){
  let titre=document.getElementById('diversTitre').value.trim(); let texte=document.getElementById('diversTexte').value.trim(); let dureeJours=Number(document.getElementById('diversDuree') ? document.getElementById('diversDuree').value : 7);
  if(!titre||!texte){ alert("Mets Titre et Message"); return; }
  let expireLe = new Date(); expireLe.setDate(expireLe.getDate() + dureeJours);
  try{ await db.collection("divers").add({titre, texte, ecole:monEcoleNom, ecoleId:monEcoleId, date:new Date().toLocaleDateString('fr-FR'), expireLe: expireLe.toISOString(), dureeJours: dureeJours, createdAt:new Date()}); document.getElementById('diversTitre').value=""; document.getElementById('diversTexte').value=""; alert("✅ Divers publié pour "+dureeJours+" jours."); chargerDivers(); }catch(e){ alert("❌ "+e.message); }
}
async function chargerDivers(){
  let box=document.getElementById('listeDivers'); if(!box) return;
  try{
    let snap=await db.collection("divers").limit(20).get(); let maintenant=new Date(); let h="";
    snap.forEach(doc=>{ let d=doc.data(); if(!estAMoiGestion(d)) return; let statut=""; if(d.expireLe){ let exp=new Date(d.expireLe); let resteJours=Math.ceil((exp - maintenant)/(1000*60*60*24)); if(maintenant > exp) statut=` <small style="color:red">⏰ Expirée - Plus visible à l'accueil</small>`; else statut=` <small style="color:green">⏰ Encore ${resteJours} jour(s) à l'accueil</small>`; } h+=`<p style="font-size:13px"><b>${d.titre||""}</b> - ${d.texte||""} <small>(${d.date||""})</small>${statut} <button class="lien-action" onclick="supprimerDivers('${doc.id}')">🗑️ Supprimer</button></p>`; });
    box.innerHTML=h||"<p class='muted centre'>Aucun divers.</p>";
  }catch(e){ box.innerHTML="❌ "+e.message; }
}
async function supprimerDivers(id){ if(!confirm("Supprimer cette annonce ?")) return; try{ await db.collection("divers").doc(id).delete(); chargerDivers(); }catch(e){ alert("❌ "+e.message); } }
async function effacerToutHistorique(){
  let code=prompt("Écris EFFACER pour valider"); if(code!=="EFFACER"){ alert("Annulé"); return; }
  try{ for(let b of TOUS_BULLETINS.filter(x=>x.source==="bulletins" && x.realDocId)) await db.collection("bulletins").doc(b.realDocId).delete(); for(let p of TOUS_PRESENCES) await db.collection("presences").doc(p.id).delete(); for(let p of TOUS_PAIEMENTS_GESTION) await db.collection("paiements").doc(p.id).delete(); alert("✅ Tout effacé"); chargerElevesGestion(); chargerPaiementsGestion(); chargerBulletins(); chargerPresence(); }catch(e){ alert(e.message); }
}
if(typeof auth!=="undefined"){
  auth.onAuthStateChanged(async (user)=>{
    if(user){ let s=localStorage.getItem("gestion_session"); if(s){ try{ let j=JSON.parse(s); if(j.email===user.email){ monRoleGestion=j.role||"sous-directeur"; modeToutesEcoles=!!j.toutes; await chargerMonEcoleGestion(user.email); } }catch(e){} } }
  });
}
window.addEventListener('load', ()=>{ let s=localStorage.getItem("gestion_session"); if(s && typeof auth!=="undefined" && auth.currentUser){ try{ let j=JSON.parse(s); chargerMonEcoleGestion(j.email); }catch(e){} } });
let prixParEcole = {}; let prixSecoursGlobal = 0; let mesRemises = [];
let TOUTES_ECOLES_GROUPES = [];
function nomEcoleDeEleve(e){ return e.ecoleNom || e.ecole || e.groupeNom || e.groupe || monEcoleNom || ""; }
function nomEleveDe(e){ return e.enfant || e.nomEnfant || e.nom || ""; }
function nomEnfantPaiement(p){ return p.enfantNom || p.enfant || p.nom || ""; }
function cleEcolePrix(nom){ return (nom||"").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_"); }
function getRemisePour(nomEnfant){ return mesRemises.find(r=> normaliser(r.enfant)===normaliser(nomEnfant)) || null; }
function prixPourEleveSansRemise(eleveObj){ if(!eleveObj) return Number(prixSecoursGlobal||fraisTotalEcole||0); let nomEcole = nomEcoleDeEleve(eleveObj); let cle = cleEcolePrix(nomEcole); if(prixParEcole[cle] && Number(prixParEcole[cle])>0) return Number(prixParEcole[cle]); return Number(prixSecoursGlobal||fraisTotalEcole||0); }
function prixPourEleve(eleveObj){ if(!eleveObj) return prixSecoursGlobal || fraisTotalEcole || 0; let remise = getRemisePour(nomEleveDe(eleveObj)); if(remise && remise.nouveauPrix > 0) return Number(remise.nouveauPrix); return prixPourEleveSansRemise(eleveObj); }
async function chargerListeEcolesGroupes(){
  let set = new Set();
  try{ let s1 = await db.collection("ecoles").get(); s1.forEach(d=>{ let v=d.data(); if(v.nom) set.add(v.nom); if(v.nomEcole) set.add(v.nomEcole); }); }catch(e){}
  try{ let s2 = await db.collection("groupes").get(); s2.forEach(d=>{ let v=d.data(); if(v.nom) set.add(v.nom); if(v.nomGroupe) set.add(v.nomGroupe); if(v.groupe) set.add(v.groupe); }); }catch(e){}
  mesEleves.forEach(e=>{ if(e.ecole) set.add(e.ecole); if(e.ecoleNom) set.add(e.ecoleNom); if(e.groupe) set.add(e.groupe); if(e.groupeNom) set.add(e.groupeNom); });
  Object.keys(prixParEcole).forEach(k=>{ if(!k.endsWith("_nom")) set.add(prixParEcole[k+"_nom"]||k); });
  TOUTES_ECOLES_GROUPES = [...set].sort();
  return TOUTES_ECOLES_GROUPES;
}
function remplirSelectPrixEcole(){
  let sel = document.getElementById('selectNomEcolePrix'); if(!sel) return;
  let v = sel.value;
  sel.innerHTML = `<option value="">— Choisis l'école / le groupe —</option>` + TOUTES_ECOLES_GROUPES.map(n=> `<option value="${n}">${n}</option>`).join('');
  if(v) sel.value = v;
  sel.onchange = ()=>{ let inp = document.getElementById('inputNomEcolePrix'); if(inp) inp.value = sel.value; };
}
async function chargerPrixParEcole(){
  try{
    let docsALire = ["global", monEcoleId||"global", "TOUTES"];
    for(let docId of docsALire){
      try{
        let doc = await db.collection("configPrixEcoles").doc(docId).get();
        if(doc.exists && doc.data().prix){ let p = doc.data().prix||{}; Object.keys(p).forEach(k=>{ prixParEcole[k]=p[k]; }); }
      }catch(e){}
    }
    try{
      let d2 = await db.collection("configFrais").doc(monEcoleId||"global").get();
      if(d2.exists && d2.data().montant){ prixSecoursGlobal = Number(d2.data().montant); fraisTotalEcole = prixSecoursGlobal; fraisTotal = prixSecoursGlobal; }
    }catch(e){}
    try{
      let d3 = await db.collection("configFrais").doc("global").get();
      if(d3.exists && d3.data().montant && !prixSecoursGlobal){ prixSecoursGlobal = Number(d3.data().montant); fraisTotalEcole = prixSecoursGlobal; fraisTotal = prixSecoursGlobal; }
    }catch(e){}
    if(!prixSecoursGlobal) prixSecoursGlobal = Number(fraisTotalEcole||fraisTotal||0);
  }catch(e){ console.log("Prix par ecole:", e.message); }
  await chargerListeEcolesGroupes(); remplirSelectPrixEcole(); afficherPrixParEcoleDansPaiements(); remplirFiltresEcole(); calculerTotauxParEcole();
}
function afficherPrixParEcoleDansPaiements(){
  let el = document.getElementById('listePrixParEcolePaiements'); if(!el) return;
  let keys = Object.keys(prixParEcole).filter(k=>!k.endsWith("_nom"));
  if(!keys.length){ el.innerHTML = `Prix secours (global) : <b>${(prixSecoursGlobal||fraisTotalEcole||0).toLocaleString('fr-FR')} FCFA</b> - Va dans Parametres > Prix par Ecole pour mettre un prix different par ecole.`; return; }
  let txt = keys.map(k=> `${prixParEcole[k+"_nom"]||k} : <b>${Number(prixParEcole[k]).toLocaleString('fr-FR')} FCFA</b>`).join(" | ");
  el.innerHTML = `Prix par ecole : ${txt} | Secours : <b>${(prixSecoursGlobal||fraisTotalEcole||0).toLocaleString('fr-FR')} FCFA</b>`;
  let dash = document.getElementById('affichagePrixParEcoleDashboard'); if(dash) dash.textContent = txt + ` | Secours ${prixSecoursGlobal||fraisTotalEcole} FCFA`;
}
function remplirFiltresEcole(){
  syncMesListes();
  let ecoles = new Set(TOUTES_ECOLES_GROUPES);
  mesEleves.forEach(e=>{ let n = nomEcoleDeEleve(e); if(n) ecoles.add(n); });
  Object.keys(prixParEcole).forEach(k=>{ if(!k.endsWith("_nom")) ecoles.add(prixParEcole[k+"_nom"]||k); }); if(monEcoleNom && monEcoleNom!=="TOUTES LES ÉCOLES") ecoles.add(monEcoleNom);
  let opts = `<option value="">— Toutes les ecoles —</option>` + [...ecoles].sort().map(n=> `<option value="${n}">${n}</option>`).join('');
  ['filtreEcoleEleves','filtreEcolePaiements','relanceEcole','filtreEcolePresence','filtreEcoleBulletin'].forEach(id=>{ let s = document.getElementById(id); if(s){ let v = s.value; if(id==='filtreEcoleEleves' && filtreEcoleEleveActuel) v = filtreEcoleEleveActuel; s.innerHTML = opts; if(v) s.value = v; if(id==='filtreEcoleEleves') s.onchange = filtrerElevesParEcole; if(id==='filtreEcolePresence') s.onchange = filtrerPresenceParEcoleNiveau; if(id==='filtreEcoleBulletin') s.onchange = chargerBulletins; } });
  let selR = document.getElementById('remiseEleve'); if(selR){ let v = selR.value; selR.innerHTML = `<option value="">— Choisis l'eleve —</option>` + mesEleves.map(e=> `<option value="${nomEleveDe(e)}">${nomEleveDe(e)} - ${e.niveau||''} - ${nomEcoleDeEleve(e)}</option>`).join(''); if(v) selR.value = v; }
  let selH = document.getElementById('historiqueEleveSelect'); if(selH){ let v = selH.value; selH.innerHTML = `<option value="">— Choisis l'eleve pour voir son historique —</option>` + mesEleves.map(e=> `<option value="${nomEleveDe(e)}">${nomEleveDe(e)} - ${e.niveau||''}</option>`).join(''); if(v) selH.value = v; }
  remplirSelectPrixEcole();
  remplirFiltreNiveauEleves();
}
async function chargerRemises(){ try{ let snap = await db.collection("remisesEleves").where("ecoleNom","==",monEcoleNom).get(); mesRemises = []; snap.forEach(d=> mesRemises.push({id:d.id, ...d.data()})); }catch(e){} afficherListeRemises(); remplirFiltresEcole(); }
function afficherListeRemises(){ let el = document.getElementById('listeRemises'); if(!el) return; if(!mesRemises.length){ el.innerHTML = `<p class="centre muted">Aucune remise. Ex : Ahmad devait 10 000, tu mets 5 000, il doit 5 000.</p>`; return; } let h = `<table class="table-blanc"><tr><th>Eleve</th><th>Nouveau prix</th><th>Motif</th><th>Action</th></tr>`; mesRemises.forEach(r=>{ h += `<tr><td><b>${r.enfant}</b></td><td><b>${Number(r.nouveauPrix).toLocaleString('fr-FR')} FCFA</b> <span class="badge badge-remise">REMISE</span></td><td>${r.motif||''}</td><td><button class="lien-action" onclick="supprimerRemise('${r.id}','${r.enfant}')">Supprimer</button></td></tr>`; }); h += `</table>`; el.innerHTML = h; }
async function enregistrerRemise(){
  let nom = document.getElementById('remiseEleve').value; let prix = Number(document.getElementById('remiseMontant').value); let motif = document.getElementById('remiseMotif').value.trim();
  if(!nom) return alert("1. Choisis l'eleve."); if(!prix || prix <= 0) return alert("Mets le nouveau prix. Ex : 5000");
  let elObj = mesEleves.find(e=> nomEleveDe(e)===nom); let ancienPrix = elObj ? prixPourEleveSansRemise(elObj) : (fraisTotalEcole||0);
  if(!confirm(`Remise pour ${nom} ?\n\nAncien prix : ${ancienPrix} FCFA\nNouveau prix : ${prix} FCFA\nMotif : ${motif||'-'}\n\nSon reste va se calculer avec ${prix} FCFA. Tu confirmes ?`)) return;
  let snap = await db.collection("remisesEleves").where("ecoleNom","==",monEcoleNom).get(); for(let doc of snap.docs){ if(normaliser(doc.data().enfant)===normaliser(nom)) await db.collection("remisesEleves").doc(doc.id).delete(); }
  await db.collection("remisesEleves").add({ecoleNom:monEcoleNom, enfant:nom, nouveauPrix:prix, motif, date:new Date().toISOString()});
  document.getElementById('msgRemise').textContent = `Remise enregistree ! ${nom} doit maintenant ${prix} FCFA au lieu de ${ancienPrix} FCFA.`; document.getElementById('remiseMontant').value = ""; document.getElementById('remiseMotif').value = "";
  await chargerRemises(); chargerElevesGestion(); chargerPaiementsGestion(); calculerTotauxParEcole();
}
async function supprimerRemise(id, nom){ if(!confirm("Supprimer la remise de "+nom+" ? Il va revenir a son prix normal.")) return; await db.collection("remisesEleves").doc(id).delete(); await chargerRemises(); chargerElevesGestion(); chargerPaiementsGestion(); calculerTotauxParEcole(); }
function calculerSoldeEleveNOUVEAU(nom){
  syncMesListes();
  let elObj = mesEleves.find(e=> normaliser(nomEleveDe(e))===normaliser(nom));
  let totalDu = elObj ? prixPourEleve(elObj) : Number(prixSecoursGlobal||fraisTotalEcole||0);
  let tp = 0; mesPaiements.forEach(p=>{ if(normaliser(nomEnfantPaiement(p))===normaliser(nom) && statutPaiementValide(p)) tp += Number(p.montant||0); });
  let reste = Math.max(0, totalDu - tp);
  let type = totalDu===0 ? "indefini" : tp===0 ? "nonpaye" : reste===0 ? "paye" : "avance";
  let statut = type==="paye" ? "paye" : type==="avance" ? "avance" : type==="nonpaye" ? "nonpaye" : "nonpaye";
  let badge = type==="paye" ? `<span class="badge badge-paye">PAYE COMPLET</span>` : type==="avance" ? `<span class="badge badge-avance">AVANCE</span>` : type==="nonpaye" ? `<span class="badge badge-nonpaye">NON PAYE</span>` : `<span class="badge">Frais non defini</span>`;
  let remise = getRemisePour(nom); if(remise) badge += ` <span class="badge badge-remise">REMISE ${Number(remise.nouveauPrix).toLocaleString('fr-FR')} FCFA</span>`;
  return {totalDu, totalPaye:tp, reste, statut, type, badge, total:totalDu, prixEcole: totalDu, remise};
}
try{ soldeEleve = calculerSoldeEleveNOUVEAU; }catch(e){}
try{ calculerSoldeEleve = calculerSoldeEleveNOUVEAU; }catch(e){}
function calculerTotauxParEcole(){
  syncMesListes(); let el = document.getElementById('totauxParEcole'); if(!el) return;
  let parEcole = {}; mesEleves.forEach(e=>{ let nomEcole = nomEcoleDeEleve(e) || "Sans ecole"; if(!parEcole[nomEcole]) parEcole[nomEcole] = {nom:nomEcole, eleves:[], attendu:0, encaisse:0}; parEcole[nomEcole].eleves.push(e); });
  if(!Object.keys(parEcole).length){ el.innerHTML = `<p class="centre muted">Aucun eleve pour le moment.</p>`; return; }
  let h = `<table class="table-blanc"><tr><th>Ecole</th><th>Prix</th><th>Eleves</th><th>Attendu</th><th>Encaisse</th><th>Reste</th></tr>`; let totAtt=0, totEnc=0, totReste=0;
  Object.values(parEcole).forEach(g=>{ let attendu = 0, encaisse = 0; g.eleves.forEach(e=>{ let s = calculerSoldeEleveNOUVEAU(nomEleveDe(e)); attendu += s.totalDu; encaisse += s.totalPaye; }); let reste = Math.max(0, attendu - encaisse); totAtt+=attendu; totEnc+=encaisse; totReste+=reste; let prixEx = g.eleves.length ? prixPourEleveSansRemise(g.eleves[0]) : 0; h += `<tr><td><b>${g.nom}</b></td><td>${prixEx.toLocaleString('fr-FR')} FCFA</td><td>${g.eleves.length}</td><td><b>${attendu.toLocaleString('fr-FR')}</b></td><td><b>${encaisse.toLocaleString('fr-FR')}</b></td><td><b>${reste.toLocaleString('fr-FR')} FCFA</b></td></tr>`; });
  h += `<tr><td><b>TOTAL</b></td><td>-</td><td><b>${mesEleves.length}</b></td><td><b>${totAtt.toLocaleString('fr-FR')}</b></td><td><b>${totEnc.toLocaleString('fr-FR')}</b></td><td><b>${totReste.toLocaleString('fr-FR')} FCFA</b></td></tr></table>`; el.innerHTML = h;
}
function partagerTotauxParEcoleWhatsApp(){
  let parEcole = {}; mesEleves.forEach(e=>{ let nomEcole = nomEcoleDeEleve(e) || "Sans ecole"; if(!parEcole[nomEcole]) parEcole[nomEcole] = []; parEcole[nomEcole].push(e); });
  let t = `TOTAL PAR ECOLE - ${monEcoleNom}\n\n`; Object.values(parEcole).forEach(g=>{ let attendu=0, encaisse=0; g.forEach(e=>{ let s=calculerSoldeEleveNOUVEAU(nomEleveDe(e)); attendu+=s.totalDu; encaisse+=s.totalPaye; }); t += `${nomEcoleDeEleve(g[0])} : Attendu ${attendu} - Encaisse ${encaisse} - Reste ${Math.max(0,attendu-encaisse)} FCFA\n`; }); window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank');
}
function afficherHistoriqueUnEleve(){
  let nom = document.getElementById('historiqueEleveSelect').value; let el = document.getElementById('historiqueUnEleve'); if(!el) return; if(!nom){ el.innerHTML = ""; return; }
  let elObj = mesEleves.find(e=> nomEleveDe(e)===nom); let s = calculerSoldeEleveNOUVEAU(nom); let remise = getRemisePour(nom); let prixSansRemise = elObj ? prixPourEleveSansRemise(elObj) : s.totalDu; let hist = mesPaiements.filter(p=> normaliser(nomEnfantPaiement(p))===normaliser(nom));
  let h = `<div style="background:#F1F8E9;border:1px solid #C8E6C9;border-radius:10px;padding:10px"><b>${nom} - ${elObj?elObj.niveau:''} - ${elObj?nomEcoleDeEleve(elObj):''}</b><br>`; h += `Prix ecole : <b>${prixSansRemise.toLocaleString('fr-FR')} FCFA</b> ${remise?`-> Apres remise : <b>${Number(remise.nouveauPrix).toLocaleString('fr-FR')} FCFA</b> (${remise.motif||''})`:''}<br>`; h += `Total a payer : <b>${s.totalDu.toLocaleString('fr-FR')} FCFA</b> - Deja paye : <b>${s.totalPaye.toLocaleString('fr-FR')} FCFA</b> - Reste : <b>${s.reste.toLocaleString('fr-FR')} FCFA</b> - ${s.badge}</div>`;
  if(!hist.length){ h += `<p class="centre">Aucun paiement pour ${nom} pour le moment.</p>`; }
  else{ h += `<table class="table-blanc"><tr><th>Date</th><th>Montant</th><th>Motif</th><th>Action</th></tr>`; hist.forEach(p=>{ h += `<tr><td>${p.datePaiement||(p.date?new Date(p.date).toLocaleDateString('fr-FR'):'')}</td><td><b>${Number(p.montant).toLocaleString('fr-FR')} FCFA</b></td><td>${p.motif||''}</td><td><button class="lien-action" onclick="genererRecuPDF('${nom}',${p.montant},${s.totalPaye},${s.reste})">Recu</button> <button class="lien-action" onclick="envoyerRecuWhatsAppUnEleve('${nom}',${p.montant},${s.totalPaye},${s.reste})">WhatsApp</button></td></tr>`; }); h += `</table>`; }
  h += `<div class="centre" style="margin-top:8px"><button onclick="envoyerRecuWhatsAppUnEleve('${nom}',0,${s.totalPaye},${s.reste})" class="btn-or">Envoyer le resume a son parent sur WhatsApp</button></div>`; el.innerHTML = h;
}
function envoyerRecuWhatsAppUnEleve(nom, dernierMontant, totalPaye, reste){
  let elObj = mesEleves.find(e=> normaliser(nomEleveDe(e))===normaliser(nom)); let s = calculerSoldeEleveNOUVEAU(nom);
  let t = `RECU - INSTITUT NOUROUL IYMANE\n${monEcoleNom}\n\nEleve : ${nom}\nEcole : ${elObj?nomEcoleDeEleve(elObj):''}\nPrix a payer : ${s.totalDu} FCFA\n${dernierMontant?`Dernier paiement : ${dernierMontant} FCFA\n`:''}Total paye : ${totalPaye} FCFA\nReste a payer : ${reste} FCFA\n\n${reste===0?'PAYE COMPLET - Merci !':'AVANCE - Il reste '+reste+' FCFA'}\n\n— La Secretaire`;
  if(elObj && elObj.tel) window.open(`https://wa.me/237${String(elObj.tel).replace(/[^0-9]/g,"")}?text=${encodeURIComponent(t)}`,'_blank'); else window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank');
}
function relancerImpayesParEcole(){
  let ecoleChoisie = document.getElementById('relanceEcole').value;
  let imp = mesEleves.filter(e=>{ if(ecoleChoisie && nomEcoleDeEleve(e)!==ecoleChoisie && monEcoleNom!==ecoleChoisie) return false; let s = calculerSoldeEleveNOUVEAU(nomEleveDe(e)); return s.reste > 0 && statutInscriptionEleve(e).type==='accepte'; });
  let ap = document.getElementById('apercuRelance');
  if(!imp.length){ if(ap) ap.innerHTML = `<p class="centre" style="color:green;font-weight:700">Personne ne doit dans ${ecoleChoisie||'toutes les ecoles'} !</p>`; return alert("Personne ne doit !"); }
  let t = `RAPPEL PAIEMENT - ${monEcoleNom}${ecoleChoisie?` - ${ecoleChoisie}`:''}\n\n`; imp.forEach(e=>{ let s=calculerSoldeEleveNOUVEAU(nomEleveDe(e)); t += `${nomEleveDe(e)} : Prix ${s.totalDu} - Paye ${s.totalPaye} - Reste ${s.reste} FCFA\n`; }); t += `\nMerci de passer regler. — La Secretaire`;
  if(ap) ap.innerHTML = `<div style="background:#FFF9C4;border:1px solid #FFE082;border-radius:10px;padding:10px;white-space:pre-wrap">${t}</div>`; window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank');
}
async function chargerToutLeNouveau(){ await chargerPrixParEcole(); await chargerRemises(); remplirFiltresEcole(); calculerTotauxParEcole(); afficherPrixParEcoleDansPaiements(); }
async function enregistrerPrixParEcole(){
  let sel = document.getElementById('selectNomEcolePrix');
  let nom = (sel && sel.value ? sel.value : "").trim() || (document.getElementById('inputNomEcolePrix') ? document.getElementById('inputNomEcolePrix').value.trim() : "");
  let prix = Number(document.getElementById('inputPrixEcole').value);
  if(!nom) return alert("Choisis l'école / le groupe dans la liste. Ex : Yaounde");
  if(!prix || prix<=0) return alert("Mets le prix. Ex : 15000");
  let cle = cleEcolePrix(nom); prixParEcole[cle] = prix;
  prixParEcole[cle+"_nom"] = nom;
  await db.collection("configPrixEcoles").doc(monEcoleId||"global").set({ecoleNom:monEcoleNom, prix:prixParEcole, date:new Date().toISOString()});
  await db.collection("configPrixEcoles").doc("global").set({ecoleNom:monEcoleNom, prix:prixParEcole, date:new Date().toISOString()});
  let msgEl = document.getElementById('msgPrixEcole'); if(msgEl) msgEl.textContent = `${nom} = ${prix} FCFA enregistre !`;
  if(document.getElementById('inputNomEcolePrix')) document.getElementById('inputNomEcolePrix').value = "";
  document.getElementById('inputPrixEcole').value = "";
  afficherListePrixParEcole(); afficherPrixParEcoleDansPaiements(); remplirFiltresEcole(); chargerElevesGestion(); chargerPaiementsGestion(); calculerTotauxParEcole();
}
function afficherListePrixParEcole(){
  let el = document.getElementById('listePrixParEcole'); if(!el) return; let keys = Object.keys(prixParEcole).filter(k=>!k.endsWith("_nom"));
  if(!keys.length){ el.innerHTML = `<p class="centre muted">Aucun prix par ecole. Tout le monde utilise le Prix Secours : ${(prixSecoursGlobal||fraisTotalEcole||0)} FCFA</p>`; return; }
  let h = `<table class="table-blanc"><tr><th>Ecole / Groupe</th><th>Prix</th><th>Action</th></tr>`; keys.forEach(k=>{ let nomAff = prixParEcole[k+"_nom"] || k; h += `<tr><td><b>${nomAff}</b></td><td><b>${Number(prixParEcole[k]).toLocaleString('fr-FR')} FCFA</b></td><td><button class="lien-action" onclick="supprimerPrixParEcole('${k}')">Supprimer</button></td></tr>`; }); h += `</table>`; el.innerHTML = h;
  let inpSec = document.getElementById('inputPrixSecours'); if(inpSec && (prixSecoursGlobal||fraisTotalEcole)) inpSec.value = prixSecoursGlobal||fraisTotalEcole;
}
async function supprimerPrixParEcole(cle){ if(!confirm("Supprimer le prix pour "+cle+" ? Elle va utiliser le Prix Secours.")) return; delete prixParEcole[cle]; delete prixParEcole[cle+"_nom"]; await db.collection("configPrixEcoles").doc(monEcoleId||"global").set({ecoleNom:monEcoleNom, prix:prixParEcole, date:new Date().toISOString()}); await db.collection("configPrixEcoles").doc("global").set({ecoleNom:monEcoleNom, prix:prixParEcole, date:new Date().toISOString()}); afficherListePrixParEcole(); afficherPrixParEcoleDansPaiements(); chargerElevesGestion(); chargerPaiementsGestion(); calculerTotauxParEcole(); }
async function enregistrerPrixSecours(){
  let prix = Number(document.getElementById('inputPrixSecours').value); if(!prix || prix<=0) return alert("Mets le prix secours. Ex : 10000"); if(!confirm(`Prix secours = ${prix} FCFA ?\n\nLes ecoles SANS prix propre vont utiliser ce prix.`)) return;
  await db.collection("configFrais").doc(monEcoleId||"global").set({ecoleNom:monEcoleNom, montant:prix, date:new Date().toISOString()}); await db.collection("configFrais").doc("global").set({ecoleNom:monEcoleNom, montant:prix, date:new Date().toISOString()}); fraisTotalEcole = prix; prixSecoursGlobal = prix; fraisTotal = prix; alert("Prix secours enregistre : "+prix+" FCFA"); afficherListePrixParEcole(); afficherPrixParEcoleDansPaiements(); chargerElevesGestion(); chargerPaiementsGestion(); calculerTotauxParEcole();
}
function onElevePaiementChange_NOUVEAU(){
  let nom = document.getElementById('paiementEleve').value; let cl = document.getElementById('paiementClasse'); let info = document.getElementById('infoSoldeEleve'); let ap = document.getElementById('apercuApresPaiement'); let mo = document.getElementById('paiementMontant'); let infoPrix = document.getElementById('infoPrixEcoleEleve'); let infoRemise = document.getElementById('infoRemiseElevePaiement');
  if(!nom){ cl.value=""; info.style.display='none'; ap.style.display='none'; if(mo) mo.value=""; if(infoPrix) infoPrix.style.display='none'; if(infoRemise) infoRemise.style.display='none'; return; }
  let el = mesEleves.find(e=> nomEleveDe(e)===nom); cl.value = el ? el.niveau : ""; let s = calculerSoldeEleveNOUVEAU(nom); let prixSansRemise = el ? prixPourEleveSansRemise(el) : s.totalDu; let remise = getRemisePour(nom);
  if(infoPrix){ infoPrix.style.display='block'; infoPrix.innerHTML = `Ecole : <b>${el?nomEcoleDeEleve(el):''}</b><br>Prix de cette ecole : <b>${prixSansRemise.toLocaleString('fr-FR')} FCFA</b><br><small>Prix secours global : ${(prixSecoursGlobal||fraisTotalEcole||0).toLocaleString('fr-FR')} FCFA</small>`; }
  if(infoRemise){ if(remise){ infoRemise.style.display='block'; infoRemise.innerHTML = `REMISE pour ${nom} : Il devait <b>${prixSansRemise.toLocaleString('fr-FR')} FCFA</b>, il paie <b>${Number(remise.nouveauPrix).toLocaleString('fr-FR')} FCFA</b> - Motif : ${remise.motif||''}`; } else { infoRemise.style.display='none'; } }
  info.style.display='block'; let ins = el ? statutInscriptionEleve(el) : {label:""}; if(s.totalPaye===0) info.innerHTML = `<b>${nom} - ${cl.value}</b><br>${ins.label} - <b>NON PAYE</b><br>Total a payer <b>${s.totalDu} FCFA</b> - Deja paye <b>0</b> - Reste <b>${s.reste} FCFA</b>`; else if(s.reste===0) info.innerHTML = `<b>${nom} - ${cl.value}</b><br>${ins.label} - <b>PAYE COMPLET - ${s.totalPaye} FCFA</b>`; else info.innerHTML = `<b>${nom} - ${cl.value}</b><br>${ins.label} - <b>AVANCE</b><br>Total <b>${s.totalDu}</b> - Deja paye <b>${s.totalPaye}</b> - Reste <b>${s.reste}</b>`; ap.style.display='none'; if(mo) mo.value=""; document.getElementById('msgPaiement').textContent="";
}
try{ onElevePaiementChange = onElevePaiementChange_NOUVEAU; }catch(e){}
setTimeout(()=>{ if(typeof monEcoleId !== 'undefined' && monEcoleId && monEcoleId!=="" && typeof db !== 'undefined' && localStorage.getItem("gestion_session")){ chargerToutLeNouveau(); } }, 1500);
async function nettoyerBulletinsCasses(){
  if(!confirm("Nettoyer les bulletins cassés ?\n\nÇa va supprimer seulement les docs où le nom est cassé :\n- man du Camp\n- du Camp\n- tout nom qui est un bout d'école, pas un vrai élève.\n\nTes vraies notes (Aminata Ami...) ne seront PAS touchées.\nTu confirmes ?")) return;
  let msg = document.getElementById('msgBulletin');
  if(msg) msg.textContent = "⏳ Nettoyage en cours...";
  let supprimes = 0; let details = [];
  let cols = ["bulletins","notes","notes_eleves","bulletins_enseignants","notes_trimestre","resultats","notesEleves","compositions","enseignants_notes"];
  let vraisNoms = TOUS_ELEVES_GESTION.map(e=> normaliser(e.enfant||e.nomEnfant||""));
  for(let col of cols){
    try{
      let snap = await db.collection(col).limit(500).get();
      for(let doc of snap.docs){
        let d = doc.data();
        let eleve = String(d.eleve||d.enfant||d.enfantNom||d.nomEleve||d.nom||"").trim();
        let n = normaliser(eleve);
        let estCasse = (n==="man du camp" || n==="du camp" || n.includes("du camp") || n.includes("man du camp") || n==="camp" || n==="yeyap");
        let estVrai = vraisNoms.includes(n);
        if(eleve && estCasse && !estVrai){
          await db.collection(col).doc(doc.id).delete();
          supprimes++;
          details.push(col+" / "+eleve);
        }
      }
    }catch(e){ console.log("Nettoyage "+col+":", e.message); }
  }
  alert("✅ Nettoyage fini.\n\nSupprimés : "+supprimes+" doc(s) cassé(s).\n"+(details.length ? details.slice(0,10).join("\n") : "Aucun man du Camp trouvé, c'était déjà propre."));
  if(msg) msg.textContent = "✅ Nettoyage fini : "+supprimes+" doc(s) cassé(s) supprimé(s).";
  await chargerBulletins();
  await chargerNotesExistantes();
}
// ===== ALIGNEMENT GESTION = LIAISON - Calculs Officiels =====
let GESTION_DEPENSES = [];
function statutPaiementValide_OFFICIEL(p){
  let st = String(p.statut||p.status||"").toLowerCase().trim();
  return st === "valide" || st === "validé" || st === "validee";
}
try{ statutPaiementValide = statutPaiementValide_OFFICIEL; }catch(e){}
async function chargerDepensesPourGestion(){
  try{
    let snap = await db.collection("depenses").limit(500).get();
    GESTION_DEPENSES = [];
    snap.forEach(d=> GESTION_DEPENSES.push({id:d.id, ...d.data()}));
  }catch(e){ GESTION_DEPENSES = []; }
}
function calculerSoldeOfficielGestion(){
  let encaisse = 0;
  TOUS_PAIEMENTS_GESTION.forEach(p=>{
    if(statutPaiementValide_OFFICIEL(p)) encaisse += Number(p.montant||0);
  });
  let depenses = 0;
  GESTION_DEPENSES.forEach(d=> depenses += Number(d.montant||0));
  return { encaisse, depenses, solde: encaisse - depenses };
}
async function majDashboardOfficiel(){
  await chargerDepensesPourGestion();
  let s = calculerSoldeOfficielGestion();
  let el = document.getElementById('statMontant');
  if(el) el.textContent = s.encaisse.toLocaleString('fr-FR') + " FCFA";
  let kpiBox = document.querySelector('.kpi');
  if(kpiBox && !document.getElementById('ligneSoldeOfficiel')){
    let div = document.createElement('div');
    div.id = 'ligneSoldeOfficiel';
    div.style.cssText = 'grid-column:1/-1;background:#0F3D2E;color:white;border-radius:12px;padding:10px;text-align:center';
    div.innerHTML = `🧾 Dépenses : <b>${s.depenses.toLocaleString('fr-FR')} FCFA</b> &nbsp; | &nbsp; ✅ SOLDE OFFICIEL (comme Liaison) : <b>${s.solde.toLocaleString('fr-FR')} FCFA</b><br><small>Solde = Encaissé Validé - Dépenses | Annulé + Refusé = ne comptent jamais</small>`;
    kpiBox.parentNode.insertBefore(div, kpiBox.nextSibling);
  } else if(document.getElementById('ligneSoldeOfficiel')){
    document.getElementById('ligneSoldeOfficiel').innerHTML = `🧾 Dépenses : <b>${s.depenses.toLocaleString('fr-FR')} FCFA</b> &nbsp; | &nbsp; ✅ SOLDE OFFICIEL (comme Liaison) : <b>${s.solde.toLocaleString('fr-FR')} FCFA</b><br><small>Solde = Encaissé Validé - Dépenses | Annulé + Refusé = ne comptent jamais</small>`;
  }
}
let _oldChargerPaiements = chargerPaiementsGestion;
chargerPaiementsGestion = async function(){
  await _oldChargerPaiements();
  await majDashboardOfficiel();
};
// ===== FIX FINAL CHOIX A - NE PAS RÉ-ÉCRASER enregistrerPaiementFormulaire =====
// La version de la Partie 1 est déjà la bonne : statut en_attente, Directeur valide dans Admin.html.
// On garde juste : Directeur / Secrétaire voient tout, sans filtre école.
let _oldEstAMoi2 = estAMoiGestion;
estAMoiGestion = function(d){
  if(monRoleGestion === "directeur" || monRoleGestion === "secretaire" || modeToutesEcoles) return true;
  return _oldEstAMoi2(d);
};
let _oldChargerEleves2 = chargerElevesGestion;
chargerElevesGestion = async function(){
  if(monRoleGestion==="directeur" || monRoleGestion==="secretaire") filtreEcoleEleveActuel = "";
  await _oldChargerEleves2();
};

