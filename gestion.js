// GESTION.JS - CORRIGE PROPRE - PARTIE 1 - VERSION FINALE
const authG = firebase.auth();
let monEcoleId = "";
let monEcoleNom = "";
let mesEleves = [];
let mesPaiements = [];
let dernierBulletinData = null;
let fraisTotalEcole = 0;
let mesEnseignants = [];
let mesPaiementsEnseignants = [];
let dernierBilanAnnuel = null;
let ongletActuel = 'tabDashboard';
let filtreEleveActuel = 'tous';
let filtrePaiementActuel = 'tous';
const NOM_ECOLE_AR = "معهد نور الإيمان";
function nomEcoleBilingue(){ return monEcoleNom ? monEcoleNom + " - " + NOM_ECOLE_AR : NOM_ECOLE_AR; }
let typeComposition = "oral_ecrit";
function libelleTypeComposition(){ if(typeComposition==="oral") return "Oral seulement"; if(typeComposition==="ecrit") return "Écrit seulement"; return "Oral + Écrit"; }
function calculerMoyenneMatiere(oral, ecrit){
  let o = (oral===""||oral===null||oral===undefined||oral==="-") ? null : Number(oral);
  let e = (ecrit===""||ecrit===null||ecrit===undefined||ecrit==="-") ? null : Number(ecrit);
  if(typeComposition==="oral") return o===null ? null : o;
  if(typeComposition==="ecrit") return e===null ? null : e;
  if(o===null && e===null) return null;
  if(o===null) return e;
  if(e===null) return o;
  return (o+e)/2;
}
const MATIERES_AR = {
  "Coran": "القرآن الكريم","Fiqh": "الفقه","Aquida": "العقيدة","Tawhid": "التوحيد",
  "Sirah": "السيرة النبوية","Sira": "السيرة النبوية","Tajwid": "التجويد",
  "Mémorisation": "الحفظ","Lecture": "القراءة","Tafsir": "التفسير",
  "Adhab": "الآداب","Adab": "الآداب","Azkar": "الأذكار","Hadith": "الحديث",
  "Arabe": "اللغة العربية","Langue Arabe": "اللغة العربية",
  "Français": "اللغة الفرنسية","Maths": "الرياضيات"
};
function nomMatiereBilingue(nomFr){ let ar = MATIERES_AR[nomFr] || ""; return ar ? nomFr + " - " + ar : nomFr; }
function nomMatiereBilingueHTML(nomFr){ let ar = MATIERES_AR[nomFr] || ""; return ar ? `<b>${nomFr}</b> <span dir="rtl" style="font-size:15px;">${ar}</span>` : `<b>${nomFr}</b>`; }
let MATIERES_ISLAMIQUES = [
  {id:"coran", fr:"Coran", ar:"القرآن الكريم", desc:"Mémorisation + Récitation"},
  {id:"hadith", fr:"Hadith", ar:"الحديث", desc:"Paroles du Prophète"},
  {id:"aqida", fr:"Aquida", ar:"العقيدة", desc:"Croyance"},
  {id:"fiqh", fr:"Fiqh", ar:"الفقه", desc:"Prière, ablutions"},
  {id:"adhab", fr:"Adhab", ar:"الآداب", desc:"Comportement"},
  {id:"arabe", fr:"Langue Arabe", ar:"اللغة العربية", desc:"Lire, écrire arabe"},
  {id:"sira", fr:"Sirah", ar:"السيرة النبوية", desc:"Vie du Prophète"},
  {id:"tawhid", fr:"Tawhid", ar:"التوحيد", desc:"Unicité d'Allah"},
  {id:"memo", fr:"Mémorisation", ar:"الحفظ", desc:"Sourates apprises"},
  {id:"tajwid", fr:"Tajwid", ar:"التجويد", desc:"Règles de récitation"},
  {id:"tafsir", fr:"Tafsir", ar:"التفسير", desc:"Explication du Coran"},
  {id:"lecture", fr:"Lecture", ar:"القراءة", desc:"Lecture arabe"},
  {id:"azkar", fr:"Azkar", ar:"الأذكار", desc:"Invocations"}
];
let matieresActivesIds = ["coran","hadith","aqida","fiqh","adhab","arabe","sira","tawhid","memo"];
function getMatieresActives(){ return MATIERES_ISLAMIQUES.filter(m => matieresActivesIds.includes(m.id)); }
function cleMatieresPerso(){ return "matieres_perso_"+(monEcoleId||"global"); }
function chargerMatieresPerso(){ try{ let saved = JSON.parse(localStorage.getItem(cleMatieresPerso())||"[]"); saved.forEach(m=>{ if(!MATIERES_ISLAMIQUES.find(x=>x.id===m.id)) { if(!m.ar && MATIERES_AR[m.fr]) m.ar = MATIERES_AR[m.fr]; MATIERES_ISLAMIQUES.push(m); } }); }catch(e){} }
function sauverMatieresPerso(){ try{ localStorage.setItem(cleMatieresPerso(), JSON.stringify(MATIERES_ISLAMIQUES.filter(m=>m.perso))); }catch(e){} }
chargerMatieresPerso();
function ajouterMatierePersonnalisee(){
  let input = document.getElementById('nouvelleMatiereNom');
  let nom = (input?.value||"").trim();
  if(!nom){ alert("Écris le nom de la matière. Ex : Informatique"); return; }
  let id = "perso_"+nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_");
  if(MATIERES_ISLAMIQUES.find(m=>m.id===id)){ alert("Cette matière existe déjà"); return; }
  let ar = MATIERES_AR[nom] || "";
  MATIERES_ISLAMIQUES.push({id:id, fr:nom, ar:ar, desc:"Matière ajoutée par l'école", perso:true});
  if(!matieresActivesIds.includes(id)) matieresActivesIds.push(id);
  sauverMatieresPerso(); input.value = ""; afficherChoixMatieres();
  alert("✅ "+nomMatiereBilingue(nom)+" ajoutée ! Clique sur Enregistrer pour FIXER.");
}
function supprimerMatierePersonnalisee(id){ if(!confirm("Supprimer cette matière ?")) return; MATIERES_ISLAMIQUES = MATIERES_ISLAMIQUES.filter(m=>m.id!==id); matieresActivesIds = matieresActivesIds.filter(x=>x!==id); sauverMatieresPerso(); afficherChoixMatieres(); }
function basculerListe(idZone, btn){
  let zone = document.getElementById(idZone); if(!zone) return;
  let cache = (zone.style.display==='none');
  zone.style.display = cache ? 'block' : 'none';
  if(btn) btn.textContent = cache ? "🙈 Cacher la liste" : "👁 Afficher la liste";
}
function ajouterBoutonAfficherCacher(idZone, idBoutonContainer){
  let cont = document.getElementById(idBoutonContainer); if(!cont) return;
  if(document.getElementById('btnToggle_'+idZone)) return;
  let b = document.createElement('button');
  b.id = 'btnToggle_'+idZone; b.textContent = "🙈 Cacher la liste";
  b.style.cssText = "background:#fff;border:1px solid #66BB6A;padding:8px 14px;border-radius:10px;font-weight:700;margin:8px 0;cursor:pointer";
  b.onclick = function(){ basculerListe(idZone, b); };
  cont.appendChild(b);
}
function installerBoutonsListes(){
  ajouterBoutonAfficherCacher('listeElevesGestion','conteneurBtnEleves');
  ajouterBoutonAfficherCacher('listePaiementsGestion','conteneurBtnPaiements');
  ajouterBoutonAfficherCacher('historiquePaiements','conteneurBtnHistoriquePaiements');
  ajouterBoutonAfficherCacher('listeEnseignants','conteneurBtnEnseignants');
  ajouterBoutonAfficherCacher('listeBulletins','conteneurBtnBulletins');
  ajouterBoutonAfficherCacher('listePresence','conteneurBtnPresence');
  ajouterBoutonAfficherCacher('historiquePresence','conteneurBtnHistoriquePresence');
  ajouterBoutonAfficherCacher('listeBulletinsAnnuels','conteneurBtnAnnuels');
}
function normaliser(t){ return (t||"").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
function nettoyerTel(t){ return (t||"").toString().replace(/[^0-9]/g,""); }
function enleverAccents(t){ return (t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
function mentionPour(m){ if(m>=16) return "Excellent"; if(m>=14) return "Très Bien"; if(m>=12) return "Bien"; if(m>=10) return "Passable"; return "Efforts à fournir"; }
function decisionAnnuelle(m){ return m>=10 ? "ADMIS" : "REDOUBLE"; }
function nouveauPDF(){ return new window.jspdf.jsPDF({format:'a4', unit:'mm'}); }
function showTabGestion(id, btn){
  ongletActuel = id;
  ['tabDashboard','tabEleves','tabPaiements','tabEnseignants','tabBulletins','tabPresence','tabAnnuel','tabParametres'].forEach(t=>{ let el = document.getElementById(t); if(el) el.style.display = (t===id ? 'block' : 'none'); });
  document.querySelectorAll('.gestion-tab').forEach(b=>b.classList.remove('actif'));
  if(btn) btn.classList.add('actif');
  if(id==='tabDashboard') chargerDashboard();
  if(id==='tabEleves') chargerElevesGestion();
  if(id==='tabPaiements') chargerPaiementsGestion();
  if(id==='tabEnseignants') chargerEnseignants();
  if(id==='tabBulletins'){ chargerElevesGestion(); afficherFormNotes(); chargerBulletins(); }
  if(id==='tabPresence') chargerPresence();
  if(id==='tabAnnuel') calculerBilanAnnuel();
  if(id==='tabParametres') afficherChoixMatieres();
  setTimeout(installerBoutonsListes, 300);
}
function toggleMenuFlottant(){ let m = document.getElementById('menuFlottant'); m.style.display = (m.style.display==='block' ? 'none' : 'block'); }
function imprimerFeuilleActuelle(){ toggleMenuFlottant(); window.print(); }
function telechargerPDFActuel(){ toggleMenuFlottant(); if(ongletActuel==='tabEleves') telechargerListeElevesPDF(); else if(ongletActuel==='tabPaiements') telechargerPaiementsPDF(); else if(ongletActuel==='tabEnseignants') telechargerEnseignantsPDF(); else if(ongletActuel==='tabPresence') telechargerPresencePDF(); else if(ongletActuel==='tabAnnuel') telechargerBilanAnnuelPDF(); else alert("Va dans Élèves / Paiements / Enseignants / Bilan pour télécharger."); }
function partagerWhatsAppActuel(){ toggleMenuFlottant(); if(ongletActuel==='tabEleves') telechargerEleves(); else if(ongletActuel==='tabPaiements') partagerPaiementsWhatsApp(); else if(ongletActuel==='tabEnseignants') partagerEnseignantsWhatsApp(); else if(ongletActuel==='tabPresence') partagerPresenceWhatsApp(); else if(ongletActuel==='tabAnnuel') partagerBilanAnnuelWhatsApp(); }
// CORRIGE - majTitresFeuilles - met à jour les 3 affichages de composition + plus de doublon d'id
function majTitresFeuilles(){
  let d = new Date().toLocaleDateString('fr-FR');
  ['titreEcoleEleves','titreEcolePaiements','titreEcoleEnseignants','titreEcolePresence','titreEcoleAnnuel'].forEach(id=>{ let el = document.getElementById(id); if(el) el.textContent = monEcoleNom; });
  let top = document.getElementById('topEcole'); if(top) top.textContent = monEcoleNom;
  let dj = document.getElementById('dateJour'); if(dj) dj.textContent = d;
  let elF = document.getElementById('titreFraisEleves'); if(elF) elF.textContent = fraisTotalEcole;
  let d1 = document.getElementById('titreDateEleves'); if(d1) d1.textContent = d;
  let d2 = document.getElementById('titreDatePresence'); if(d2) d2.textContent = document.getElementById('datePresence')?.value || d;
  let matTxt = getMatieresActives().map(m=>nomMatiereBilingue(m.fr)).join(", ");
  ['affichageMatieresActives','affichageMatieresBulletin','affichageMatieresAnnuel','affichageMatieresParametres'].forEach(id=>{ let el = document.getElementById(id); if(el) el.textContent = matTxt + " (" + getMatieresActives().length + " matières) - Composition : " + libelleTypeComposition(); });
  let affType = document.getElementById('affichageTypeComposition'); if(affType) affType.textContent = libelleTypeComposition();
  let affType2 = document.getElementById('affichageTypeCompositionParam'); if(affType2) affType2.textContent = libelleTypeComposition();
  let affType3 = document.getElementById('affichageTypeCompositionBulletin'); if(affType3) affType3.textContent = libelleTypeComposition();
  let titreAr = document.getElementById('titreEcoleArabe'); if(titreAr) titreAr.textContent = NOM_ECOLE_AR;
}
function calculerSoldeEleve(nom){ let tp = 0; mesPaiements.forEach(p=>{ if(normaliser(p.enfantNom)===normaliser(nom)) tp += Number(p.montant||0); }); let reste = Math.max(0, fraisTotalEcole - tp); let type = fraisTotalEcole===0 ? "indefini" : tp===0 ? "nonpaye" : reste===0 ? "paye" : "avance"; let statut = type==="paye" ? "✓ PAYÉ COMPLET" : type==="avance" ? "◐ AVANCE" : type==="nonpaye" ? "✗ NON PAYÉ" : "Frais non défini"; let badge = type==="paye" ? `<span class="badge badge-paye">✓ PAYÉ COMPLET</span>` : type==="avance" ? `<span class="badge badge-avance">◐ AVANCE</span>` : type==="nonpaye" ? `<span class="badge badge-nonpaye">✗ NON PAYÉ</span>` : `<span class="badge">Frais non défini</span>`; return {totalPaye:tp, reste, statut, type, badge}; }
function statutInscriptionEleve(e){ let s = (e.statut||"").toString(); if(s.toLowerCase().includes("accepte")) return {type:"accepte", label:"ACCEPTÉ DG", badge:`<span class="badge badge-accepte">ACCEPTÉ DG</span>`}; if(s.toLowerCase().includes("refuse")) return {type:"refuse", label:"REFUSÉ DG", badge:`<span class="badge">REFUSÉ DG</span>`}; return {type:"attente", label:"EN ATTENTE DG", badge:`<span class="badge badge-attente">EN ATTENTE DG</span>`}; }
function calculerSoldeEnseignant(nom){ let ens = mesEnseignants.find(e=>normaliser(e.nom)===normaliser(nom)); if(!ens) return {totalPaye:0, reste:0, statut:"", salaire:0}; let sal = Number(ens.salaire||0), tp = 0; mesPaiementsEnseignants.forEach(p=>{ if(normaliser(p.enseignantNom)===normaliser(nom)) tp += Number(p.montant||0); }); let reste = Math.max(0, sal - tp); return {totalPaye:tp, reste, statut: tp===0 ? "RIEN PAYÉ" : reste===0 ? "PAYÉ COMPLET" : "AVANCE - RESTE "+reste+" FCFA", salaire:sal}; }
function afficherChoixMatieres(){
  let c = document.getElementById('listeChoixMatieres'); if(!c) return;
  let h = `<div style="background:#E3F2FD;border:1px solid #90CAF9;padding:12px;border-radius:10px;margin-bottom:12px"><b>📝 COMMENT ON COMPOSE ?</b><br><small>Choisis comment les élèves composent ce trimestre.</small><br>
  <label style="display:block;margin-top:8px"><input type="radio" name="typeComposition" value="oral" ${typeComposition==="oral"?"checked":""}> <b>Oral seulement</b> - On met que la note Oral, Moyenne = Oral</label>
  <label style="display:block"><input type="radio" name="typeComposition" value="ecrit" ${typeComposition==="ecrit"?"checked":""}> <b>Écrit seulement</b> - On met que la note Écrit, Moyenne = Écrit</label>
  <label style="display:block"><input type="radio" name="typeComposition" value="oral_ecrit" ${typeComposition==="oral_ecrit"?"checked":""}> <b>Oral + Écrit</b> - On met les 2, Moyenne = (Oral + Écrit) / 2</label>
  <div style="margin-top:8px"><b>Actuel : ${libelleTypeComposition()}</b></div></div>`;
  MATIERES_ISLAMIQUES.forEach(m=>{
    let checked = matieresActivesIds.includes(m.id) ? "checked" : "";
    let btnSup = m.perso ? ` <button onclick="supprimerMatierePersonnalisee('${m.id}')" style="background:#FFCDD2;border:1px solid #EF9A9A;padding:3px 8px;border-radius:10px;cursor:pointer;font-size:11px">🗑 Supprimer</button>` : "";
    let ar = m.ar || MATIERES_AR[m.fr] || "";
    let affAr = ar ? ` <span dir="rtl" style="font-size:15px;color:#1B5E20;">${ar}</span>` : "";
    h += `<label class="matiere-check"><input type="checkbox" value="${m.id}" class="check-matiere" ${checked}> <div><b>${m.fr}</b>${affAr}<br><small>${m.desc}</small>${btnSup}</div></label>`;
  });
  h += `<div style="background:#FFF9C4;border:1px solid #FFE082;padding:10px;border-radius:10px;margin-top:10px"><b>➕ Ajouter une autre matière</b><br><small>Ex : Informatique, Anglais, Sport...</small><input id="nouvelleMatiereNom" placeholder="Ex : Informatique" style="margin-top:6px"><button onclick="ajouterMatierePersonnalisee()" class="btn-noir" style="margin-top:6px">+ Ajouter cette matière</button></div>`;
  c.innerHTML = h; majTitresFeuilles();
}
function toutCocherMatieres(){ document.querySelectorAll('.check-matiere').forEach(cb=>cb.checked=true); }
function toutDecocherMatieres(){ document.querySelectorAll('.check-matiere').forEach(cb=>cb.checked=false); }
async function publierMatieresPourSousDirecteur(){
  try{
    if(!monEcoleId && !monEcoleNom) return;
    let matieresDetail = getMatieresActives().map(m=>({id:m.id, fr:m.fr, ar:(m.ar||MATIERES_AR[m.fr]||""), nom:m.fr, nomBilingue:nomMatiereBilingue(m.fr), desc:m.desc||"", perso:!!m.perso}));
    let payload = {ecoleId:monEcoleId||"", ecoleNom:monEcoleNom||"", ecoleNomAr:NOM_ECOLE_AR, matieres:matieresActivesIds, matieresDetail:matieresDetail, matieresNoms:matieresDetail.map(m=>m.fr), typeComposition:typeComposition, date:new Date().toISOString()};
    if(monEcoleId) await db.collection("matieres_publiees").doc(monEcoleId).set(payload);
    if(monEcoleNom){
      let cleNom = "par_nom_"+normaliser(monEcoleNom).replace(/[^a-z0-9]+/g,"_");
      await db.collection("matieres_publiees").doc(cleNom).set(payload);
    }
  }catch(e){ console.log("Pont matières vers Sous-Directeur:", e.message); }
}
async function sauvegarderMatieresActives(){
  let choisis = [...document.querySelectorAll('.check-matiere:checked')].map(cb=>cb.value);
  if(!choisis.length) return alert("Coche au moins 1 matière !");
  let selType = document.querySelector('input[name="typeComposition"]:checked');
  if(selType) typeComposition = selType.value;
  let noms = choisis.map(id=>{ let m=MATIERES_ISLAMIQUES.find(x=>x.id===id); return nomMatiereBilingue(m.fr); }).join(", ");
  if(!confirm("Tu fixes :\n- "+choisis.length+" matière(s) : "+noms+"\n- Composition : "+libelleTypeComposition()+"\n\nLe bulletin va utiliser SEULEMENT ça. Tu confirmes ?")) return;
  matieresActivesIds = choisis;
  try{ if(monEcoleId) await db.collection("configMatieres").doc(monEcoleId).set({ecoleNom:monEcoleNom, matieres:choisis, typeComposition:typeComposition, date:new Date().toISOString()}); }catch(e){}
  await publierMatieresPourSousDirecteur();
  try{ localStorage.setItem("matieresActives_"+monEcoleId, JSON.stringify(choisis)); localStorage.setItem("typeComposition_"+monEcoleId, typeComposition); }catch(e){}
  sauverMatieresPerso();
  let msg = document.getElementById('msgMatieres'); if(msg) msg.textContent = "✅ Enregistré ! Matières : " + getMatieresActives().map(m=>nomMatiereBilingue(m.fr)).join(", ") + " | Composition : " + libelleTypeComposition();
  majTitresFeuilles(); afficherFormNotes();
  alert("C'est enregistré !\n\nMatières ("+choisis.length+") : "+noms+"\nComposition : "+libelleTypeComposition()+"\n\nDans Bulletins, tu vas voir SEULEMENT ce type de note.");
}
async function chargerConfigMatieres(){
  chargerMatieresPerso();
  try{ let locT = localStorage.getItem("typeComposition_"+monEcoleId); if(locT) typeComposition = locT; }catch(e){}
  try{ if(monEcoleId){ let doc = await db.collection("configMatieres").doc(monEcoleId).get(); if(doc.exists && doc.data().matieres && doc.data().matieres.length){ matieresActivesIds = doc.data().matieres; if(doc.data().typeComposition) typeComposition = doc.data().typeComposition; majTitresFeuilles(); return; } } }catch(e){}
  try{ let loc = localStorage.getItem("matieresActives_"+monEcoleId); if(loc){ let arr = JSON.parse(loc); if(arr.length) matieresActivesIds = arr; } }catch(e){}
  majTitresFeuilles();
}
async function chargerDashboard(){
  await chargerElevesGestion(false); await chargerEnseignants(false); majTableauDeBord();
  let alertes = []; let imp = mesEleves.filter(e=>statutInscriptionEleve(e).type==='accepte' && calculerSoldeEleve(e.enfant).type!=='paye');
  if(imp.length) alertes.push(`<p>💰 <b>${imp.length} élève(s)</b> n'ont pas fini. Reste : <b>${imp.reduce((s,e)=>s+calculerSoldeEleve(e.enfant).reste,0)} FCFA</b> - <a href="#" onclick="showTabGestion('tabPaiements',document.querySelectorAll('.gestion-tab')[2]);return false">Voir paiements</a></p>`);
  let att = mesEleves.filter(e=>statutInscriptionEleve(e).type==='attente'); if(att.length) alertes.push(`<p>⏳ <b>${att.length} élève(s)</b> en attente du Directeur Général.</p>`);
  if(!alertes.length) alertes.push(`<p class="centre">✅ Tout est à jour.</p>`);
  document.getElementById('alertesJour').innerHTML = alertes.join('');
  let h = `<table class="table-blanc"><tr><th>Élève</th><th>Classe</th><th>Montant</th><th>Motif</th><th>Date</th></tr>`;
  mesPaiements.slice(-5).reverse().forEach(p=>{ h += `<tr><td><b>${p.enfantNom}</b></td><td>${p.classe||""}</td><td><b>${p.montant} FCFA</b></td><td>${p.motif||""}</td><td>${p.datePaiement||(p.date?new Date(p.date).toLocaleDateString('fr-FR'):"")}</td></tr>`; });
  h += `</table>`; document.getElementById('derniersPaiementsDashboard').innerHTML = mesPaiements.length ? h : "Aucun paiement.";
}
function majTableauDeBord(){ let nbA = mesEleves.filter(e=>statutInscriptionEleve(e).type==='accepte').length; let nbAtt = mesEleves.filter(e=>statutInscriptionEleve(e).type==='attente').length; let nbP = mesEleves.filter(e=>calculerSoldeEleve(e.enfant).type==='paye' && statutInscriptionEleve(e).type==='accepte').length; let nbD = mesEleves.filter(e=>calculerSoldeEleve(e.enfant).type!=='paye' && statutInscriptionEleve(e).type==='accepte').length; document.getElementById('statTotal').textContent = mesEleves.length; let a = document.getElementById('statAccepte'); if(a) a.textContent = nbA; let b = document.getElementById('statEnAttente'); if(b) b.textContent = nbAtt; document.getElementById('statPaye').textContent = nbP; document.getElementById('statNonPaye').textContent = nbD; document.getElementById('statMontant').textContent = mesPaiements.reduce((s,p)=>s+Number(p.montant||0),0).toLocaleString('fr-FR'); }
function filtrerEleves(f, btn){ filtreEleveActuel = f; document.querySelectorAll('#tabEleves .btn-filtre').forEach(b=>b.classList.remove('actif')); if(btn) btn.classList.add('actif'); afficherListeEleves(); }
function afficherListeEleves(){
  let rech = (document.getElementById('rechercheEleve')?.value||"").toLowerCase();
  let liste = mesEleves.filter(e=>{ if(rech && !e.enfant.toLowerCase().includes(rech)) return false; if(filtreEleveActuel==='tous') return true; let s = calculerSoldeEleve(e.enfant), ins = statutInscriptionEleve(e); if(filtreEleveActuel==='paye') return s.type==='paye'; if(filtreEleveActuel==='avance') return s.type==='avance'; if(filtreEleveActuel==='nonpaye') return s.type==='nonpaye'; if(filtreEleveActuel==='attente') return ins.type==='attente'; if(filtreEleveActuel==='accepte') return ins.type==='accepte'; return true; });
  let h = `<table class="table-blanc"><tr><th>N</th><th>Élève</th><th>Parent</th><th>Statuts</th><th>Payé / Reste</th><th class="no-print">Actions</th></tr>`;
  liste.forEach((e,i)=>{ let s = calculerSoldeEleve(e.enfant), ins = statutInscriptionEleve(e); h += `<tr><td>${i+1}</td><td><b>${e.enfant}</b><br><small>${e.niveau} - ${e.age} ans</small></td><td>${e.parent}<br><small>${e.tel}</small></td><td>${ins.badge}<br>${s.badge}</td><td>Total <b>${fraisTotalEcole}</b><br>Payé <b>${s.totalPaye}</b><br>Reste <b>${s.reste}</b></td><td class="no-print"><a class="lien-action" onclick="marquerPaye('${e.enfant}')">Payer</a><br><a class="lien-action" onclick="imprimerBulletinEleve('${e.enfant}','Trimestre 1')">Bulletin</a><br><a class="lien-action" onclick="contacterEleve('${e.tel}','${e.enfant}')">WhatsApp</a></td></tr>`; });
  h += `</table><p class="centre">Affichés : ${liste.length} / ${mesEleves.length}</p>`;
  document.getElementById('listeElevesGestion').innerHTML = liste.length ? h : "Aucun élève.";
}
async function chargerElevesGestion(afficher=true){ if(!monEcoleNom) return; let snap = await db.collection("inscriptions").get(); mesEleves = []; let nn = normaliser(monEcoleNom); snap.forEach(d=>{ let c = d.data(); if(normaliser(c.ecoleNom)===nn || normaliser(c.groupeNom)===nn || c.ecoleId===monEcoleId || c.groupeId===monEcoleId) mesEleves.push({id:d.id, ...c}); }); await chargerPaiementsPourStats(); if(afficher) afficherListeEleves(); let sel = document.getElementById('bulEleve'); if(sel) sel.innerHTML = mesEleves.filter(e=>statutInscriptionEleve(e).type==='accepte').map(e=>`<option value="${e.enfant}">${e.enfant} - ${e.niveau}</option>`).join(''); remplirSelectPaiementEleve(); afficherFormNotes(); majTitresFeuilles(); majTableauDeBord(); }
function contacterEleve(tel, enfant){ window.open(`https://wa.me/237${tel}?text=${encodeURIComponent("Assalamou Aleykoum, c'est le Sous-Directeur pour "+enfant)}`,'_blank'); }
function telechargerEleves(){ if(!mesEleves.length) return alert("Aucun élève"); let t = `LISTE - ${monEcoleNom}\nFrais : ${fraisTotalEcole} FCFA\n\n`; mesEleves.forEach((e,i)=>{ let s = calculerSoldeEleve(e.enfant), ins = statutInscriptionEleve(e); t += `${i+1}. ${e.enfant} (${e.niveau}) - ${ins.label} - ${s.statut} - Payé ${s.totalPaye} - Reste ${s.reste}\n`; }); window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank'); }
function filtrerPaiements(f, btn){ filtrePaiementActuel = f; document.querySelectorAll('#tabPaiements .btn-filtre').forEach(b=>{ if(b.textContent.includes("Relancer")) return; b.classList.remove('actif'); }); if(btn) btn.classList.add('actif'); afficherListePaiements(); }
function afficherListePaiements(){
  let liste = mesEleves.filter(e=>{ if(filtrePaiementActuel==='tous') return true; let s = calculerSoldeEleve(e.enfant); if(filtrePaiementActuel==='paye') return s.type==='paye'; if(filtrePaiementActuel==='avance') return s.type==='avance'; if(filtrePaiementActuel==='nonpaye') return s.type==='nonpaye'; return true; });
  let total = mesPaiements.reduce((s,p)=>s+Number(p.montant||0),0);
  let h = `<p class="centre"><b>Encaissé : ${total} FCFA</b> - Attendu : ${fraisTotalEcole*mesEleves.length} FCFA - Reste : ${Math.max(0, fraisTotalEcole*mesEleves.length-total)} FCFA</p><table class="table-blanc"><tr><th>N</th><th>Nom</th><th>Classe</th><th>Inscription</th><th>Paiement</th><th>Total / Payé / Reste</th><th class="no-print">Actions</th></tr>`;
  liste.forEach((e,i)=>{ let s = calculerSoldeEleve(e.enfant), ins = statutInscriptionEleve(e); h += `<tr><td>${i+1}</td><td><b>${e.enfant}</b></td><td>${e.niveau}</td><td>${ins.badge}</td><td>${s.badge}</td><td>Total <b>${fraisTotalEcole}</b><br>Payé <b>${s.totalPaye}</b><br>Reste <b>${s.reste}</b></td><td class="no-print"><a class="lien-action" onclick="marquerPaye('${e.enfant}')">Payer</a> <a class="lien-action" onclick="contacterEleve('${e.tel}','${e.enfant}')">Relancer</a> <a class="lien-action" onclick="genererRecuPDF('${e.enfant}',${s.totalPaye},${s.totalPaye},${s.reste})">Reçu</a></td></tr>`; });
  h += `</table>`; document.getElementById('listePaiementsGestion').innerHTML = h;
  let h2 = `<table class="table-blanc"><tr><th>N</th><th>Élève</th><th>Classe</th><th>Montant</th><th>Motif</th><th>Date</th><th class="no-print">Action</th></tr>`;
  mesPaiements.forEach((p,i)=>{ h2 += `<tr><td>${i+1}</td><td><b>${p.enfantNom}</b></td><td>${p.classe||""}</td><td><b>${p.montant} FCFA</b></td><td>${p.motif||""}</td><td>${p.datePaiement||(p.date?new Date(p.date).toLocaleDateString('fr-FR'):"")}</td><td class="no-print"><a class="lien-action" onclick="genererRecuPDF('${p.enfantNom}',${p.montant},${calculerSoldeEleve(p.enfantNom).totalPaye},${calculerSoldeEleve(p.enfantNom).reste})">Reçu</a></td></tr>`; });
  h2 += `</table>`; let hist = document.getElementById('historiquePaiements'); if(hist) hist.innerHTML = mesPaiements.length ? h2 : "Aucun paiement.";
}
function remplirSelectPaiementEleve(){ let sel = document.getElementById('paiementEleve'); if(!sel) return; let v = sel.value; let acc = mesEleves.filter(e=>statutInscriptionEleve(e).type==='accepte'); let liste = acc.length ? acc : mesEleves; sel.innerHTML = `<option value="">— Choisis l'élève —</option>` + liste.map(e=>`<option value="${e.enfant}">${e.enfant} - ${e.niveau} - ${statutInscriptionEleve(e).label}</option>`).join(''); if(v) sel.value = v; let d = document.getElementById('paiementDate'); if(d && !d.value) d.value = new Date().toISOString().slice(0,10); }
function onElevePaiementChange(){ let nom = document.getElementById('paiementEleve').value; let cl = document.getElementById('paiementClasse'); let info = document.getElementById('infoSoldeEleve'); let ap = document.getElementById('apercuApresPaiement'); let mo = document.getElementById('paiementMontant'); if(!nom){ cl.value=""; info.style.display='none'; ap.style.display='none'; if(mo) mo.value=""; return; } let el = mesEleves.find(e=>e.enfant===nom); cl.value = el ? el.niveau : ""; let s = calculerSoldeEleve(nom), ins = el ? statutInscriptionEleve(el) : {label:""}; info.style.display = 'block'; if(s.totalPaye===0) info.innerHTML = `<b>${nom} - ${cl.value}</b><br>${ins.label} - <b>✗ NON PAYÉ</b><br>Total <b>${fraisTotalEcole} FCFA</b> - Déjà payé <b>0</b> - Reste <b>${s.reste} FCFA</b>`; else if(s.reste===0) info.innerHTML = `<b>${nom} - ${cl.value}</b><br>${ins.label} - <b>✓ PAYÉ COMPLET - ${s.totalPaye} FCFA</b>`; else info.innerHTML = `<b>${nom} - ${cl.value}</b><br>${ins.label} - <b>◐ AVANCE</b><br>Total <b>${fraisTotalEcole}</b> - Déjà payé <b>${s.totalPaye}</b> - Reste <b>${s.reste}</b>`; ap.style.display = 'none'; if(mo) mo.value = ""; document.getElementById('msgPaiement').textContent = ""; }
function calculerResteApresPaiement(){ let nom = document.getElementById('paiementEleve').value; if(!nom) return; let m = Number(document.getElementById('paiementMontant').value||0); let ap = document.getElementById('apercuApresPaiement'); if(!m || m<=0){ ap.style.display='none'; return; } let s = calculerSoldeEleve(nom); let np = s.totalPaye + m; let nr = Math.max(0, fraisTotalEcole - np); ap.style.display = 'block'; ap.innerHTML = `<b>Aperçu :</b> Il paie <b>${m} FCFA</b> - Après : Total <b>${np}</b> - Reste <b>${nr}</b>${nr===0 ? "<br><b>✓ PAYÉ COMPLET</b>" : "<br>Statut : <b>◐ AVANCE</b>"}`; }
async function enregistrerPaiementFormulaire(){ let nom = document.getElementById('paiementEleve').value; if(!nom) return alert("1. Choisis l'élève."); if(fraisTotalEcole===0) return alert("Définis le Frais Total."); let el = mesEleves.find(e=>e.enfant===nom); if(el && statutInscriptionEleve(el).type!=='accepte'){ if(!confirm(nom+" est "+statutInscriptionEleve(el).label+". Tu confirmes ?")) return; } let cl = document.getElementById('paiementClasse').value; let m = Number(document.getElementById('paiementMontant').value); let motif = document.getElementById('paiementMotif').value; let date = document.getElementById('paiementDate').value || new Date().toISOString().slice(0,10); if(!m || m<=0) return alert("Mets le montant."); let s = calculerSoldeEleve(nom); if(s.reste===0) return alert(nom+" a déjà tout payé."); if(m > s.reste && !confirm(nom+" doit "+s.reste+" FCFA, tu mets "+m+" FCFA. Tu confirmes ?")) return; if(!confirm(`Confirmer ?\n\nÉlève : ${nom}\nClasse : ${cl}\nIl paie : ${m} FCFA\nMotif : ${motif}\nDate : ${date}\n\nAvant : Payé ${s.totalPaye} - Reste ${s.reste}\nAprès : Payé ${s.totalPaye+m} - Reste ${Math.max(0, fraisTotalEcole-(s.totalPaye+m))}`)) return; await db.collection("paiements").add({enfantNom:nom, classe:cl, ecoleNom:monEcoleNom, montant:m, motif, mode:"Cash", date:new Date(date).toISOString(), datePaiement:date, par:document.getElementById('gestionEmail').textContent}); let np = s.totalPaye + m; let nr = Math.max(0, fraisTotalEcole - np); document.getElementById('msgPaiement').textContent = `${nom} a payé ${m} FCFA. Total : ${np} - Reste : ${nr}`; alert(`Enregistré !\n\n${nom} - ${cl}\nPayé : ${m} FCFA\nTotal : ${np}\nReste : ${nr}`); document.getElementById('paiementEleve').value = ""; document.getElementById('paiementClasse').value = ""; document.getElementById('paiementMontant').value = ""; document.getElementById('infoSoldeEleve').style.display = 'none'; document.getElementById('apercuApresPaiement').style.display = 'none'; chargerElevesGestion(); chargerPaiementsGestion(); if(confirm("Générer le reçu ?")) genererRecuPDF(nom, m, np, nr); }
function marquerPaye(nom){ showTabGestion('tabPaiements', document.querySelectorAll('.gestion-tab')[2]); setTimeout(()=>{ let sel = document.getElementById('paiementEleve'); if(sel){ sel.value = nom; onElevePaiementChange(); } document.getElementById('paiementMontant')?.focus(); window.scrollTo({top:0, behavior:'smooth'}); }, 300); }
async function chargerPaiementsPourStats(){ let snap = await db.collection("paiements").get(); mesPaiements = []; snap.forEach(d=>{ let p = d.data(); if(mesEleves.some(e=>normaliser(e.enfant)===normaliser(p.enfantNom))) mesPaiements.push(p); }); majTableauDeBord(); }
async function chargerPaiementsGestion(){ let snap = await db.collection("paiements").get(); mesPaiements = []; snap.forEach(d=>{ let p = d.data(); if(mesEleves.some(e=>normaliser(e.enfant)===normaliser(p.enfantNom))) mesPaiements.push(p); }); remplirSelectPaiementEleve(); afficherListePaiements(); majTableauDeBord(); majTitresFeuilles(); }
function partagerPaiementsWhatsApp(){ if(!mesPaiements.length) return alert("Aucun paiement"); let t = `PAIEMENTS - ${monEcoleNom}\nFrais : ${fraisTotalEcole} FCFA\n\n`; mesEleves.forEach(e=>{ let s = calculerSoldeEleve(e.enfant); t += `${e.enfant} (${e.niveau}) : Payé ${s.totalPaye} - Reste ${s.reste} - ${s.statut}\n`; }); window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank'); }
function relancerTousLesImpayes(){ if(fraisTotalEcole===0) return alert("Définis le Frais Total."); let imp = mesEleves.filter(e=>calculerSoldeEleve(e.enfant).reste>0 && statutInscriptionEleve(e).type==='accepte'); if(!imp.length) return alert("Personne ne doit !"); let t = `RAPPEL - ${monEcoleNom}\nTotal : ${fraisTotalEcole} FCFA\n\n`; imp.forEach(e=>{ let s = calculerSoldeEleve(e.enfant); t += `${e.enfant} : Payé ${s.totalPaye} - Reste ${s.reste}\n`; }); window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank'); }
function genererRecuPDF(nom, dernier, total, reste){ try{ let doc = nouveauPDF(); doc.setFillColor(165,214,167); doc.rect(0,0,210,24,"F"); doc.setTextColor(27,94,32); doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.text(enleverAccents("INSTITUT NOUROUL IYMANE"),105,10,{align:"center"}); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text(enleverAccents("RECU - "+monEcoleNom),105,17,{align:"center"}); doc.setTextColor(0,0,0); let y = 35; doc.setFontSize(11); doc.text(enleverAccents("Eleve : "+nom),12,y); y+=10; doc.setFont("helvetica","bold"); doc.text(enleverAccents("Paye : "+dernier+" FCFA"),12,y); y+=10; doc.setFont("helvetica","normal"); doc.text(enleverAccents("Total : "+total+" FCFA - Reste : "+reste+" FCFA"),12,y); doc.save("Recu-"+enleverAccents(nom).replace(/[^a-zA-Z0-9]/g,'-')+".pdf"); alert("Reçu téléchargé !"); }catch(e){ alert("Erreur reçu"); } }
async function chargerFraisTotal(){ if(!monEcoleId) return; try{ let doc = await db.collection("configFrais").doc(monEcoleId).get(); fraisTotalEcole = doc.exists ? Number(doc.data().montant||0) : 0; }catch(e){ fraisTotalEcole = 0; } let aff = document.getElementById('affichageFraisTotal'); if(aff) aff.textContent = fraisTotalEcole>0 ? fraisTotalEcole.toLocaleString('fr-FR')+" FCFA" : "Non défini"; let inp = document.getElementById('inputFraisTotal'); if(inp && fraisTotalEcole>0) inp.value = fraisTotalEcole; majTitresFeuilles(); }
async function definirFraisTotal(){ let v = document.getElementById('inputFraisTotal').value; if(!v) return alert("Écris le montant."); v = Number(v); if(!confirm("Chaque élève doit payer "+v+" FCFA ?")) return; await db.collection("configFrais").doc(monEcoleId).set({ecoleNom:monEcoleNom, montant:v, date:new Date().toISOString()}); fraisTotalEcole = v; alert("Enregistré !"); majTitresFeuilles(); chargerElevesGestion(); chargerPaiementsGestion(); }
async function ajouterEnseignant(){ let nom = document.getElementById('ensNom').value.trim(); let tel = document.getElementById('ensTel').value.trim(); let role = document.getElementById('ensRole').value; let mat = document.getElementById('ensMatiere').value; let cl = document.getElementById('ensClasse').value; let sal = document.getElementById('ensSalaire').value; if(!nom) return alert("Nom ?"); if(!tel) return alert("Téléphone ?"); if(!sal) return alert("Salaire ?"); await db.collection("enseignants").add({ecoleNom:monEcoleNom, ecoleId:monEcoleId, nom, tel, role, matiere:mat, classe:cl, salaire:Number(sal), date:new Date().toISOString()}); alert(nom+" ajouté."); document.getElementById('ensNom').value = ""; document.getElementById('ensTel').value = ""; document.getElementById('ensSalaire').value = ""; chargerEnseignants(); }
async function chargerEnseignants(aff=true){ if(!monEcoleNom) return; let snap = await db.collection("enseignants").where("ecoleNom","==",monEcoleNom).get(); mesEnseignants = []; snap.forEach(d=>mesEnseignants.push({id:d.id, ...d.data()})); let snapP = await db.collection("paiementsEnseignants").where("ecoleNom","==",monEcoleNom).get(); mesPaiementsEnseignants = []; snapP.forEach(d=>mesPaiementsEnseignants.push({id:d.id, ...d.data()})); remplirSelectComEnseignants(); if(!aff) return; let h = `<table class="table-blanc"><tr><th>N</th><th>Nom</th><th>Rôle / Matière</th><th>Classe</th><th>Tél</th><th>Salaire / Payé / Reste</th><th class="no-print">Actions</th></tr>`; mesEnseignants.forEach((e,i)=>{ let s = calculerSoldeEnseignant(e.nom); h += `<tr><td>${i+1}</td><td><b>${e.nom}</b></td><td>${e.role}<br><small>${e.matiere}</small></td><td>${e.classe}</td><td>${e.tel}</td><td>Salaire <b>${e.salaire} FCFA</b><br>Payé <b>${s.totalPaye}</b><br>Reste <b>${s.reste}</b></td><td class="no-print"><a class="lien-action" onclick="payerEnseignant('${e.nom}')">Payer</a> <a class="lien-action" onclick="contacterEnseignant('${e.tel}','${e.nom}')">WhatsApp</a></td></tr>`; }); h += `</table>`; document.getElementById('listeEnseignants').innerHTML = mesEnseignants.length ? h : "Aucun enseignant."; majTitresFeuilles(); }
async function payerEnseignant(nom){ let s = calculerSoldeEnseignant(nom); if(s.reste===0) return alert(nom+" a déjà tout reçu."); let m = prompt(nom+"\nSalaire : "+s.salaire+"\nDéjà payé : "+s.totalPaye+"\nReste : "+s.reste+"\n\nCombien ?"); if(!m) return; m = Number(m); await db.collection("paiementsEnseignants").add({enseignantNom:nom, ecoleNom:monEcoleNom, montant:m, motif:"Avance salaire", date:new Date().toISOString()}); alert(nom+" a reçu "+m+" FCFA."); chargerEnseignants(); }
function remplirSelectComEnseignants(){ let sel = document.getElementById('selectEnseignantCom'); if(!sel) return; sel.innerHTML = `<option value="">— Choisis un enseignant —</option>` + mesEnseignants.map(e=>`<option value="${e.tel}">${e.nom} - ${e.role} - ${e.tel}</option>`).join(''); }
function contacterEnseignant(tel, nom){ window.open(`https://wa.me/237${nettoyerTel(tel)}?text=${encodeURIComponent("Assalamou Aleykoum "+nom+", c'est le Sous-Directeur de "+monEcoleNom+".")}`,'_blank'); }
function envoyerMessageUnEnseignant(){ let tel = document.getElementById('selectEnseignantCom').value; let msg = document.getElementById('msgEnseignantCom').value.trim(); if(!tel) return alert("Choisis l'enseignant."); if(!msg) return alert("Écris ton message."); window.open(`https://wa.me/237${nettoyerTel(tel)}?text=${encodeURIComponent(msg)}`,'_blank'); }
function envoyerMessageTousEnseignants(){ if(!mesEnseignants.length) return alert("Aucun enseignant"); let msg = prompt("Message pour TOUS les enseignants ?\nEx : Réunion demain à 8h"); if(!msg) return; let texte = `📢 MESSAGE - ${monEcoleNom}\n\n${msg}\n\n— Le Sous-Directeur`; if(confirm("J'ouvre WhatsApp pour envoyer :\n\n"+texte)){ window.open(`https://wa.me/237${nettoyerTel(mesEnseignants[0].tel)}?text=${encodeURIComponent(texte)}`,'_blank'); } }
function creerGroupeWhatsAppEnseignants(){ if(!mesEnseignants.length) return alert("Aucun enseignant"); let msg = `Assalamou Aleykoum à tous,\n\nCeci est le groupe des enseignants de ${monEcoleNom}.\nIci on se parle, on partage les infos, les présences, les bulletins.\n\n— Le Sous-Directeur`; if(confirm("Pour créer le groupe :\n1. WhatsApp > Nouveau groupe\n2. Ajoute : "+mesEnseignants.map(e=>e.nom).join(", ")+"\n\nJ'ouvre WhatsApp avec le message déjà écrit ?")){ window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank'); } }
function telechargerEnseignantsPDF(){ if(!mesEnseignants.length) return alert("Aucun enseignant"); try{ let doc = nouveauPDF(), y = 15; doc.setTextColor(0,0,0); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(enleverAccents("INSTITUT NOUROUL IYMANE"),105,12,{align:"center"}); doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(enleverAccents("ENSEIGNANTS - "+monEcoleNom),105,22,{align:"center"}); y = 32; mesEnseignants.forEach(e=>{ let s = calculerSoldeEnseignant(e.nom); doc.text(enleverAccents(e.nom+" - "+e.role+" - "+e.salaire+" - Paye "+s.totalPaye+" - Reste "+s.reste),12,y); y+=6; }); doc.save("Enseignants.pdf"); alert("Téléchargé !"); }catch(e){ ouvrirEnseignantsNouvelOnglet(); } }
function ouvrirEnseignantsNouvelOnglet(){ let lignes = mesEnseignants.map(e=>{ let s = calculerSoldeEnseignant(e.nom); return `<tr><td><b>${e.nom}</b></td><td>${e.role}</td><td>${e.matiere}</td><td>${e.classe}</td><td>${e.salaire}</td><td>${s.totalPaye}</td><td>${s.reste}</td></tr>`; }).join(''); ouvrirHTMLDansNouvelOnglet("Enseignants", `<h2 style="text-align:center">ENSEIGNANTS - ${monEcoleNom}</h2><table><tr><th>Nom</th><th>Rôle</th><th>Matière</th><th>Classe</th><th>Salaire</th><th>Payé</th><th>Reste</th></tr>${lignes}</table>`); }
function partagerEnseignantsWhatsApp(){ if(!mesEnseignants.length) return alert("Aucun enseignant"); let t = `ENSEIGNANTS - ${monEcoleNom}\n\n`; mesEnseignants.forEach(e=>{ let s = calculerSoldeEnseignant(e.nom); t += `${e.nom} - ${e.role} - ${e.salaire} - Payé ${s.totalPaye} - Reste ${s.reste}\n`; }); window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank'); }
function ouvrirHTMLDansNouvelOnglet(titre, html){ let c = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titre}</title><style>@page{size:A4;margin:10mm} body{font-family:Arial,sans-serif;padding:10px;max-width:800px;margin:0 auto} table{width:100%;border-collapse:collapse} th,td{border:1px solid #66BB6A;padding:6px;font-size:12px} th{background:#A5D6A7;color:#1B5E20} .btn{position:fixed;bottom:16px;left:16px;right:16px;background:#66BB6A;color:white;border:none;padding:14px;border-radius:10px;font-weight:800}@media print{.btn{display:none}}</style></head><body>${html}<button class="btn" onclick="window.print()">IMPRIMER / PDF - 1 PAGE</button></body></html>`; let w = window.open('','_blank'); if(!w) return alert("Autorise les popup"); w.document.write(c); w.document.close(); }
function arDeMatiere(nomFr, deja){ if(deja) return deja; return MATIERES_AR[nomFr] || ""; }
function affMatiereHTML(nomFr, ar){ let a = arDeMatiere(nomFr, ar); return `<b>${nomFr}</b>${a ? `<br><span dir="rtl" style="font-size:14px;">${a}</span>` : ""}`; }
function affMatiereTexte(nomFr, ar){ let a = arDeMatiere(nomFr, ar); return a ? nomFr + " - " + a : nomFr; }
// ===== PARTIE 2 - CORRIGEE - VERSION FINALE - BULLETINS + PRESENCE + BILAN + CONNEXION =====

// ===== BULLETINS - FIXE ABSENT=0 =====
function bulletinFixePourEleve(notesBrutes){
  let actives = getMatieresActives();
  let parId = {};
  notesBrutes.forEach(b=>{ parId[b.matiereId]=b; });
  let lignes = actives.map(m=>{
    let b = parId[m.id];
    let ar = m.ar || MATIERES_AR[m.fr] || (b ? (b.matiereAr || MATIERES_AR[b.matiere] || "") : "");
    if(b && b.aCompose !== false){
      let moy = calculerMoyenneMatiere(b.oral, b.ecrit);
      if(moy!==null && moy!==undefined){
        return {matiereId:m.id, matiere:m.fr, matiereAr:ar, oral:(b.oral==="-"?"":b.oral), ecrit:(b.ecrit==="-"?"":b.ecrit), moyenne:Number(moy), aCompose:true};
      }
      if(b.aCompose===true && (b.oral===0 || b.ecrit===0)) return {matiereId:m.id, matiere:m.fr, matiereAr:ar, oral:0, ecrit:0, moyenne:0, aCompose:true};
    }
    return {matiereId:m.id, matiere:m.fr, matiereAr:ar, oral:0, ecrit:0, moyenne:0, aCompose:false};
  });
  let tot = lignes.reduce((s,l)=>s+Number(l.moyenne||0),0);
  let moy = lignes.length ? tot/lignes.length : 0;
  let composees = lignes.filter(l=>l.aCompose);
  return {lignes, composees, moy, nbFixe:actives.length, nbCompose:composees.length};
}
function afficherFormNotes(){
  let c = document.getElementById('formNotes'); if(!c) return;
  let actives = getMatieresActives();
  let h = `<div style="background:#E3F2FD;border:1px solid #90CAF9;padding:10px;border-radius:10px;text-align:center"><b>Composition : ${libelleTypeComposition()}</b><br><small>Si l'élève n'a pas composé, laisse VIDE. Ça va compter 0.</small></div>`;
  if(typeComposition==="oral" || typeComposition==="oral_ecrit"){
    h += `<div style="background:#A5D6A7;color:#1B5E20;padding:10px;border-radius:10px;margin-top:12px;text-align:center"><b>PARTIE 1 - ORAL - ${actives.length} matière(s) FIXE(S)</b></div>`;
    actives.forEach(m=>{ let ar = m.ar || MATIERES_AR[m.fr] || ""; let affAr = ar ? ` <span dir="rtl" style="color:#1B5E20;">${ar}</span>` : ""; h += `<div style="background:#F1F8E9;border:1px solid #C8E6C9;padding:8px;border-radius:10px;margin:5px 0;display:flex;justify-content:space-between;align-items:center"><div><b>${m.fr}</b>${affAr}<br><small>${m.desc}</small></div><div><input type="number" min="0" max="20" step="0.5" id="oral_${m.id}" class="note-input" placeholder="Oral"> /20</div></div>`; });
  }
  if(typeComposition==="ecrit" || typeComposition==="oral_ecrit"){
    h += `<div style="background:#A5D6A7;color:#1B5E20;padding:10px;border-radius:10px;margin-top:12px;text-align:center"><b>PARTIE 2 - ÉCRIT - ${actives.length} matière(s) FIXE(S)</b></div>`;
    actives.forEach(m=>{ let ar = m.ar || MATIERES_AR[m.fr] || ""; let affAr = ar ? ` <span dir="rtl" style="color:#1B5E20;">${ar}</span>` : ""; h += `<div style="background:#FFF9C4;border:1px solid #FFE082;padding:8px;border-radius:10px;margin:5px 0;display:flex;justify-content:space-between;align-items:center"><div><b>${m.fr}</b>${affAr}<br><small>${m.desc}</small></div><div><input type="number" min="0" max="20" step="0.5" id="ecrit_${m.id}" class="note-input" placeholder="Écrit"> /20</div></div>`; });
  }
  c.innerHTML = h;
}
async function chargerNotesExistantes(){
  let el = document.getElementById('bulEleve')?.value; let tr = document.getElementById('bulTrimestre')?.value; if(!el || !tr) return;
  getMatieresActives().forEach(m=>{ let o = document.getElementById('oral_'+m.id); if(o) o.value = ""; let e = document.getElementById('ecrit_'+m.id); if(e) e.value = ""; });
  let app = document.getElementById('bulAppreciationGenerale'); if(app) app.value = "";
  try{ let snap = await db.collection("bulletins").where("ecoleNom","==",monEcoleNom).get(); snap.forEach(d=>{ let b = d.data(); if(b.eleve===el && (b.trimestre||"Trimestre 1")===tr){ let o = document.getElementById('oral_'+b.matiereId); if(o && b.oral!=="-" && b.oral!==0 && b.oral!=="" && b.oral!==null) o.value = b.oral; let e = document.getElementById('ecrit_'+b.matiereId); if(e && b.ecrit!=="-" && b.ecrit!==0 && b.ecrit!=="" && b.ecrit!==null) e.value = b.ecrit; if(b.appreciationGenerale && app) app.value = b.appreciationGenerale; } }); }catch(e){}
}
async function enregistrerBulletinComplet(){
  let el = document.getElementById('bulEleve').value; let tr = document.getElementById('bulTrimestre').value; let an = document.getElementById('bulAnnee').value || "2026-2027"; let app = document.getElementById('bulAppreciationGenerale').value.trim();
  if(!el) return alert("Choisis l'élève");
  let actives = getMatieresActives(); let notes = [];
  actives.forEach(m=>{
    let oEl = document.getElementById('oral_'+m.id); let eEl = document.getElementById('ecrit_'+m.id);
    let oVal = oEl ? oEl.value : ""; let eVal = eEl ? eEl.value : "";
    let aCompose = false;
    if(typeComposition==="oral") aCompose = (oVal!=="");
    else if(typeComposition==="ecrit") aCompose = (eVal!=="");
    else aCompose = (oVal!=="" || eVal!=="");
    let ar = m.ar || MATIERES_AR[m.fr] || "";
    if(!aCompose){ notes.push({matiereId:m.id, matiere:m.fr, matiereAr:ar, oral:0, ecrit:0, moyenne:0, note:0, aCompose:false, typeComposition:typeComposition}); }
    else {
      let oo = (oVal==="" ? 0 : Number(oVal)); let ee = (eVal==="" ? 0 : Number(eVal));
      let moy = calculerMoyenneMatiere(oo, ee);
      let oralSave = (typeComposition==="ecrit") ? 0 : oo;
      let ecritSave = (typeComposition==="oral") ? 0 : ee;
      notes.push({matiereId:m.id, matiere:m.fr, matiereAr:ar, oral:oralSave, ecrit:ecritSave, moyenne:Number(moy), note:Number(moy), aCompose:true, typeComposition:typeComposition});
    }
  });
  let totPrev = notes.reduce((s,n)=>s+Number(n.moyenne||0),0); let moyPrev = (totPrev/notes.length).toFixed(2);
  if(!confirm(`Enregistrer le bulletin FIXE pour ${el} - ${tr} ?\n\nComposition : ${libelleTypeComposition()}\nBulletin FIXE : ${actives.length} matière(s)\nComposées : ${notes.filter(n=>n.aCompose).length} - Absents (0) : ${notes.filter(n=>!n.aCompose).length}\nTotal : ${totPrev} - Moyenne = ${totPrev} / ${notes.length} = ${moyPrev} / 20`)) return;
  try{
    let snap = await db.collection("bulletins").where("ecoleNom","==",monEcoleNom).get();
    for(let doc of snap.docs){ let b = doc.data(); if(b.eleve===el && (b.trimestre||"Trimestre 1")===tr){ if(matieresActivesIds.includes(b.matiereId)) await db.collection("bulletins").doc(doc.id).delete(); } }
    for(let n of notes){ await db.collection("bulletins").add({ecoleNom:monEcoleNom, eleve:el, trimestre:tr, annee:an, matiereId:n.matiereId, matiere:n.matiere, matiereAr:n.matiereAr, oral:n.oral, ecrit:n.ecrit, moyenne:n.moyenne, note:n.moyenne, aCompose:n.aCompose, typeComposition:n.typeComposition, appreciationGenerale:app, date:new Date().toISOString()}); }
    document.getElementById('msgBulletin').textContent = `Bulletin FIXE de ${el} enregistré ! Moyenne = ${moyPrev} / 20 sur ${actives.length} matière(s) fixées - ${libelleTypeComposition()}.`;
    chargerBulletins();
    setTimeout(()=>{ if(confirm("Voir le bulletin FIXE ?")) imprimerBulletinEleve(el, tr); }, 500);
  }catch(e){ alert("Erreur : "+e.message); }
}
async function chargerBulletins(){
  try{
    let snap = await db.collection("bulletins").where("ecoleNom","==",monEcoleNom).get();
    let g = {};
    snap.forEach(d=>{ let b = d.data(); if(!matieresActivesIds.includes(b.matiereId)) return; let k = b.eleve+"||"+(b.trimestre||"Trimestre 1"); if(!g[k]) g[k] = {eleve:b.eleve, trimestre:b.trimestre||"Trimestre 1", notes:[]}; g[k].notes.push(b); });
    let list = Object.values(g).map(x=>{ let fixe = bulletinFixePourEleve(x.notes); x.moy = fixe.moy; x.nbFixe = fixe.nbFixe; x.nbCompose = fixe.nbCompose; return x; });
    list.sort((a,b)=>b.moy-a.moy); list.forEach((x,i)=>x.rang=i+1);
    let h = `<table class="table-blanc"><tr><th>Élève</th><th>Trimestre</th><th>Moyenne (FIXE ${getMatieresActives().length} mat. - ${libelleTypeComposition()})</th><th>Rang</th><th>Détail</th><th class="no-print">Actions</th></tr>`;
    list.forEach(x=>{ let fixe = bulletinFixePourEleve(x.notes); h += `<tr><td><b>${x.eleve}</b></td><td>${x.trimestre}</td><td><b>${x.moy.toFixed(2)} / 20</b><br><small>sur ${fixe.nbFixe} fixées - Absent = 0</small></td><td>#${x.rang}</td><td>${fixe.lignes.map(n=>{ let aff = affMatiereTexte(n.matiere, n.matiereAr); if(!n.aCompose) return `${aff} : Absent = 0`; if(typeComposition==="oral") return `${aff} : Oral ${n.oral} = ${Number(n.moyenne).toFixed(2)}`; if(typeComposition==="ecrit") return `${aff} : Écrit ${n.ecrit} = ${Number(n.moyenne).toFixed(2)}`; return `${aff} : Oral ${n.oral} + Écrit ${n.ecrit} = ${Number(n.moyenne).toFixed(2)}`; }).join(" | ")}</td><td class="no-print"><a class="lien-action" onclick="imprimerBulletinEleve('${x.eleve}','${x.trimestre}')">Voir</a> <a class="lien-action" onclick="partagerBulletinWhatsApp('${x.eleve}','${x.trimestre}')">WhatsApp</a> <a class="lien-action" onclick="modifierBulletin('${x.eleve}','${x.trimestre}')">Modifier</a> <a class="lien-action" onclick="supprimerBulletinGroupe('${x.eleve}','${x.trimestre}')">Supprimer</a></td></tr>`; });
    h += `</table>`; document.getElementById('listeBulletins').innerHTML = h || "Aucun bulletin.";
  }catch(e){ document.getElementById('listeBulletins').innerHTML = "Erreur : "+e.message; }
}
function modifierBulletin(eleve, trimestre){ document.getElementById('bulEleve').value = eleve; document.getElementById('bulTrimestre').value = trimestre; chargerNotesExistantes(); window.scrollTo({top:0, behavior:'smooth'}); }
async function supprimerBulletinGroupe(eleve, trimestre){ if(!confirm("Supprimer le bulletin de "+eleve+" ?")) return; let snap = await db.collection("bulletins").where("ecoleNom","==",monEcoleNom).get(); for(let doc of snap.docs){ let b = doc.data(); if(b.eleve===eleve && (b.trimestre||"Trimestre 1")===trimestre) await db.collection("bulletins").doc(doc.id).delete(); } chargerBulletins(); }
async function imprimerBulletinEleve(nom, tr){
  try{
    tr = tr || document.getElementById('bulTrimestre')?.value || "Trimestre 1";
    let snap = await db.collection("bulletins").where("ecoleNom","==",monEcoleNom).get();
    let notesBrutes = [], app = "", an = "2026-2027";
    snap.forEach(d=>{ let b = d.data(); if(b.eleve===nom && (b.trimestre||"Trimestre 1")===tr && matieresActivesIds.includes(b.matiereId)){ notesBrutes.push(b); if(b.appreciationGenerale) app = b.appreciationGenerale; if(b.annee) an = b.annee; } });
    if(!notesBrutes.length) return alert("Aucune note pour "+nom);
    if(notesBrutes[0] && notesBrutes[0].typeComposition) typeComposition = notesBrutes[0].typeComposition;
    let fixe = bulletinFixePourEleve(notesBrutes); let notes = fixe.lignes;
    let tous = {}; snap.forEach(d=>{ let b = d.data(); if((b.trimestre||"Trimestre 1")===tr && matieresActivesIds.includes(b.matiereId)){ if(!tous[b.eleve]) tous[b.eleve] = []; tous[b.eleve].push(b); } });
    let cls = Object.keys(tous).map(n=>{ let f = bulletinFixePourEleve(tous[n]); return {nom:n, moy:f.moy}; }).sort((a,b)=>b.moy-a.moy);
    let rang = cls.findIndex(x=>x.nom===nom)+1;
    let elObj = mesEleves.find(e=>normaliser(e.enfant)===normaliser(nom)) || {enfant:nom, niveau:""};
    let moy = fixe.moy.toFixed(2); let men = mentionPour(Number(moy));
    let entete = typeComposition==="oral" ? `<th style="text-align:center">Oral</th><th style="text-align:center">Moyenne</th>` : typeComposition==="ecrit" ? `<th style="text-align:center">Écrit</th><th style="text-align:center">Moyenne</th>` : `<th style="text-align:center">Oral</th><th style="text-align:center">Écrit</th><th style="text-align:center">Moyenne</th>`;
    let lignes = notes.map(b=>{
      let affMatiere = affMatiereHTML(b.matiere, b.matiereAr);
      if(typeComposition==="oral") return `<tr><td>${affMatiere}</td><td style="text-align:center">${b.aCompose ? b.oral+" / 20" : "0 - Absent"}</td><td style="text-align:center;font-weight:800">${b.aCompose ? Number(b.moyenne).toFixed(2)+" / 20" : "0 / 20"}</td></tr>`;
      if(typeComposition==="ecrit") return `<tr><td>${affMatiere}</td><td style="text-align:center">${b.aCompose ? b.ecrit+" / 20" : "0 - Absent"}</td><td style="text-align:center;font-weight:800">${b.aCompose ? Number(b.moyenne).toFixed(2)+" / 20" : "0 / 20"}</td></tr>`;
      return `<tr><td>${affMatiere}</td><td style="text-align:center">${b.aCompose ? b.oral+" / 20" : "0 - Absent"}</td><td style="text-align:center">${b.aCompose ? b.ecrit+" / 20" : "0 - Absent"}</td><td style="text-align:center;font-weight:800">${b.aCompose ? Number(b.moyenne).toFixed(2)+" / 20" : "0 / 20"}</td></tr>`;
    }).join('');
    dernierBulletinData = {eleve:elObj.enfant, niveau:elObj.niveau, trimestre:tr, annee:an, typeComposition:typeComposition, notes:notes.map(b=>({matiere:b.matiere, matiereAr:b.matiereAr, oral:b.aCompose?b.oral:0, ecrit:b.aCompose?b.ecrit:0, moyenne:b.aCompose?Number(b.moyenne).toFixed(2):"0.00"})), moyenne:moy, mention:men, appreciation:app, rang};
    let html = `<div class="bulletin-page"><div class="b-head"><h2>INSTITUT NOUROUL IYMANE</h2><div dir="rtl" style="font-size:20px;font-weight:bold;">${NOM_ECOLE_AR}</div><p>Yaoundé - Année ${an} - BULLETIN - كشف الدرجات - ${fixe.nbFixe} matière(s) FIXE(S) - ${libelleTypeComposition()}</p></div><div class="b-infos"><div>Nom<br><b>${elObj.enfant}</b></div><div>Classe<br><b>${elObj.niveau||"Niveau 3"}</b></div><div>Trimestre<br><b>${tr}</b></div><div>Rang<br><b>#${rang}</b></div></div><table><tr><th>Matières - المواد</th>${entete}</tr>${lignes}</table><div class="b-total"><span>MOYENNE : ${moy} / 20 (sur ${fixe.nbFixe} mat. fixées - Absent = 0)</span><span>${men}</span></div><div class="b-app">Appréciation : ${app||"Efforts à fournir"}</div><div class="b-sign"><div>Le Directeur<br><br>__________________</div><div>Le Parent<br><br>__________________</div></div></div>`;
    let zone = document.getElementById('zoneImpression'); zone.style.display = 'block';
    zone.innerHTML = html + `<div style="text-align:center;margin-top:12px" class="no-print"><button onclick="telechargerPDFBulletin()" class="btn-noir">TÉLÉCHARGER EN PDF - 1 PAGE</button><br><br><button onclick="ouvrirBulletinNouvelOnglet()" style="background:white;border:1px solid #66BB6A;padding:12px 20px;border-radius:10px;font-weight:700">OUVRIR + IMPRIMER - 1 PAGE</button><br><br><button onclick="document.getElementById('zoneImpression').style.display='none'" style="background:white;border:1px solid #ccc;padding:10px 20px;border-radius:10px">Fermer</button></div>`;
    zone.scrollIntoView({behavior:'smooth'});
  }catch(e){ alert("Erreur : "+e.message); }
}
function telechargerPDFBulletin(){
  if(!dernierBulletinData) return alert("Ouvre d'abord le bulletin");
  try{
    let doc = nouveauPDF(), d = dernierBulletinData;
    doc.setFillColor(165,214,167); doc.rect(0,0,210,24,"F"); doc.setTextColor(27,94,32); doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.text(enleverAccents("INSTITUT NOUROUL IYMANE"),105,10,{align:"center"}); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text(enleverAccents("Yaounde - Annee "+d.annee+" - BULLETIN FIXE - "+d.notes.length+" matieres - "+libelleTypeComposition()),105,17,{align:"center"}); doc.setTextColor(0,0,0); doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text(enleverAccents("Nom : "+d.eleve),10,32); doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(enleverAccents("Classe : "+d.niveau),10,38); doc.text(enleverAccents("Trimestre : "+d.trimestre),75,38); doc.text(enleverAccents("Rang : #"+d.rang),150,38);
    let y = 46; doc.setFillColor(165,214,167); doc.rect(10,y,190,7,"F"); doc.setTextColor(27,94,32); doc.setFont("helvetica","bold"); doc.setFontSize(9);
    if(d.typeComposition==="oral"){ doc.text("Matieres",12,y+5); doc.text("Oral",120,y+5); doc.text("Moyenne",165,y+5); }
    else if(d.typeComposition==="ecrit"){ doc.text("Matieres",12,y+5); doc.text("Ecrit",120,y+5); doc.text("Moyenne",165,y+5); }
    else { doc.text("Matieres",12,y+5); doc.text("Oral",105,y+5); doc.text("Ecrit",135,y+5); doc.text("Moyenne",165,y+5); }
    y += 7; doc.setTextColor(0,0,0); doc.setFont("helvetica","normal");
    d.notes.forEach(n=>{ y += 6; doc.text(enleverAccents(n.matiere),12,y); if(d.typeComposition==="oral"){ doc.text(String(n.oral)+" / 20",120,y); } else if(d.typeComposition==="ecrit"){ doc.text(String(n.ecrit)+" / 20",120,y); } else { doc.text(String(n.oral)+" / 20",105,y); doc.text(String(n.ecrit)+" / 20",135,y); } doc.setFont("helvetica","bold"); doc.text(String(n.moyenne)+" / 20",165,y); doc.setFont("helvetica","normal"); doc.line(10,y+2,200,y+2); });
    y += 8; doc.setFillColor(165,214,167); doc.rect(10,y,190,9,"F"); doc.setTextColor(27,94,32); doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text(enleverAccents("MOYENNE : "+d.moyenne+" / 20"),12,y+6); doc.text(enleverAccents(d.mention),140,y+6); y += 14; doc.setTextColor(0,0,0); doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(enleverAccents("Appreciation : "+(d.appreciation||"Efforts a fournir")),10,y); y += 12; doc.text("Le Directeur",20,y); doc.text("Le Parent",150,y); y += 8; doc.text("__________________",20,y); doc.text("__________________",150,y);
    doc.save("Bulletin-"+enleverAccents(d.eleve).replace(/[^a-zA-Z0-9]/g,'-')+".pdf"); alert("Bulletin téléchargé - 1 page !");
  }catch(e){ ouvrirBulletinNouvelOnglet(); }
}
function ouvrirBulletinNouvelOnglet(){ if(!dernierBulletinData) return; let d = dernierBulletinData; let lignes = d.notes.map(n=>{ let affM = affMatiereHTML(n.matiere, n.matiereAr); if(d.typeComposition==="oral") return `<tr><td>${affM}</td><td style="text-align:center">${n.oral} / 20</td><td style="text-align:center;font-weight:800">${n.moyenne} / 20</td></tr>`; if(d.typeComposition==="ecrit") return `<tr><td>${affM}</td><td style="text-align:center">${n.ecrit} / 20</td><td style="text-align:center;font-weight:800">${n.moyenne} / 20</td></tr>`; return `<tr><td>${affM}</td><td style="text-align:center">${n.oral} / 20</td><td style="text-align:center">${n.ecrit} / 20</td><td style="text-align:center;font-weight:800">${n.moyenne} / 20</td></tr>`; }).join(''); let entete = d.typeComposition==="oral" ? `<th>Matières - المواد</th><th>Oral</th><th>Moyenne</th>` : d.typeComposition==="ecrit" ? `<th>Matières - المواد</th><th>Écrit</th><th>Moyenne</th>` : `<th>Matières - المواد</th><th>Oral</th><th>Écrit</th><th>Moyenne</th>`; ouvrirHTMLDansNouvelOnglet("Bulletin-"+d.eleve, `<div class="bulletin-page"><div class="b-head"><h2>INSTITUT NOUROUL IYMANE</h2><div dir="rtl" style="font-size:20px;font-weight:bold;">${NOM_ECOLE_AR}</div><p>${d.annee} - BULLETIN - كشف الدرجات - ${d.notes.length} matière(s) - ${libelleTypeComposition()}</p></div><div class="b-infos"><div>Nom<br><b>${d.eleve}</b></div><div>Classe<br><b>${d.niveau}</b></div><div>Trimestre<br><b>${d.trimestre}</b></div><div>Rang<br><b>#${d.rang}</b></div></div><table><tr>${entete}</tr>${lignes}</table><div class="b-total"><span>MOYENNE : ${d.moyenne} / 20</span><span>${d.mention}</span></div></div>`); }
async function partagerBulletinWhatsApp(nom, tr){
  try{
    tr = tr || "Trimestre 1"; let snap = await db.collection("bulletins").where("ecoleNom","==",monEcoleNom).get(); let notesBrutes = [];
    snap.forEach(d=>{ let b = d.data(); if(b.eleve===nom && (b.trimestre||"Trimestre 1")===tr && matieresActivesIds.includes(b.matiereId)) notesBrutes.push(b); });
    if(!notesBrutes.length) return alert("Aucune note"); let fixe = bulletinFixePourEleve(notesBrutes); let el = mesEleves.find(e=>normaliser(e.enfant)===normaliser(nom)) || {enfant:nom, tel:""}; let moy = fixe.moy.toFixed(2);
    let t = `BULLETIN - كشف الدرجات - ${monEcoleNom}\n${NOM_ECOLE_AR}\nÉlève : ${el.enfant}\n${tr} - ${fixe.nbFixe} matière(s) FIXE(S) - ${libelleTypeComposition()} - Absent = 0\n\n`;
    fixe.lignes.forEach(b=>{ let aff = affMatiereTexte(b.matiere, b.matiereAr); if(!b.aCompose) t += `${aff} : Absent = 0\n`; else if(typeComposition==="oral") t += `${aff} : Oral ${b.oral} = ${Number(b.moyenne).toFixed(2)}\n`; else if(typeComposition==="ecrit") t += `${aff} : Écrit ${b.ecrit} = ${Number(b.moyenne).toFixed(2)}\n`; else t += `${aff} : Oral ${b.oral} - Écrit ${b.ecrit} = ${Number(b.moyenne).toFixed(2)}\n`; });
    t += `\nMOYENNE : ${moy} / 20 (Total / ${fixe.nbFixe})`;
    if(el.tel) window.open(`https://wa.me/237${nettoyerTel(el.tel)}?text=${encodeURIComponent(t)}`,'_blank'); else window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank');
  }catch(e){ alert("Erreur"); }
}

// ===== PRESENCE - CORRIGE : HISTORIQUE AVEC NOMS =====
async function chargerPresence(){ await chargerElevesGestion(false); let date = document.getElementById('datePresence').value || new Date().toISOString().slice(0,10); let snap = await db.collection("presences").where("ecoleNom","==",monEcoleNom).get(); let deja = {}; snap.forEach(d=>{ let p = d.data(); if(p.date===date) deja[normaliser(p.eleve)] = p.present; }); let h = `<table class="table-blanc"><tr><th>N</th><th>Nom</th><th>Classe</th><th>Présence - الحضور</th><th>Signature</th></tr>`; mesEleves.filter(e=>statutInscriptionEleve(e).type==='accepte').forEach((e,i)=>{ let co = deja[normaliser(e.enfant)]!==false; h += `<tr><td>${i+1}</td><td><b>${e.enfant}</b></td><td>${e.niveau}</td><td><label class="no-print"><input type="checkbox" data-eleve="${e.enfant}" ${co?'checked':''} style="width:20px;height:20px"> Présent</label></td><td>__________</td></tr>`; }); h += `</table>`; document.getElementById('listePresence').innerHTML = h; let parDate = {}; snap.forEach(d=>{ let p = d.data(); if(!parDate[p.date]) parDate[p.date] = []; parDate[p.date].push(p); }); let hh = "<table class='table-blanc'><tr><th>Date</th><th>Présents - Noms</th><th>Absents - Noms</th></tr>"; Object.keys(parDate).sort().reverse().slice(0,10).forEach(dt=>{ let l = parDate[dt]; let pres = l.filter(x=>x.present).map(x=>x.eleve); let abs = l.filter(x=>!x.present).map(x=>x.eleve); hh += `<tr><td><b>${dt}</b><br><small>${pres.length} présents / ${abs.length} absents</small></td><td>${pres.length?pres.map(n=>"<b>"+n+"</b>").join("<br>"):"Aucun"}</td><td>${abs.length?abs.map(n=>"<b>"+n+"</b>").join("<br>"):"Aucun"}</td></tr>`; }); hh += `</table>`; document.getElementById('historiquePresence').innerHTML = hh; majTitresFeuilles(); }
async function sauvegarderPresence(){ let date = document.getElementById('datePresence').value; if(!date) return alert("Choisis la date"); let checks = document.querySelectorAll('#listePresence input[type="checkbox"]'); let snap = await db.collection("presences").where("ecoleNom","==",monEcoleNom).get(); for(let doc of snap.docs){ let p = doc.data(); if(p.date===date) await db.collection("presences").doc(doc.id).delete(); } for(let c of checks){ await db.collection("presences").add({ecoleNom:monEcoleNom, date, eleve:c.getAttribute('data-eleve'), present:c.checked, dateEnregistrement:new Date().toISOString()}); } alert("Présence enregistrée !"); chargerPresence(); }
function partagerPresenceWhatsApp(){ let date = document.getElementById('datePresence').value || new Date().toLocaleDateString('fr-FR'); let checks = document.querySelectorAll('#listePresence input[type="checkbox"]'); let pr = [], ab = []; checks.forEach(c=>{ if(c.checked) pr.push(c.getAttribute('data-eleve')); else ab.push(c.getAttribute('data-eleve')); }); let t = `PRÉSENCE - الحضور - ${monEcoleNom}\n${date}\n\nPrésents (${pr.length}) :\n${pr.map(n=>"- "+n).join("\n")}\n\nAbsents (${ab.length}) :\n${ab.length ? ab.map(n=>"- "+n).join("\n") : "Aucun"}`; window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank'); }
function telechargerPresencePDF(){ if(!mesEleves.length) return alert("Aucun élève"); try{ let date = document.getElementById('datePresence').value || new Date().toISOString().slice(0,10); let doc = nouveauPDF(), y = 15; doc.setTextColor(0,0,0); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(enleverAccents("INSTITUT NOUROUL IYMANE"),105,12,{align:"center"}); doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(enleverAccents("PRESENCE - "+monEcoleNom+" - "+date),105,22,{align:"center"}); y = 32; mesEleves.forEach((e,i)=>{ let c = document.querySelector(`#listePresence input[data-eleve="${e.enfant}"]`); let st = c ? (c.checked ? "Present" : "Absent") : "Present"; doc.text(enleverAccents((i+1)+". "+e.enfant+" - "+st),12,y); y+=6; if(y>280){ doc.addPage(); y=15; } }); doc.save("Presence-"+date+".pdf"); alert("Téléchargé !"); }catch(e){ ouvrirPresenceNouvelOnglet(); } }
function ouvrirPresenceNouvelOnglet(){ let date = document.getElementById('datePresence').value || new Date().toLocaleDateString('fr-FR'); let lignes = mesEleves.map((e,i)=>{ let c = document.querySelector(`#listePresence input[data-eleve="${e.enfant}"]`); let pr = c ? (c.checked ? "Présent" : "Absent") : "Présent"; return `<tr><td>${i+1}</td><td><b>${e.enfant}</b></td><td>${e.niveau}</td><td>${pr}</td><td>____</td></tr>`; }).join(''); ouvrirHTMLDansNouvelOnglet("Presence", `<h2 style="text-align:center">PRÉSENCE - الحضور - ${monEcoleNom} - ${date}</h2><div dir="rtl" style="text-align:center;font-size:18px;font-weight:bold;">${NOM_ECOLE_AR}</div><table><tr><th>N</th><th>Nom</th><th>Classe</th><th>Présence</th><th>Signature</th></tr>${lignes}</table>`); }

// ===== BILAN ANNUEL =====
async function calculerBilanAnnuel(){
  try{
    await chargerElevesGestion(false); await chargerEnseignants(false); let snap = await db.collection("bulletins").where("ecoleNom","==",monEcoleNom).get();
    let par = {}; mesEleves.forEach(e=>{ if(statutInscriptionEleve(e).type==='accepte') par[e.enfant] = {nom:e.enfant, niveau:e.niveau, t1:null, t2:null, t3:null}; });
    let gr = {}; snap.forEach(d=>{ let b = d.data(); if(!matieresActivesIds.includes(b.matiereId)) return; let k = b.eleve+"||"+(b.trimestre||"Trimestre 1"); if(!gr[k]) gr[k] = {eleve:b.eleve, trimestre:b.trimestre||"Trimestre 1", notes:[]}; gr[k].notes.push(b); });
    Object.values(gr).forEach(g=>{ let fixe = bulletinFixePourEleve(g.notes); let moy = fixe.moy; if(!par[g.eleve]) par[g.eleve] = {nom:g.eleve, niveau:"", t1:null, t2:null, t3:null}; if(g.trimestre==="Trimestre 1") par[g.eleve].t1 = moy; if(g.trimestre==="Trimestre 2") par[g.eleve].t2 = moy; if(g.trimestre==="Trimestre 3") par[g.eleve].t3 = moy; });
    let liste = Object.values(par).map(e=>{ let vals = [e.t1, e.t2, e.t3].filter(v=>v!==null); let ma = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0; return {...e, moyenneAnnuelle:ma, nbTrimestres:vals.length, decision:decisionAnnuelle(ma), mention:mentionPour(ma)}; });
    liste.sort((a,b)=>b.moyenneAnnuelle-a.moyenneAnnuelle); liste.forEach((e,i)=>e.rangAnnuel=i+1);
    let enc = mesPaiements.reduce((s,p)=>s+Number(p.montant||0),0); let att = fraisTotalEcole * mesEleves.filter(e=>statutInscriptionEleve(e).type==='accepte').length; let resteE = Math.max(0, att-enc); let salTot = mesEnseignants.reduce((s,e)=>s+Number(e.salaire||0),0); let payEns = mesPaiementsEnseignants.reduce((s,p)=>s+Number(p.montant||0),0); let resteEns = Math.max(0, salTot-payEns);
    let nbA = liste.filter(e=>e.moyenneAnnuelle>=10 && e.nbTrimestres>0).length; let nbR = liste.filter(e=>e.moyenneAnnuelle<10 && e.nbTrimestres>0).length; let avec = liste.filter(e=>e.nbTrimestres>0); let moyE = avec.length ? avec.reduce((s,e)=>s+e.moyenneAnnuelle,0)/avec.length : 0; let meilleur = liste[0] || null;
    dernierBilanAnnuel = {listeAnnuelle:liste, totalEncaisseEleves:enc, totalAttenduEleves:att, totalResteEleves:resteE, totalSalaireEnseignants:salTot, totalPayeEnseignants:payEns, totalResteEnseignants:resteEns, nbAdmis:nbA, nbRedouble:nbR, moyenneGeneraleEcole:moyE, meilleur};
    document.getElementById('zoneBilanEcole').innerHTML = `<table class="table-blanc"><tr><th colspan="2">Bilan - 2026-2027 - ${getMatieresActives().length} matières FIXES - ${libelleTypeComposition()}</th></tr><tr><td>Élèves acceptés DG</td><td><b>${mesEleves.filter(e=>statutInscriptionEleve(e).type==='accepte').length}</b></td></tr><tr><td>En attente DG</td><td><b>${mesEleves.filter(e=>statutInscriptionEleve(e).type==='attente').length}</b></td></tr><tr><td>Enseignants</td><td><b>${mesEnseignants.length}</b></td></tr><tr><td>Moyenne générale</td><td><b>${moyE.toFixed(2)} / 20</b></td></tr><tr><td>Meilleur élève</td><td><b>${meilleur ? meilleur.nom+" - "+meilleur.moyenneAnnuelle.toFixed(2) : "Aucun"}</b></td></tr><tr><td>Admis</td><td><b>${nbA}</b></td></tr><tr><td>Redoublent</td><td><b>${nbR}</b></td></tr><tr><td>Total attendu</td><td><b>${att} FCFA</b></td></tr><tr><td>Total encaissé</td><td><b>${enc} FCFA</b></td></tr><tr><td>Reste à encaisser</td><td><b>${resteE} FCFA</b></td></tr><tr><td>Payé enseignants</td><td><b>${payEns} FCFA</b></td></tr><tr><td>Reste enseignants</td><td><b>${resteEns} FCFA</b></td></tr></table>`;
    let h = `<table class="table-blanc"><tr><th>Rang</th><th>Nom</th><th>Classe</th><th>T1</th><th>T2</th><th>T3</th><th>Moy. Annuelle</th><th>Décision</th><th class="no-print">Actions</th></tr>`;
    liste.forEach(e=>{ h += `<tr><td>#${e.rangAnnuel}</td><td><b>${e.nom}</b></td><td>${e.niveau}</td><td>${e.t1!==null?e.t1.toFixed(2):"-"}</td><td>${e.t2!==null?e.t2.toFixed(2):"-"}</td><td>${e.t3!==null?e.t3.toFixed(2):"-"}</td><td><b>${e.moyenneAnnuelle.toFixed(2)} / 20</b></td><td><b>${e.nbTrimestres===0?"-":e.decision}</b></td><td class="no-print"><a class="lien-action" onclick="imprimerBulletinAnnuelEleve('${e.nom}')">Voir</a> <a class="lien-action" onclick="partagerBulletinAnnuelWhatsApp('${e.nom}')">WhatsApp</a></td></tr>`; });
    h += `</table>`; document.getElementById('listeBulletinsAnnuels').innerHTML = h;
  }catch(e){ alert("Erreur bilan : "+e.message); }
}
function telechargerBilanAnnuelPDF(){ if(!dernierBilanAnnuel) return alert("Clique Voir le bilan"); try{ let doc = nouveauPDF(), b = dernierBilanAnnuel, y = 15; doc.setTextColor(27,94,32); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(enleverAccents("INSTITUT NOUROUL IYMANE"),105,12,{align:"center"}); doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(enleverAccents("BILAN ANNUEL - "+monEcoleNom),105,22,{align:"center"}); y = 32; doc.setFont("helvetica","bold"); doc.text(enleverAccents("Acceptes : "+mesEleves.filter(e=>statutInscriptionEleve(e).type==='accepte').length+" - Admis : "+b.nbAdmis+" - Redoublent : "+b.nbRedouble),12,y); y+=7; doc.text(enleverAccents("Encaisse : "+b.totalEncaisseEleves+" - Reste : "+b.totalResteEleves),12,y); y+=8; doc.setFont("helvetica","normal"); b.listeAnnuelle.forEach(e=>{ doc.text(enleverAccents("#"+e.rangAnnuel+" "+e.nom+" - Moy "+e.moyenneAnnuelle.toFixed(2)+" - "+e.decision),12,y); y+=6; }); doc.save("Bilan-Annuel.pdf"); alert("Téléchargé !"); }catch(e){ ouvrirBilanAnnuelNouvelOnglet(); } }
function ouvrirBilanAnnuelNouvelOnglet(){ if(!dernierBilanAnnuel) return; let b = dernierBilanAnnuel; let lignes = b.listeAnnuelle.map(e=>`<tr><td>#${e.rangAnnuel}</td><td><b>${e.nom}</b></td><td>${e.t1!==null?e.t1.toFixed(2):"-"}</td><td>${e.t2!==null?e.t2.toFixed(2):"-"}</td><td>${e.t3!==null?e.t3.toFixed(2):"-"}</td><td><b>${e.moyenneAnnuelle.toFixed(2)}</b></td><td>${e.decision}</td></tr>`).join(''); ouvrirHTMLDansNouvelOnglet("Bilan-Annuel", `<h2 style="text-align:center">BILAN ANNUEL - ${monEcoleNom}</h2><div dir="rtl" style="text-align:center;font-size:18px;font-weight:bold;">${NOM_ECOLE_AR}</div><table><tr><th>Rang</th><th>Nom</th><th>T1</th><th>T2</th><th>T3</th><th>Moy</th><th>Décision</th></tr>${lignes}</table>`); }
function partagerBilanAnnuelWhatsApp(){ if(!dernierBilanAnnuel) return; let b = dernierBilanAnnuel; let t = `BILAN ANNUEL - ${monEcoleNom}\nAdmis : ${b.nbAdmis} - Redoublent : ${b.nbRedouble}\nEncaissé : ${b.totalEncaisseEleves} - Reste : ${b.totalResteEleves}\n\n`; b.listeAnnuelle.forEach(e=>{ t += `#${e.rangAnnuel} ${e.nom} - ${e.moyenneAnnuelle.toFixed(2)} - ${e.decision}\n`; }); window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank'); }
async function imprimerBulletinAnnuelEleve(nom){ if(!dernierBilanAnnuel) await calculerBilanAnnuel(); let e = dernierBilanAnnuel.listeAnnuelle.find(x=>x.nom===nom); if(!e) return; let html = `<div class="bulletin-page"><div class="b-head"><h2>INSTITUT NOUROUL IYMANE</h2><div dir="rtl" style="font-size:20px;font-weight:bold;">${NOM_ECOLE_AR}</div><p>Yaoundé - 2026-2027 - BULLETIN ANNUEL - كشف الدرجات السنوي</p></div><div class="b-infos"><div>Nom<br><b>${e.nom}</b></div><div>Classe<br><b>${e.niveau}</b></div><div>Rang<br><b>#${e.rangAnnuel}</b></div><div>Décision<br><b>${e.decision}</b></div></div><table><tr><th>Trimestre - الفصل</th><th style="text-align:center">Moyenne</th></tr><tr><td>T1</td><td style="text-align:center">${e.t1!==null?e.t1.toFixed(2)+" / 20":"-"}</td></tr><tr><td>T2</td><td style="text-align:center">${e.t2!==null?e.t2.toFixed(2)+" / 20":"-"}</td></tr><tr><td>T3</td><td style="text-align:center">${e.t3!==null?e.t3.toFixed(2)+" / 20":"-"}</td></tr></table><div class="b-total"><span>MOYENNE ANNUELLE : ${e.moyenneAnnuelle.toFixed(2)} / 20</span><span>${e.mention}</span></div><div class="b-app">Décision : ${e.decision}</div><div class="b-sign"><div>Le Directeur<br><br>__________________</div><div>Le Parent<br><br>__________________</div></div></div>`; let zone = document.getElementById('zoneImpression'); zone.style.display = 'block'; zone.innerHTML = html + `<div style="text-align:center;margin-top:12px" class="no-print"><button onclick="telechargerBulletinAnnuelPDF('${e.nom}')" class="btn-noir">TÉLÉCHARGER - 1 PAGE</button><br><br><button onclick="document.getElementById('zoneImpression').style.display='none'" style="background:white;border:1px solid #ccc;padding:10px 20px;border-radius:10px">Fermer</button></div>`; zone.scrollIntoView({behavior:'smooth'}); }
function telechargerBulletinAnnuelPDF(nom){ if(!dernierBilanAnnuel) return; let e = dernierBilanAnnuel.listeAnnuelle.find(x=>x.nom===nom); if(!e) return; try{ let doc = nouveauPDF(); doc.setFillColor(165,214,167); doc.rect(0,0,210,24,"F"); doc.setTextColor(27,94,32); doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.text(enleverAccents("INSTITUT NOUROUL IYMANE"),105,10,{align:"center"}); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text(enleverAccents("BULLETIN ANNUEL - "+monEcoleNom),105,17,{align:"center"}); doc.setTextColor(0,0,0); let y = 35; doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text(enleverAccents("Eleve : "+e.nom),12,y); y+=8; doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.text(enleverAccents("Classe : "+e.niveau+" - Rang : #"+e.rangAnnuel),12,y); y+=10; doc.text(enleverAccents("T1 : "+(e.t1!==null?e.t1.toFixed(2):"-")+" - T2 : "+(e.t2!==null?e.t2.toFixed(2):"-")+" - T3 : "+(e.t3!==null?e.t3.toFixed(2):"-")),12,y); y+=10; doc.setFont("helvetica","bold"); doc.text(enleverAccents("MOYENNE : "+e.moyenneAnnuelle.toFixed(2)+" - "+e.decision),12,y); doc.save("Bulletin-Annuel-"+enleverAccents(e.nom).replace(/[^a-zA-Z0-9]/g,'-')+".pdf"); alert("Téléchargé - 1 page !"); }catch(err){ ouvrirBulletinAnnuelNouvelOnglet(nom); } }
function ouvrirBulletinAnnuelNouvelOnglet(nom){ let e = dernierBilanAnnuel.listeAnnuelle.find(x=>x.nom===nom); if(!e) return; ouvrirHTMLDansNouvelOnglet("Bulletin-Annuel", `<div class="bulletin-page"><div class="b-head"><h2>INSTITUT NOUROUL IYMANE</h2><div dir="rtl" style="font-size:20px;font-weight:bold;">${NOM_ECOLE_AR}</div><p>BULLETIN ANNUEL - كشف الدرجات السنوي - ${monEcoleNom}</p></div><div class="b-infos"><div>Nom<br><b>${e.nom}</b></div><div>Classe<br><b>${e.niveau}</b></div><div>Rang<br><b>#${e.rangAnnuel}</b></div><div>Décision<br><b>${e.decision}</b></div></div><table><tr><th>Trimestre</th><th>Moyenne</th></tr><tr><td>T1</td><td>${e.t1!==null?e.t1.toFixed(2):"-"}</td></tr><tr><td>T2</td><td>${e.t2!==null?e.t2.toFixed(2):"-"}</td></tr><tr><td>T3</td><td>${e.t3!==null?e.t3.toFixed(2):"-"}</td></tr></table><div class="b-total"><span>MOYENNE : ${e.moyenneAnnuelle.toFixed(2)}</span><span>${e.decision}</span></div></div>`); }
function partagerBulletinAnnuelWhatsApp(nom){ if(!dernierBilanAnnuel) return; let e = dernierBilanAnnuel.listeAnnuelle.find(x=>x.nom===nom); if(!e) return; let el = mesEleves.find(x=>normaliser(x.enfant)===normaliser(nom)) || {enfant:nom, tel:""}; let t = `BULLETIN ANNUEL - كشف الدرجات السنوي - ${monEcoleNom}\nÉlève : ${e.nom}\nT1 : ${e.t1!==null?e.t1.toFixed(2):"-"} - T2 : ${e.t2!==null?e.t2.toFixed(2):"-"} - T3 : ${e.t3!==null?e.t3.toFixed(2):"-"}\nMOYENNE : ${e.moyenneAnnuelle.toFixed(2)} - ${e.decision}`; if(el.tel) window.open(`https://wa.me/237${nettoyerTel(el.tel)}?text=${encodeURIComponent(t)}`,'_blank'); else window.open(`https://wa.me/?text=${encodeURIComponent(t)}`,'_blank'); }

// ===== PDF LISTES =====
function telechargerListeElevesPDF(){ if(!mesEleves.length) return alert("Aucun élève"); try{ let doc = nouveauPDF(), y = 15; doc.setTextColor(0,0,0); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(enleverAccents("INSTITUT NOUROUL IYMANE"),105,12,{align:"center"}); doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(enleverAccents("LISTE - "+monEcoleNom),105,22,{align:"center"}); y = 32; mesEleves.forEach((e,i)=>{ let s = calculerSoldeEleve(e.enfant), ins = statutInscriptionEleve(e); doc.text(enleverAccents((i+1)+". "+e.enfant+" - "+ins.label+" - "+s.statut+" - Paye "+s.totalPaye+" - Reste "+s.reste),12,y); y+=6; }); doc.save("Liste-Eleves.pdf"); alert("Téléchargé !"); }catch(e){ ouvrirListeElevesNouvelOnglet(); } }
function ouvrirListeElevesNouvelOnglet(){ let lignes = mesEleves.map((e,i)=>{ let s = calculerSoldeEleve(e.enfant), ins = statutInscriptionEleve(e); return `<tr><td>${i+1}</td><td><b>${e.enfant}</b></td><td>${e.niveau}</td><td>${ins.label}</td><td>${s.statut}</td><td>${s.totalPaye}</td><td>${s.reste}</td></tr>`; }).join(''); ouvrirHTMLDansNouvelOnglet("Liste-Eleves", `<h2 style="text-align:center">LISTE - ${monEcoleNom}</h2><div dir="rtl" style="text-align:center;font-size:18px;font-weight:bold;">${NOM_ECOLE_AR}</div><table><tr><th>N</th><th>Nom</th><th>Classe</th><th>Inscription</th><th>Paiement</th><th>Payé</th><th>Reste</th></tr>${lignes}</table>`); }
function telechargerPaiementsPDF(){ if(!mesPaiements.length) return alert("Aucun paiement"); try{ let doc = nouveauPDF(), y = 15; doc.setTextColor(0,0,0); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(enleverAccents("INSTITUT NOUROUL IYMANE"),105,12,{align:"center"}); doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(enleverAccents("PAIEMENTS - "+monEcoleNom),105,22,{align:"center"}); y = 32; let tot = mesPaiements.reduce((s,p)=>s+Number(p.montant||0),0); doc.setFont("helvetica","bold"); doc.text(enleverAccents("Total : "+tot+" FCFA"),12,y); y+=8; doc.setFont("helvetica","normal"); mesEleves.forEach(e=>{ let s = calculerSoldeEleve(e.enfant), ins = statutInscriptionEleve(e); doc.text(enleverAccents(e.enfant+" - "+ins.label+" - "+s.statut+" - Paye "+s.totalPaye+" - Reste "+s.reste),12,y); y+=6; }); doc.save("Paiements.pdf"); alert("Téléchargé !"); }catch(e){ ouvrirPaiementsNouvelOnglet(); } }
function ouvrirPaiementsNouvelOnglet(){ let tot = mesPaiements.reduce((s,p)=>s+Number(p.montant||0),0); let lignes = mesEleves.map(e=>{ let s = calculerSoldeEleve(e.enfant), ins = statutInscriptionEleve(e); return `<tr><td><b>${e.enfant}</b></td><td>${ins.label}</td><td>${s.statut}</td><td>${s.totalPaye}</td><td>${s.reste}</td></tr>`; }).join(''); ouvrirHTMLDansNouvelOnglet("Paiements", `<h2 style="text-align:center">PAIEMENTS - الدفع - ${monEcoleNom} - Total ${tot} FCFA</h2><table><tr><th>Élève</th><th>Inscription</th><th>Paiement</th><th>Payé</th><th>Reste</th></tr>${lignes}</table>`); }
function telechargerHistoriquePaiementsPDF(){ if(!mesPaiements.length) return alert("Aucun paiement"); try{ let doc = nouveauPDF(), y = 15; doc.setTextColor(0,0,0); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(enleverAccents("INSTITUT NOUROUL IYMANE"),105,12,{align:"center"}); doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(enleverAccents("HISTORIQUE PAIEMENTS - "+monEcoleNom),105,22,{align:"center"}); y = 32; mesPaiements.forEach((p,i)=>{ doc.text(enleverAccents((i+1)+". "+p.enfantNom+" - "+p.montant+" FCFA - "+(p.motif||"")+" - "+(p.datePaiement||"")),12,y); y+=6; if(y>280){ doc.addPage(); y=15; } }); doc.save("Historique-Paiements.pdf"); alert("Téléchargé !"); }catch(e){ alert("Erreur PDF"); } }
function telechargerBulletinsPDF(){ try{ db.collection("bulletins").where("ecoleNom","==",monEcoleNom).get().then(snap=>{ let doc = nouveauPDF(), y = 15; doc.setTextColor(0,0,0); doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text(enleverAccents("INSTITUT NOUROUL IYMANE"),105,12,{align:"center"}); doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(enleverAccents("BULLETINS FIXES - "+monEcoleNom+" - "+libelleTypeComposition()),105,22,{align:"center"}); y = 32; let groupes = {}; snap.forEach(d=>{ let b = d.data(); if(!matieresActivesIds.includes(b.matiereId)) return; let k = b.eleve+"||"+(b.trimestre||"Trimestre 1"); if(!groupes[k]) groupes[k] = {eleve:b.eleve, trimestre:b.trimestre, notes:[]}; groupes[k].notes.push(b); }); Object.values(groupes).forEach(g=>{ let fixe = bulletinFixePourEleve(g.notes); doc.text(enleverAccents(g.eleve+" - "+g.trimestre+" - Moy "+fixe.moy.toFixed(2)+" / 20 - sur "+fixe.nbFixe+" fixees"),12,y); y+=6; }); doc.save("Bulletins.pdf"); alert("Téléchargé !"); }); }catch(e){ alert("Erreur"); } }

// ===== CONNEXION CORRIGEE =====
function emailSD_DeDoc(doc){
  let data = doc.data() || {};
  let v = data.sousDirecteurEmail || data.sousDirecteur || data.sous_directeur || data.emailSousDirecteur || data.ecSousDirecteur || data.email || "";
  return String(v||"").trim().toLowerCase();
}
async function seConnecterGestion(){
  let e = document.getElementById('email').value.trim();
  let p = document.getElementById('password').value;
  if(!e || !p){ document.getElementById('msg').textContent = "❌ Mets Email et Mot de passe"; return; }
  try{ await authG.signInWithEmailAndPassword(e,p); }
  catch(err){
    if(err.code==="auth/invalid-credential" || err.code==="auth/user-not-found" || err.code==="auth/wrong-password"){
      document.getElementById('msg').textContent = "❌ Email ou mot de passe faux. Vérifie dans Firebase > Authentication que ce compte existe.";
    } else {
      document.getElementById('msg').textContent = "Erreur : "+err.code;
    }
  }
}
function seDeconnecterGestion(){ authG.signOut(); }
authG.onAuthStateChanged(async u=>{
  if(!u){ document.getElementById('loginCard').style.display = 'block'; document.getElementById('gestionPanel').style.display = 'none'; return; }
  document.getElementById('loginCard').style.display = 'none'; document.getElementById('gestionPanel').style.display = 'block'; document.getElementById('gestionEmail').textContent = u.email;
  monEcoleId = ""; monEcoleNom = "";
  let email = u.email.trim().toLowerCase();
  let snapE = await db.collection("ecoles").get();
  snapE.forEach(d=>{ if(emailSD_DeDoc(d)===email){ monEcoleId = d.id; monEcoleNom = d.data().nom; } });
  if(!monEcoleId){
    let snapG = await db.collection("groupes").get();
    snapG.forEach(d=>{ if(emailSD_DeDoc(d)===email){ monEcoleId = d.id; monEcoleNom = d.data().nom; } });
  }
  if(!monEcoleNom){ alert("Connexion OK, mais aucune école trouvée pour : "+email+"\n\nVérifie dans Admin > Ecoles que l'email du Sous-Directeur est bien : "+email); }
  document.getElementById('monEcoleNom').textContent = monEcoleNom || "Aucune école";
  let dp = document.getElementById('datePresence'); if(dp && !dp.value) dp.value = new Date().toISOString().slice(0,10);
  await chargerFraisTotal(); await chargerConfigMatieres();
  try{ if(typeof publierMatieresPourSousDirecteur === "function") await publierMatieresPourSousDirecteur(); }catch(e){ console.log("Re-publish matières:", e.message); }
  chargerDashboard(); majTitresFeuilles(); setTimeout(installerBoutonsListes, 500);
});
document.getElementById('datePresence')?.addEventListener('change', chargerPresence);

// ===== TOUT EFFACER - REMETTRE A ZERO - GESTION =====
async function effacerHistoriquePresence(){
  if(!confirm("Effacer TOUT l'historique de présence de "+monEcoleNom+" ?\n\nÇa va ramener à zéro. On ne peut pas revenir en arrière.")) return;
  if(!confirm("Tu es sûr sûr ? Clique OK pour effacer.")) return;
  try{
    let snap = await db.collection("presences").where("ecoleNom","==",monEcoleNom).get();
    for(let doc of snap.docs){ await db.collection("presences").doc(doc.id).delete(); }
    alert("✅ Historique de présence effacé. C'est à zéro maintenant.");
    chargerPresence();
  }catch(e){ alert("❌ "+e.message); }
}
async function effacerHistoriquePaiements(){
  if(!confirm("Effacer TOUT l'historique des paiements de "+monEcoleNom+" ?\n\nLes élèves vont redevenir NON PAYÉ. Tu es sûr ?")) return;
  if(!confirm("Dernière confirmation : effacer tous les paiements ?")) return;
  try{
    let snap = await db.collection("paiements").where("ecoleNom","==",monEcoleNom).get();
    for(let doc of snap.docs){ await db.collection("paiements").doc(doc.id).delete(); }
    alert("✅ Historique des paiements effacé. C'est à zéro.");
    chargerPaiementsGestion(); chargerElevesGestion();
  }catch(e){ alert("❌ "+e.message); }
}
async function effacerHistoriqueBulletins(){
  if(!confirm("Effacer TOUS les bulletins de "+monEcoleNom+" ?\n\nTrimestre 1, 2, 3 - Tout va partir.")) return;
  if(!confirm("Dernière confirmation : effacer tous les bulletins ?")) return;
  try{
    let snap = await db.collection("bulletins").where("ecoleNom","==",monEcoleNom).get();
    for(let doc of snap.docs){ await db.collection("bulletins").doc(doc.id).delete(); }
    alert("✅ Tous les bulletins effacés. C'est à zéro.");
    chargerBulletins();
  }catch(e){ alert("❌ "+e.message); }
}
async function effacerHistoriquePaiementsEnseignants(){
  if(!confirm("Effacer tous les paiements des enseignants ?")) return;
  try{
    let snap = await db.collection("paiementsEnseignants").where("ecoleNom","==",monEcoleNom).get();
    for(let doc of snap.docs){ await db.collection("paiementsEnseignants").doc(doc.id).delete(); }
    alert("✅ Paiements enseignants effacés.");
    chargerEnseignants();
  }catch(e){ alert("❌ "+e.message); }
}
async function effacerToutHistorique(){
  if(!confirm("⚠️ ATTENTION ⚠️\n\nTu veux TOUT effacer d'un coup ?\n- Présence\n- Paiements élèves\n- Bulletins\n\nTon école va redevenir à ZÉRO.")) return;
  let code = prompt("Pour être sûr, écris : EFFACER");
  if(!code || code.trim().toUpperCase() !== "EFFACER"){ alert("Annulé. Tu n'as pas écrit EFFACER."); return; }
  try{
    let c1 = await db.collection("presences").where("ecoleNom","==",monEcoleNom).get();
    for(let doc of c1.docs){ await db.collection("presences").doc(doc.id).delete(); }
    let c2 = await db.collection("paiements").where("ecoleNom","==",monEcoleNom).get();
    for(let doc of c2.docs){ await db.collection("paiements").doc(doc.id).delete(); }
    let c3 = await db.collection("bulletins").where("ecoleNom","==",monEcoleNom).get();
    for(let doc of c3.docs){ await db.collection("bulletins").doc(doc.id).delete(); }
    let c4 = await db.collection("paiementsEnseignants").where("ecoleNom","==",monEcoleNom).get();
    for(let doc of c4.docs){ await db.collection("paiementsEnseignants").doc(doc.id).delete(); }
    alert("✅ TOUT est effacé. Ton école est à ZÉRO maintenant.");
    chargerDashboard(); chargerElevesGestion(); chargerPaiementsGestion(); chargerBulletins(); chargerPresence();
  }catch(e){ alert("❌ "+e.message); }
}

// ===== DIVERS / PUBLICATION - POUR ACCUEIL - CORRESPOND AU HTML CORRIGE =====
let mesDivers = [];
async function publierDivers(){
  let titreEl = document.getElementById('diversTitre');
  let texteEl = document.getElementById('diversTexte');
  let titre = (titreEl?.value||"").trim();
  let texte = (texteEl?.value||"").trim();
  if(!titre && !texte) return alert("Écris un titre ou un message Divers.");
  try{
    await db.collection("annonces").add({ecoleNom:monEcoleNom, ecoleId:monEcoleId||"", titre:titre||"Divers", texte:texte, message:texte, type:"divers", date:new Date().toISOString(), dateAffichage:new Date().toISOString().slice(0,10)});
    alert("✅ Divers publié ! Ça va s'afficher à l'accueil.");
    if(titreEl) titreEl.value = ""; if(texteEl) texteEl.value = "";
    chargerDivers();
  }catch(e){ alert("❌ "+e.message); }
}
async function chargerDivers(){
  try{
    let snap = await db.collection("annonces").where("ecoleNom","==",monEcoleNom).get();
    mesDivers = []; snap.forEach(d=>mesDivers.push({id:d.id, ...d.data()}));
    let zone = document.getElementById('listeDivers'); if(!zone) return;
    if(!mesDivers.length){ zone.innerHTML = "Aucun Divers publié."; return; }
    mesDivers.sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    zone.innerHTML = mesDivers.map(d=>`<div style="background:#FFF9C4;border:1px solid #FFE082;padding:10px;border-radius:10px;margin:6px 0"><b>${d.titre||"Divers"}</b><br><small>${d.dateAffichage||""}</small><br>${d.texte||d.message||""}<br><a class="lien-action" onclick="supprimerDivers('${d.id}')">Supprimer</a></div>`).join('');
  }catch(e){}
}
async function supprimerDivers(id){ if(!confirm("Supprimer ce Divers ?")) return; await db.collection("annonces").doc(id).delete(); chargerDivers(); }

