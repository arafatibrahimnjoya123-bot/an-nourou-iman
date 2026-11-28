// GESTION - Institut Nouroul Iymane - VERSION CORRIGEE SEULEMENT - Prix = Gestion > Paramètres
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
let prixParEcole = {};
let prixSecoursGlobal = 0;
let mesRemises = [];
let TOUTES_ECOLES_GROUPES = [];
let GESTION_DEPENSES = [];

function normaliser(t) {
  return String(t || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function cleEcolePrix(nom) {
  return (nom || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_");
}
function syncFraisTotal() {
  fraisTotalEcole = Number(fraisTotal || 0);
}
function syncMesListes() {
  mesEleves = TOUS_ELEVES_GESTION;
  mesPaiements = TOUS_PAIEMENTS_GESTION;
}
function nomEcoleDeEleveSimple(e) {
  return e.ecoleNom || e.ecole || e.groupeNom || e.groupe || monEcoleNom || "";
}
function ecoleDeEleveBulletin(nomEleve) {
  let e = TOUS_ELEVES_GESTION.find(function(x) {
    return normaliser(x.enfant || x.nomEnfant || "") === normaliser(nomEleve);
  });
  if (e) return e.ecole || e.ecoleNom || e.groupe || e.groupeNom || "";
  return "";
}
function statutPaiementValide(p) {
  let st = String(p.statut || p.statutPaiement || p.status || "").toLowerCase().trim();
  if (!st) return true;
  if (st === "annule" || st === "annulé" || st === "refuse" || st === "refusé" || st === "supprime" || st === "supprimé") return false;
  return true;
}
const NOM_ECOLE_AR = "معهد نور الإيمان";
const MATIERES_AR = {"Coran":"القرآن","Hadith":"الحديث","Aquida":"العقيدة","Fiqh":"الفقه","Langue Arabe":"اللغة العربية","Sirah":"السيرة","Tawhid":"التوحيد","Adhab":"الآداب","Mémorisation":"الحفظ","Lecture":"القراءة","Écriture":"الكتابة","Mathématiques":"الرياضيات","Français":"الفرنسية"};
const MATIERES_EN = {"Coran":"Quran","Hadith":"Hadith","Aquida":"Aqeedah","Fiqh":"Fiqh","Langue Arabe":"Arabic Language","Sirah":"Seerah","Tawhid":"Tawhid","Adhab":"Manners","Mémorisation":"Memorization","Lecture":"Reading","Écriture":"Writing","Mathématiques":"Mathematics","Français":"French"};
const MATIERES_ISLAMIQUES = [
  {id:"coran",fr:"Coran",ar:"القرآن",desc:"Mémorisation et récitation du Coran"},
  {id:"hadith",fr:"Hadith",ar:"الحديث",desc:"Paroles du Prophète ﷺ"},
  {id:"aqida",fr:"Aquida",ar:"العقيدة",desc:"Croyance islamique"},
  {id:"fiqh",fr:"Fiqh",ar:"الفقه",desc:"Jurisprudence islamique"},
  {id:"arabe",fr:"Langue Arabe",ar:"اللغة العربية",desc:"Lecture, écriture et grammaire arabe"},
  {id:"sira",fr:"Sirah",ar:"السيرة",desc:"Vie du Prophète ﷺ"},
  {id:"tawhid",fr:"Tawhid",ar:"التوحيد",desc:"Unicité d'Allah"},
  {id:"adhab",fr:"Adhab",ar:"الآداب",desc:"Comportement et bonnes manières"},
  {id:"memo",fr:"Mémorisation",ar:"الحفظ",desc:"Mémorisation Coran / Hadith"},
  {id:"lecture",fr:"Lecture",ar:"القراءة",desc:"Lecture arabe / français"},
  {id:"ecriture",fr:"Écriture",ar:"الكتابة",desc:"Écriture arabe / français"},
  {id:"maths",fr:"Mathématiques",ar:"الرياضيات",desc:"Calcul et mathématiques"},
  {id:"francais",fr:"Français",ar:"الفرنسية",desc:"Langue française"}
];
function nettoyerTelGestion(t) {
  if (!t) return "";
  return String(t).replace(/[\s\-\+]/g, "").replace(/^237/, "");
}
function nettoyerEmailGestion(e) {
  return String(e || "").toLowerCase().trim();
}
function nomMatiereBilingue(fr) {
  return fr + (MATIERES_AR[fr] ? " - " + MATIERES_AR[fr] : "");
}
function getMatieresActives() {
  return MATIERES_ISLAMIQUES.filter(function(m) { return matieresActivesIds.includes(m.id); });
}
function getNbMatieresFixees() {
  let n = getMatieresActives().length;
  return n > 0 ? n : 1;
}
function totalVraiNoteGestionJS(n){
  if(!n) return 0;
  let oral = Number(n.oral ?? n.noteOral ?? 0);
  let ecrit = Number(n.ecrit ?? n.noteEcrit ?? 0);
  let devoir = Number(n.devoir ?? n.noteDevoir ?? 0);
  let compo = Number(n.composition ?? n.noteComposition ?? n.examen ?? 0);
  let unique = Number(n.moyenne ?? n.note ?? n.total ?? n.noteUnique ?? 0);
  let mode = String(typeComposition || "Oral + Écrit").toLowerCase();
  if(mode.includes("devoir")){
    if(devoir>0 || compo>0) return Math.min(20, devoir + compo);
    if(unique>0) return Math.min(20, unique);
  }
  if(mode.includes("composition") && !mode.includes("devoir")){
    if(compo>0) return Math.min(20, compo);
    if(unique>0) return Math.min(20, unique);
    if(oral>0 || ecrit>0) return Math.min(20, oral + ecrit);
  }
  if(oral>0 || ecrit>0) return Math.min(20, oral + ecrit);
  return Math.min(20, unique);
}
function detailNoteGestionJS(n){
  if(!n) return "0 + 0";
  let oral = Number(n.oral ?? 0);
  let ecrit = Number(n.ecrit ?? 0);
  let devoir = Number(n.devoir ?? 0);
  let compo = Number(n.composition ?? 0);
  let mode = String(typeComposition || "Oral + Écrit").toLowerCase();
  if(mode.includes("devoir") && (devoir>0 || compo>0)) return devoir + " + " + compo;
  if(mode.includes("composition") && !mode.includes("devoir") && compo>0) return "" + compo;
  if(oral>0 || ecrit>0) return oral + " + " + ecrit;
  return "" + totalVraiNoteGestionJS(n);
}
function calculerMoyenneTrimestre(lignes) {
  if(!lignes || !lignes.length) return 0;
  let total = 0;
  lignes.forEach(function(l) { total += totalVraiNoteGestionJS(l); });
  return total / lignes.length;
}
function showTabGestion(id, btn) {
  ['tabDashboard','tabEleves','tabPaiements','tabEnseignants','tabBulletins','tabPresence','tabAnnuel','tabParametres','tabActivites'].forEach(function(x) {
    let el = document.getElementById(x);
    if (el) el.style.display = 'none';
  });
  let cible = document.getElementById(id);
  if (cible) cible.style.display = 'block';
  document.querySelectorAll('.gestion-tab').forEach(function(b) { b.classList.remove('actif'); });
  if (btn) btn.classList.add('actif');
  if (id === 'tabEleves') chargerElevesGestion();
  if (id === 'tabPaiements') chargerPaiementsGestion();
  if (id === 'tabEnseignants') chargerEnseignants();
  if (id === 'tabBulletins') chargerBulletins();
  if (id === 'tabPresence') chargerPresence();
  if (id === 'tabAnnuel') chargerBulletins();
  if (id === 'tabActivites') chargerActivitesDepenses();
  if (id === 'tabParametres') { afficherChoixMatieres(); chargerDivers(); }
}
function toggleMenuFlottant() {
  let m = document.getElementById('menuFlottant');
  if (m) m.style.display = (m.style.display === "block" ? "none" : "block");
}
function imprimerFeuilleActuelle() { window.print(); }
function telechargerPDFActuel() { window.print(); }
function partagerWhatsAppActuel() {
  let t = "Institut Nouroul Iymane - " + (monEcoleNom || "");
  window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank");
}
async function seConnecterGestion() {
  let email = nettoyerEmailGestion(document.getElementById('email').value);
  let password = document.getElementById('password').value;
  let msg = document.getElementById('msg');
  if (!email || !password) { msg.textContent = "❌ Mets Email et Mot de passe"; return; }
  msg.style.color = "#666";
  msg.textContent = "⏳ Vérification...";
  try {
    await auth.signInWithEmailAndPassword(email, password);
    emailSD = email; passwordSD = password;
    await chargerMonEcoleGestion(email);
  } catch (e) { msg.style.color = "red"; msg.textContent = "❌ " + e.message; }
}
function seDeconnecterGestion() {
  try { auth.signOut(); } catch (e) {}
  localStorage.removeItem("gestion_session");
  location.reload();
}
async function verifierRoleDirection(email) {
  try {
    let d0 = await db.collection("utilisateurs").doc(email).get();
    if (d0.exists) {
      let d = d0.data();
      let r = String(d.role || d.fonction || d.type || "").toLowerCase();
      if (r.includes("secretaire") || r.includes("secrétaire")) return "secretaire";
      if (r.includes("directeur") && !r.includes("sous")) return "directeur";
      if (r.includes("directeur")) return "directeur";
    }
  } catch (e) {}
  if (email.includes("directeur")) return "directeur";
  if (email.includes("secretaire") || email.includes("secret")) return "secretaire";
  return null;
}
async function chargerMonEcoleGestion(email) {
  let msg = document.getElementById('msg');
  try {
    let roleDirection = await verifierRoleDirection(email);
    let snap = await db.collection("ecoles").get();
    let trouve = null;
    snap.forEach(function(doc) {
      let d = doc.data();
      let em = nettoyerEmailGestion(d.sousDirecteurEmail || d.sousDirecteur || d.email || "");
      if (em === email) trouve = { id: doc.id, ...d };
    });
    if (!trouve) {
      let sg = await db.collection("groupes").get();
      sg.forEach(function(doc) {
        let d = doc.data();
        let em = nettoyerEmailGestion(d.sousDirecteurEmail || d.sousDirecteur || d.email || "");
        if (em === email) trouve = { id: doc.id, ...d };
      });
    }
    if (!roleDirection) {
      let s2 = await db.collection("ecoles").get();
      s2.forEach(function(doc) {
        let d = doc.data();
        let emD = nettoyerEmailGestion(d.directeurEmail || d.directeur || "");
        let emS = nettoyerEmailGestion(d.secretaireEmail || d.secretaire || "");
        if (emD === email) roleDirection = "directeur";
        if (emS === email) roleDirection = "secretaire";
      });
    }
    if (roleDirection) {
      monRoleGestion = roleDirection; modeToutesEcoles = true;
      monEcoleId = "TOUTES"; monEcoleNom = "TOUTES LES ÉCOLES"; monEcoleData = { nom: "TOUTES LES ÉCOLES" };
    } else if (trouve) {
      monRoleGestion = "sous-directeur"; modeToutesEcoles = false;
      monEcoleId = trouve.id; monEcoleNom = trouve.nom || "École"; monEcoleData = trouve;
    } else {
      msg.style.color = "red";
      msg.textContent = "❌ Email introuvable. Le Directeur doit d'abord te créer dans Admin -> Écoles.";
      return;
    }
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('gestionPanel').style.display = 'block';
    let labelRole = "👨‍💼 SOUS-DIRECTEUR - " + monEcoleNom;
    if (monRoleGestion === "directeur") labelRole = "👑 DIRECTEUR - Voit tout";
    if (monRoleGestion === "secretaire") labelRole = "📝 SECRÉTAIRE DU DIRECTEUR - Voit tout";
    document.getElementById('gestionEmail').textContent = email + " - " + labelRole;
    document.getElementById('topEcole').textContent = monEcoleNom + (modeToutesEcoles ? " (TOUT)" : "");
    document.getElementById('monEcoleNom').textContent = monEcoleNom;
    let mn2 = document.getElementById('monEcoleNom2');
    if (mn2) mn2.textContent = monEcoleNom;
    document.getElementById('dateJour').textContent = new Date().toLocaleDateString('fr-FR');
    localStorage.setItem("gestion_session", JSON.stringify({ email: email, ecoleId: monEcoleId, ecoleNom: monEcoleNom, role: monRoleGestion, toutes: modeToutesEcoles }));
    await chargerConfigMatieres();
    await chargerFraisTotal();
    try { await chargerToutLeNouveau(); } catch (e) {}
    chargerElevesGestion(); chargerPaiementsGestion(); chargerEnseignants(); chargerBulletins(); chargerPresence();
  } catch (e) { msg.textContent = "❌ " + e.message; }
}
function estAMoiGestion(d) {
  if (modeToutesEcoles) return true;
  if (monRoleGestion === "directeur" || monRoleGestion === "secretaire") return true;
  let e = String(d.ecole || d.ecoleNom || d.ecoleId || "").toLowerCase();
  let g = String(d.groupe || d.groupeNom || "").toLowerCase();
  let nom = String(monEcoleNom || "").toLowerCase();
  if (!nom || nom === "toutes les écoles") return true;
  if (!e && !g) return true;
  return e.includes(nom) || g.includes(nom) || nom.includes(e) || nom.includes(g);
}
async function publierMatieresPourSousDirecteur() {
  try {
    if (!monEcoleId && !monEcoleNom) return;
    let det = getMatieresActives().map(function(m) {
      return { id: m.id, fr: m.fr, ar: (m.ar || MATIERES_AR[m.fr] || ""), nom: m.fr, nomBilingue: nomMatiereBilingue(m.fr), desc: m.desc || "", perso: !!m.perso };
    });
    let payload = { ecoleId: monEcoleId || "", ecoleNom: monEcoleNom || "", ecoleNomAr: NOM_ECOLE_AR, matieres: matieresActivesIds, matieresDetail: det, matieresNoms: det.map(function(m) { return m.fr; }), typeComposition: typeComposition, date: new Date().toISOString() };
    await db.collection("matieres_publiees").doc("AN_NOUROU_IMAN").set(payload);
    if (monEcoleId && monEcoleId !== "TOUTES") {
      await db.collection("matieres_publiees").doc(monEcoleId).set(payload);
      await db.collection("configMatieres").doc(monEcoleId).set(payload);
    }
  } catch (e) { console.log(e.message); }
}
function appliquerConfigMatieres(data) {
  if (!data) return false;
  let liste = data.matieres || data.matieresActives || null;
  if (!liste || !liste.length) return false;
  if (data.matieresDetail && Array.isArray(data.matieresDetail)) {
    data.matieresDetail.forEach(function(m) {
      if (!MATIERES_ISLAMIQUES.find(function(x) { return x.id === m.id; })) {
        MATIERES_ISLAMIQUES.push({ id: m.id, fr: m.fr || m.nom, ar: m.ar || MATIERES_AR[m.fr || m.nom] || "", desc: m.desc || "", perso: !!m.perso });
      }
    });
  }
  matieresActivesIds = liste.slice();
  if (data.typeComposition) typeComposition = data.typeComposition;
  return true;
}
async function chargerConfigMatieres() {
  try {
    let locT = localStorage.getItem("typeComposition_" + monEcoleId);
    if (locT) typeComposition = locT;
  } catch (e) {}
  try {
    if (monEcoleId && monEcoleId !== "TOUTES") {
      let doc = await db.collection("matieres_publiees").doc(monEcoleId).get();
      if (doc.exists && doc.data().matieres && doc.data().matieres.length) { appliquerConfigMatieres(doc.data()); majTitresFeuilles(); afficherChoixMatieres(); return; }
      let doc2 = await db.collection("configMatieres").doc(monEcoleId).get();
      if (doc2.exists && doc2.data().matieres && doc2.data().matieres.length) { appliquerConfigMatieres(doc2.data()); majTitresFeuilles(); afficherChoixMatieres(); return; }
    }
  } catch (e) {}
  try {
    let docG = await db.collection("matieres_publiees").doc("AN_NOUROU_IMAN").get();
    if (docG.exists && docG.data().matieres && docG.data().matieres.length) { appliquerConfigMatieres(docG.data()); majTitresFeuilles(); afficherChoixMatieres(); return; }
  } catch (e) {}
  try {
    let loc = localStorage.getItem("matieresActives_" + monEcoleId);
    if (loc) { let arr = JSON.parse(loc); if (arr.length) matieresActivesIds = arr; }
  } catch (e) {}
  majTitresFeuilles(); afficherChoixMatieres();
}
function majTitresFeuilles() {
  let noms = getMatieresActives().map(function(m) { return m.fr; }).join(", ") || "Toutes";
  ["affichageMatieresActives","affichageMatieresBulletin","affichageMatieresAnnuel","affichageMatieresParametres"].forEach(function(id) {
    let el = document.getElementById(id); if (el) el.textContent = noms;
  });
  ["affichageTypeComposition","affichageTypeCompositionBulletin","affichageTypeCompositionParam","affichageTypeCompositionChoisi"].forEach(function(id) {
    let el = document.getElementById(id); if (el) el.textContent = typeComposition;
  });
  let elF = document.getElementById('affichageFraisTotal');
  if (elF) elF.textContent = fraisTotal ? fraisTotal + " FCFA" : "Non défini";
  let elF2 = document.getElementById('titreFraisEleves');
  if (elF2) elF2.textContent = fraisTotal || 0;
  let elD = document.getElementById('titreDateEleves');
  if (elD) elD.textContent = new Date().toLocaleDateString('fr-FR');
  let elDP = document.getElementById('titreDatePresence');
  if (elDP) elDP.textContent = new Date().toLocaleDateString('fr-FR');
  let selMode = document.getElementById('selectTypeComposition');
  if (selMode) {
    if (typeComposition === "Oral seul") selMode.value = "oral";
    else if (typeComposition === "Écrit seul") selMode.value = "ecrit";
    else if (typeComposition === "Note unique") selMode.value = "note-unique";
    else selMode.value = "oral-ecrit";
  }
}
function afficherChoixMatieres() {
  let box = document.getElementById('listeChoixMatieres');
  if (!box) return;
  let html = "";
  MATIERES_ISLAMIQUES.forEach(function(m) {
    let coche = matieresActivesIds.includes(m.id) ? "checked" : "";
    html += '<label class="matiere-check"><input type="checkbox" class="check-matiere" value="' + m.id + '" ' + coche + '> <span><b>' + m.fr + '</b> - ' + (m.ar || "") + '<br><small style="color:#666">' + (m.desc || "") + '</small></span></label>';
  });
  box.innerHTML = html;
  majTitresFeuilles();
}
function toutCocherMatieres() {
  document.querySelectorAll('.check-matiere').forEach(function(c) { c.checked = true; });
}
function toutDecocherMatieres() {
  document.querySelectorAll('.check-matiere').forEach(function(c) { c.checked = false; });
}
async function sauvegarderMatieresActives() {
  let coches = [...document.querySelectorAll('.check-matiere:checked')].map(function(c) { return c.value; });
  let msg = document.getElementById('msgMatieres');
  if (!coches.length) { msg.style.color = "red"; msg.textContent = "❌ Coche au moins 1 matière"; return; }
  matieresActivesIds = coches;
  try { localStorage.setItem("matieresActives_" + monEcoleId, JSON.stringify(coches)); } catch (e) {}
  try {
    if (monEcoleId && monEcoleId !== "TOUTES") {
      await db.collection("configMatieres").doc(monEcoleId).set({ ecoleId: monEcoleId, ecoleNom: monEcoleNom, fraisTotal: fraisTotal, matieres: coches, typeComposition: typeComposition, date: new Date().toISOString() });
    }
  } catch (e) {}
  await publierMatieresPourSousDirecteur();
  majTitresFeuilles(); afficherChoixMatieres();
  msg.style.color = "green";
  msg.textContent = "✅ Matières enregistrées : " + getMatieresActives().map(function(m) { return m.fr; }).join(", ");
  chargerElevesGestion();
}
async function sauvegarderTypeComposition() {
  let sel = document.getElementById('selectTypeComposition');
  if (!sel) return;
  let map = { "oral-ecrit": "Oral + Écrit", "oral": "Oral seul", "ecrit": "Écrit seul", "note-unique": "Note unique" };
  typeComposition = map[sel.value] || "Oral + Écrit";
  try { localStorage.setItem("typeComposition_" + monEcoleId, typeComposition); } catch (e) {}
  try {
    if (monEcoleId && monEcoleId !== "TOUTES") {
      await db.collection("configMatieres").doc(monEcoleId).set({ ecoleId: monEcoleId, ecoleNom: monEcoleNom, typeComposition: typeComposition, date: new Date().toISOString() }, { merge: true });
    }
    await db.collection("matieres_publiees").doc("AN_NOUROU_IMAN").set({ typeComposition: typeComposition, date: new Date().toISOString() }, { merge: true });
  } catch (e) {}
  await publierMatieresPourSousDirecteur();
  majTitresFeuilles();
  let msg = document.getElementById('msgTypeComposition');
  if (msg) { msg.style.color = "green"; msg.textContent = "✅ Mode enregistré : " + typeComposition; }
  alert("✅ Mode enregistré : " + typeComposition);
}
async function chargerFraisTotal() {
  try {
    if (monEcoleId && monEcoleId !== "TOUTES") {
      let doc = await db.collection("configMatieres").doc(monEcoleId).get();
      if (doc.exists && doc.data().fraisTotal) fraisTotal = Number(doc.data().fraisTotal || 0);
    }
  } catch (e) {}
  try {
    let loc = localStorage.getItem("fraisTotal_" + monEcoleId);
    if (loc) fraisTotal = Number(loc || 0);
  } catch (e) {}
  syncFraisTotal();
  if (fraisTotal > 0 && monEcoleNom) prixParEcole[cleEcolePrix(monEcoleNom)] = fraisTotal;
  majTitresFeuilles();
}
async function definirFraisTotal() {
  let v = Number(document.getElementById('inputFraisTotal').value || 0);
  if (!v) { alert("Mets un montant"); return; }
  fraisTotal = v;
  syncFraisTotal();
  prixParEcole[cleEcolePrix(monEcoleNom)] = v;
  prixSecoursGlobal = v;
  try { localStorage.setItem("fraisTotal_" + monEcoleId, String(v)); } catch (e) {}
  try {
    if (monEcoleId && monEcoleId !== "TOUTES") {
      await db.collection("configMatieres").doc(monEcoleId).set({ ecoleId: monEcoleId, ecoleNom: monEcoleNom, fraisTotal: v, matieres: matieresActivesIds, typeComposition: typeComposition, date: new Date().toISOString() }, { merge: true });
    }
    await db.collection("prix_ecoles").doc(cleEcolePrix(monEcoleNom)).set({ ecole: monEcoleNom, ecoleNom: monEcoleNom, prix: v, frais: v, date: new Date().toISOString() });
  } catch (e) {}
  majTitresFeuilles();
  alert("✅ Prix de " + monEcoleNom + " fixé dans Paramètres : " + v + " FCFA");
  chargerElevesGestion();
  chargerPaiementsGestion();
}
// ===== FIN PARTIE 1 CORRIGÉE =====

// ===== PARTIE 2 CORRIGÉE - ELEVES / PAIEMENTS / ENSEIGNANTS / BULLETINS =====
async function chargerElevesGestion() {
  let box = document.getElementById('listeElevesGestion');
  if (!box) return;
  try {
    let snap = await db.collection("inscriptions").limit(200).get();
    TOUS_ELEVES_GESTION = [];
    snap.forEach(function(doc) {
      let d = { id: doc.id, ...doc.data() };
      if (estAMoiGestion(d)) TOUS_ELEVES_GESTION.push(d);
    });
    let snapP = await db.collection("paiements").limit(500).get();
    TOUS_PAIEMENTS_GESTION = [];
    snapP.forEach(function(doc) { TOUS_PAIEMENTS_GESTION.push({ id: doc.id, ...doc.data() }); });
    syncMesListes();
    afficherElevesGestion(filtreEleveActuel);
    majDashboard();
    if (typeof remplirFiltresEcole === "function") remplirFiltresEcole();
    afficherEffectifsParEcole();
  } catch (e) { box.innerHTML = "❌ " + e.message; }
}
function soldeEleve(nom) {
  syncMesListes();
  let elObj = mesEleves.find(function(e) { return normaliser((e.enfant || e.nomEnfant || "")) === normaliser(nom); });
  let totalDu = elObj ? prixPourEleve(elObj) : 0;
  let totalPaye = 0;
  TOUS_PAIEMENTS_GESTION.forEach(function(p) {
    if (normaliser(p.enfant || p.enfantNom || "") === normaliser(nom) && statutPaiementValide(p)) totalPaye += Number(p.montant || 0);
  });
  let reste = Math.max(0, totalDu - totalPaye);
  let statut = totalDu === 0 ? "nonpaye" : totalPaye >= totalDu ? "paye" : totalPaye > 0 ? "avance" : "nonpaye";
  return { totalPaye: totalPaye, reste: reste, statut: statut, totalDu: totalDu, total: totalDu };
}
function calculerEncaisseOfficiel() {
  let encaisse = 0;
  TOUS_PAIEMENTS_GESTION.forEach(function(p) {
    if (!statutPaiementValide(p)) return;
    let existe = TOUS_ELEVES_GESTION.some(function(e){ return normaliser(e.enfant||e.nomEnfant||"") === normaliser(p.enfant||p.enfantNom||""); });
    if (!existe) return;
    if (!modeToutesEcoles && !estAMoiGestion(p)) return;
    encaisse += Number(p.montant || 0);
  });
  return encaisse;
}
function majDashboard() {
  let total = TOUS_ELEVES_GESTION.length;
  let accepte = TOUS_ELEVES_GESTION.filter(function(e) { return e.statut === "valide" || e.statut === "validé"; }).length;
  let attente = total - accepte;
  let paye = 0, nonpaye = 0;
  TOUS_ELEVES_GESTION.forEach(function(e) {
    let s = soldeEleve(e.enfant || e.nomEnfant || "");
    if (s.statut === "paye") paye++; else nonpaye++;
  });
  let encaisse = calculerEncaisseOfficiel();
  let mettre = function(id, v) { let e = document.getElementById(id); if (e) e.textContent = v; };
  mettre('statTotal', total); mettre('statAccepte', accepte); mettre('statEnAttente', attente);
  mettre('statPaye', paye); mettre('statNonPaye', nonpaye); mettre('statMontant', encaisse + " FCFA");
  let alertBox = document.getElementById('alertesJour');
  if (alertBox) alertBox.innerHTML = nonpaye > 0 ? '🔴 <b>' + nonpaye + '</b> élève(s) doivent encore payer.' : '🎉 Tout le monde a payé. Alhamdoulillah.';
  let der = document.getElementById('derniersPaiementsDashboard');
  if (der) {
    let h = "";
    TOUS_PAIEMENTS_GESTION.slice(-5).reverse().forEach(function(p) {
      h += '<p style="font-size:12px">💰 <b>' + (p.enfant || p.enfantNom || "") + '</b> - ' + (p.montant || 0) + ' FCFA - ' + (p.motif || "") + ' - ' + (p.statut || "") + '</p>';
    });
    der.innerHTML = h || "<p class='muted centre'>Aucun paiement.</p>";
  }
  let selP = document.getElementById('paiementEleve');
  if (selP) {
    let cur = selP.value;
    selP.innerHTML = '<option value="">— Choisis l\'élève —</option>';
    TOUS_ELEVES_GESTION.forEach(function(e) {
      let nom = e.enfant || e.nomEnfant || "";
      selP.innerHTML += '<option value="' + nom + '">' + nom + ' - ' + (e.niveau || "") + ' - ' + (e.ecole || e.groupe || "") + '</option>';
    });
    if (cur) selP.value = cur;
  }
  let selB = document.getElementById('bulEleve');
  if (selB) {
    let cur = selB.value;
    selB.innerHTML = '<option value="">— Choisis l\'élève —</option>';
    TOUS_ELEVES_GESTION.forEach(function(e) {
      let nom = e.enfant || e.nomEnfant || "";
      selB.innerHTML += '<option value="' + nom + '">' + nom + ' - ' + (e.ecole || e.groupe || "") + '</option>';
    });
    if (cur) selB.value = cur;
  }
}
function afficherEffectifsParEcole() {
  let box = document.getElementById('effectifsParEcoleEleves');
  if (!box) return;
  if (!TOUS_ELEVES_GESTION.length) { box.innerHTML = ""; return; }
  let par = {};
  TOUS_ELEVES_GESTION.forEach(function(e) {
    let n = nomEcoleDeEleveSimple(e) || "Sans école";
    par[n] = (par[n] || 0) + 1;
  });
  let total = TOUS_ELEVES_GESTION.length;
  let chips = Object.keys(par).sort().map(function(n) {
    let st = filtreEcoleEleveActuel === n ? 'background:#66BB6A;color:white' : '';
    return '<button onclick="choisirEcoleEleves(\'' + n + '\')" class="btn-filtre" style="' + st + '">' + n + ' : <b>' + par[n] + '</b></button>';
  }).join(' ');
  let stToutes = !filtreEcoleEleveActuel ? 'background:#66BB6A;color:white' : '';
  box.innerHTML = '<div style="background:#F1F8E9;border:1px solid #C8E6C9;border-radius:10px;padding:8px;text-align:center;font-size:12px"><b>Effectifs par école — Total : ' + total + '</b><br><div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center"><button onclick="choisirEcoleEleves(\'\')" class="btn-filtre" style="' + stToutes + '">Toutes : <b>' + total + '</b></button> ' + chips + '</div></div>';
}
function niveauxDeEcoleChoisie() {
  let liste = TOUS_ELEVES_GESTION.filter(function(e) {
    if (filtreEcoleEleveActuel && normaliser(nomEcoleDeEleveSimple(e)) !== normaliser(filtreEcoleEleveActuel)) return false;
    return true;
  });
  let set = new Set();
  liste.forEach(function(e) { if (e.niveau) set.add(e.niveau); });
  return [...set].sort();
}
function remplirFiltreNiveauEleves() {
  let sel = document.getElementById('filtreNiveauEleves');
  if (!sel) return;
  let niveaux = niveauxDeEcoleChoisie();
  let garde = sel.value;
  sel.innerHTML = '<option value="">— Tous les niveaux —</option>' + niveaux.map(function(n) { return '<option value="' + n + '">' + n + '</option>'; }).join('');
  if (garde && niveaux.includes(garde)) sel.value = garde; else filtreNiveauEleveActuel = "";
}
function choisirEcoleEleves(nom) {
  filtreEcoleEleveActuel = nom || "";
  let sel = document.getElementById('filtreEcoleEleves');
  if (sel) sel.value = nom || "";
  filtreNiveauEleveActuel = "";
  remplirFiltreNiveauEleves();
  afficherElevesGestion(filtreEleveActuel);
  afficherEffectifsParEcole();
}
function filtrerElevesParEcole() {
  let sel = document.getElementById('filtreEcoleEleves');
  if (!sel) return;
  filtreEcoleEleveActuel = sel.value || "";
  filtreNiveauEleveActuel = "";
  remplirFiltreNiveauEleves();
  afficherElevesGestion(filtreEleveActuel);
  afficherEffectifsParEcole();
}
function filtrerElevesParNiveau() {
  let sel = document.getElementById('filtreNiveauEleves');
  if (!sel) return;
  filtreNiveauEleveActuel = sel.value || "";
  afficherElevesGestion(filtreEleveActuel);
}
function afficherElevesGestion(filtre) {
  let box = document.getElementById('listeElevesGestion');
  if (!box) return;
  let q = (document.getElementById('rechercheEleve')?.value || "").toLowerCase();
  let liste = TOUS_ELEVES_GESTION.filter(function(e) {
    let nom = e.enfant || e.nomEnfant || "";
    let s = soldeEleve(nom);
    if (filtreEcoleEleveActuel && normaliser(nomEcoleDeEleveSimple(e)) !== normaliser(filtreEcoleEleveActuel)) return false;
    if (filtreNiveauEleveActuel && String(e.niveau || "") !== String(filtreNiveauEleveActuel)) return false;
    if (filtre === "paye" && s.statut !== "paye") return false;
    if (filtre === "avance" && s.statut !== "avance") return false;
    if (filtre === "nonpaye" && s.statut !== "nonpaye") return false;
    if (filtre === "attente" && (e.statut === "valide" || e.statut === "validé")) return false;
    if (filtre === "accepte" && !(e.statut === "valide" || e.statut === "validé")) return false;
    if (q && !JSON.stringify(e).toLowerCase().includes(q)) return false;
    return true;
  });
  afficherEffectifsParEcole();
  remplirFiltreNiveauEleves();
  if (!liste.length) { box.innerHTML = '<p class="centre muted">Aucun élève.</p>'; return; }
  let html = '<table class="table-blanc"><thead><tr><th>Enfant</th><th>Parent</th><th>Niveau</th><th>École / Groupe</th><th>Paiement</th><th>Statut DG</th><th>Action</th></tr></thead><tbody>';
  liste.forEach(function(e) {
    let nom = e.enfant || e.nomEnfant || "";
    let s = soldeEleve(nom);
    let badgePaye = s.statut === "paye" ? '<span class="badge badge-paye">✓ PAYÉ</span>' : s.statut === "avance" ? '<span class="badge badge-avance">◐ AVANCE ' + s.totalPaye + '/' + s.totalDu + '</span>' : '<span class="badge badge-nonpaye">✗ NON PAYÉ - Reste ' + s.reste + '</span>';
    let badgeDG = (e.statut === "valide" || e.statut === "validé") ? '<span class="badge badge-accepte">ACCEPTÉ DG</span>' : '<span class="badge badge-attente">EN ATTENTE DG</span>';
    html += '<tr><td><b>' + nom + '</b></td><td>' + (e.parent || "") + '<br><small>' + (e.tel || "") + '</small></td><td><b>' + (e.niveau || "") + '</b></td><td><b style="color:#1B5E20">' + nomEcoleDeEleveSimple(e) + '</b></td><td>' + badgePaye + '</td><td>' + badgeDG + '</td><td><button class="lien-action" onclick="validerEleveGestion(\'' + e.id + '\')">✅ Valider</button> <button class="lien-action" style="color:red" onclick="supprimerEleveGestion(\'' + e.id + '\',\'' + nom + '\')">🗑️</button></td></tr>';
  });
  html += '</tbody></table>';
  box.innerHTML = html;
}
function filtrerEleves(filtre, btn) {
  filtreEleveActuel = filtre;
  document.querySelectorAll('#tabEleves .btn-filtre').forEach(function(b) { b.classList.remove('actif'); });
  if (btn) btn.classList.add('actif');
  afficherElevesGestion(filtre);
}
async function validerEleveGestion(id) {
  try { await db.collection("inscriptions").doc(id).update({ statut: "valide" }); chargerElevesGestion(); } catch (e) { alert("❌ " + e.message); }
}
async function supprimerEleveGestion(id, nom) {
  if (!confirm("Supprimer " + nom + " ?")) return;
  try {
    await db.collection("inscriptions").doc(id).delete();
    let snap = await db.collection("paiements").where("enfant", "==", nom).get();
    for (let d of snap.docs) await db.collection("paiements").doc(d.id).delete();
    let snap2 = await db.collection("bulletins").where("eleve", "==", nom).get();
    for (let d of snap2.docs) await db.collection("bulletins").doc(d.id).delete();
    alert("✅ " + nom + " supprimé");
    chargerElevesGestion();
  } catch (e) { alert("❌ " + e.message); }
}
async function effacerElevesAffiches() {
  let aEffacer = TOUS_ELEVES_GESTION.filter(function(e) {
    let okEcole = !filtreEcoleEleveActuel || normaliser(nomEcoleDeEleveSimple(e)) === normaliser(filtreEcoleEleveActuel);
    let okNiveau = !filtreNiveauEleveActuel || String(e.niveau) === String(filtreNiveauEleveActuel);
    return okEcole && okNiveau;
  });
  if (!aEffacer.length) return alert("Aucun élève à effacer.");
  let code = prompt('Tu vas EFFACER ' + aEffacer.length + ' élève(s). Écris EFFACER :');
  if (code !== "EFFACER") return alert("Annulé");
  try {
    for (let e of aEffacer) await db.collection("inscriptions").doc(e.id).delete();
    alert("✅ Effacé"); chargerElevesGestion();
  } catch (e) { alert("❌ " + e.message); }
}
function telechargerListeElevesPDF() { window.print(); }
function telechargerEleves() {
  let txt = "📋 LISTE ÉLÈVES - " + monEcoleNom + "\n";
  TOUS_ELEVES_GESTION.forEach(function(e) { txt += '- ' + (e.enfant || e.nomEnfant || "") + ' - ' + (e.niveau || "") + ' - ' + nomEcoleDeEleveSimple(e) + '\n'; });
  window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
}
function onElevePaiementChange() {
  let nom = document.getElementById('paiementEleve').value;
  let eleve = TOUS_ELEVES_GESTION.find(function(e) { return (e.enfant || e.nomEnfant || "") === nom; });
  document.getElementById('paiementClasse').value = eleve ? eleve.niveau || "" : "";
  let box = document.getElementById('infoSoldeEleve');
  if (!eleve) { box.style.display = "none"; return; }
  let s = soldeEleve(nom);
  box.style.display = "block";
  box.innerHTML = '<b>' + nom + '</b> - ' + (eleve.ecole || eleve.groupe || "") + ' - Déjà payé : <b>' + s.totalPaye + ' FCFA</b> - Reste : <b style="color:red">' + s.reste + ' FCFA</b> - Prix école : ' + (s.totalDu > 0 ? s.totalDu + ' FCFA' : 'Prix non défini dans Paramètres') + '';
  calculerResteApresPaiement();
}
function calculerResteApresPaiement() {
  let nom = document.getElementById('paiementEleve').value;
  let m = Number(document.getElementById('paiementMontant').value || 0);
  let box = document.getElementById('apercuApresPaiement');
  if (!nom || !m) { box.style.display = "none"; return; }
  let s = soldeEleve(nom);
  let resteApres = Math.max(0, s.reste - m);
  box.style.display = "block";
  box.innerHTML = 'Après ce paiement de <b>' + m + ' FCFA</b>, il restera : <b>' + resteApres + ' FCFA</b>';
}
async function enregistrerPaiementFormulaire() {
  let eleve = document.getElementById('paiementEleve').value;
  let montant = Number(document.getElementById('paiementMontant').value || 0);
  let motif = document.getElementById('paiementMotif').value;
  let date = document.getElementById('paiementDate').value;
  let msg = document.getElementById('msgPaiement');
  if (!eleve || !montant) { msg.style.color = "red"; msg.textContent = "❌ Choisis l'élève et le montant"; return; }
  let e = TOUS_ELEVES_GESTION.find(function(x) { return (x.enfant || x.nomEnfant || "") === eleve; }) || {};
  let ecoleEleve = e.ecole || e.ecoleNom || e.groupe || e.groupeNom || "";
  try {
    await db.collection("paiements").add({ enfant: eleve, parent: e.parent || "", tel: e.tel || "", montant: montant, motif: motif, mode: "Espèces", statut: "valide", statutPaiement: "valide", ecole: ecoleEleve, ecoleNom: ecoleEleve, ecoleId: e.ecoleId || "", groupe: ecoleEleve, eleveId: e.id || "", niveau: e.niveau || "", envoyePar: "gestion-secretaire", envoyeParEmail: emailSD || "", ecoleSecretaire: monEcoleNom || "", date: date || new Date().toLocaleDateString('fr-FR'), createdAt: new Date() });
    msg.style.color = "green";
    msg.textContent = "✅ Paiement enregistré : " + montant + " FCFA pour " + eleve;
    document.getElementById('paiementMontant').value = "";
    chargerPaiementsGestion(); chargerElevesGestion();
  } catch (er) { msg.style.color = "red"; msg.textContent = "❌ " + er.message; }
}
async function chargerPaiementsGestion() {
  try {
    let snapP = await db.collection("paiements").limit(500).get();
    TOUS_PAIEMENTS_GESTION = [];
    snapP.forEach(function(doc) { TOUS_PAIEMENTS_GESTION.push({ id: doc.id, ...doc.data() }); });
    syncMesListes();
  } catch (e) {}
  if (!TOUS_ELEVES_GESTION.length) { try { await chargerElevesGestion(); } catch (e) {} }
  afficherPaiementsGestion(filtrePaiementActuel);
  chargerHistoriquePaiements();
}
function afficherPaiementsGestion(filtre) {
  let box = document.getElementById('listePaiementsGestion');
  if (!box) return;
  if (!TOUS_ELEVES_GESTION.length) { box.innerHTML = '<p class="centre muted">Charge les élèves d\'abord.</p>'; return; }
  let liste = TOUS_ELEVES_GESTION.filter(function(e) {
    let s = soldeEleve(e.enfant || e.nomEnfant || "");
    if (filtre === "paye" && s.statut !== "paye") return false;
    if (filtre === "avance" && s.statut !== "avance") return false;
    if (filtre === "nonpaye" && s.statut !== "nonpaye") return false;
    return true;
  });
  if (!liste.length) { box.innerHTML = '<p class="centre muted">Aucun élève.</p>'; return; }
  let html = '<table class="table-blanc"><thead><tr><th>Élève</th><th>Total</th><th>Déjà payé</th><th>Reste</th><th>Statut</th><th>Action</th></tr></thead><tbody>';
  liste.forEach(function(e) {
    let nom = e.enfant || e.nomEnfant || "";
    let s = soldeEleve(nom);
    let badge = s.statut === "paye" ? '<span class="badge badge-paye">✓ PAYÉ</span>' : s.statut === "avance" ? '<span class="badge badge-avance">◐ AVANCE</span>' : '<span class="badge badge-nonpaye">✗ NON PAYÉ</span>';
    html += '<tr><td><b>' + nom + '</b><br><small>' + (e.parent || "") + ' - ' + (e.tel || "") + '</small></td><td><b>' + (s.totalDu > 0 ? s.totalDu : 'Prix non défini') + '</b></td><td><b>' + s.totalPaye + '</b></td><td><b style="color:red">' + s.reste + '</b></td><td>' + badge + '</td><td><a class="lien-action" href="https://wa.me/237' + nettoyerTelGestion(e.tel || "") + '?text=' + encodeURIComponent("Salam " + (e.parent || "") + ", il reste " + s.reste + " FCFA pour " + nom) + '" target="_blank">💬 Relancer</a></td></tr>';
  });
  html += '</tbody></table>';
  box.innerHTML = html;
}
function filtrerPaiements(filtre, btn) {
  filtrePaiementActuel = filtre;
  document.querySelectorAll('#tabPaiements .btn-filtre').forEach(function(b) { b.classList.remove('actif'); });
  if (btn) btn.classList.add('actif');
  afficherPaiementsGestion(filtre);
}
function chargerHistoriquePaiements() {
  let box = document.getElementById('historiquePaiements');
  if (!box) return;
  if (!TOUS_PAIEMENTS_GESTION.length) { box.innerHTML = '<p class="centre muted">Aucun historique.</p>'; return; }
  let liste = TOUS_PAIEMENTS_GESTION.filter(function(p) {
    if (modeToutesEcoles) return true;
    if (!p.ecole && !p.ecoleNom && !p.groupe) return true;
    return estAMoiGestion(p);
  });
  if (!liste.length) { box.innerHTML = '<p class="centre muted">Aucun historique.</p>'; return; }
  let html = '<table class="table-blanc"><thead><tr><th>Enfant</th><th>Montant</th><th>Motif</th><th>Date</th><th>Statut</th></tr></thead><tbody>';
  liste.slice().reverse().forEach(function(p) {
    html += '<tr><td><b>' + (p.enfant || p.enfantNom || "") + '</b></td><td><b>' + (p.montant || 0) + '</b></td><td>' + (p.motif || "") + '</td><td>' + (p.date || "") + '</td><td>' + (p.statut || "valide") + '</td></tr>';
  });
  html += '</tbody></table>';
  box.innerHTML = html;
}
function telechargerPaiementsPDF() { window.print(); }
async function ajouterEnseignant() {
  let nom = document.getElementById('ensNom').value.trim();
  let tel = document.getElementById('ensTel').value.trim();
  let role = document.getElementById('ensRole').value;
  let matiere = document.getElementById('ensMatiere').value;
  let classe = document.getElementById('ensClasse').value;
  let salaire = Number(document.getElementById('ensSalaire').value || 0);
  if (!nom || !tel) { alert("❌ Mets Nom et Téléphone"); return; }
  try {
    await db.collection("enseignants").add({ nom: nom, tel: tel, role: role, matiere: matiere, classe: classe, salaire: salaire, ecole: monEcoleNom, ecoleId: monEcoleId, date: new Date().toLocaleDateString('fr-FR'), createdAt: new Date() });
    document.getElementById('ensNom').value = ""; document.getElementById('ensTel').value = ""; document.getElementById('ensSalaire').value = "";
    chargerEnseignants();
  } catch (e) { alert("❌ " + e.message); }
}
async function chargerEnseignants() {
  let box = document.getElementById('listeEnseignants');
  if (!box) return;
  try {
    let snap = await db.collection("enseignants").limit(100).get();
    TOUS_ENSEIGNANTS = [];
    snap.forEach(function(doc) {
      let d = { id: doc.id, ...doc.data() };
      if (estAMoiGestion(d)) TOUS_ENSEIGNANTS.push(d);
    });
    let sel = document.getElementById('selectEnseignantCom');
    if (sel) {
      sel.innerHTML = '<option value="">— Choisis —</option>';
      TOUS_ENSEIGNANTS.forEach(function(e) { sel.innerHTML += '<option value="' + e.tel + '">' + e.nom + ' - ' + e.role + '</option>'; });
    }
    remplirFiltreEvolutionEnseignants();
    if (!TOUS_ENSEIGNANTS.length) { box.innerHTML = '<p class="centre muted">Aucun enseignant.</p>'; return; }
    let html = '<table class="table-blanc"><thead><tr><th>Nom</th><th>Rôle / Matière</th><th>Tél</th><th>Salaire</th><th>Action</th></tr></thead><tbody>';
    TOUS_ENSEIGNANTS.forEach(function(e) {
      html += '<tr><td><b>' + e.nom + '</b></td><td>' + e.role + '<br><small>' + (e.matiere || "") + ' - ' + (e.classe || "") + '</small></td><td>' + e.tel + '</td><td>' + (e.salaire || 0) + '</td><td><button class="lien-action" onclick="payerEnseignant(\'' + e.nom + '\',' + (e.salaire || 0) + ')">💰 Payer</button> <button class="lien-action" onclick="supprimerEnseignant(\'' + e.id + '\')">🗑️ Supprimer</button></td></tr>';
    });
    html += '</tbody></table>';
    box.innerHTML = html;
  } catch (e) { box.innerHTML = "❌ " + e.message; }
}
async function supprimerEnseignant(id) {
  if (!confirm("Supprimer ?")) return;
  try { await db.collection("enseignants").doc(id).delete(); chargerEnseignants(); } catch (e) { alert("❌ " + e.message); }
}
function envoyerMessageUnEnseignant() {
  let tel = document.getElementById('selectEnseignantCom').value;
  let msg = document.getElementById('msgEnseignantCom').value.trim();
  if (!tel || !msg) { alert("Choisis l'enseignant et écris le message"); return; }
  window.open("https://wa.me/237" + nettoyerTelGestion(tel) + "?text=" + encodeURIComponent(msg), "_blank");
}
function getLangBulletin() {
  return (document.getElementById('langueBulletin')?.value) || "fr-ar";
}
function nomMatiereBulletinSelonLangue(fr) {
  let ar = MATIERES_AR[fr] || "";
  if (getLangBulletin() === "en-ar") { let en = MATIERES_EN[fr] || fr; return en + " - " + ar; }
  return fr + (ar ? " - " + ar : "");
}
async function chargerNotesExistantes() {
  let eleve = document.getElementById('bulEleve').value;
  let tri = document.getElementById('bulTrimestre').value;
  let form = document.getElementById('formNotes');
  if (!form) return;
  if (!eleve) { form.innerHTML = ""; return; }
  if (!TOUS_BULLETINS.length) { try { await chargerBulletins(); } catch (e) {} }
  let actifs = getMatieresActives();
  if (!actifs.length) { form.innerHTML = '<p class="centre" style="color:red">❌ Aucune matière active. Va dans Paramètres.</p>'; return; }
  let isEn = getLangBulletin() === "en-ar";
  let html = '<h3 style="text-align:center">Notes - ' + eleve + ' - ' + tri + '</h3><table class="table-blanc"><thead><tr><th>' + (isEn ? "Subject / المادة" : "Matière / المادة") + '</th><th>Oral /10</th><th>' + (isEn ? "Written /10" : "Écrit /10") + '</th><th>Total /20</th></tr></thead><tbody>';
  actifs.forEach(function(m) {
    let exist = TOUS_BULLETINS.find(function(b) { return b.trimestre === tri && normaliser(b.matiere) === normaliser(m.fr) && normaliser(b.eleve) === normaliser(eleve); });
    let oral = exist ? Number(exist.oral || 0) : 0;
    let ecrit = exist ? Number(exist.ecrit || 0) : 0;
    html += '<tr><td><b>' + nomMatiereBulletinSelonLangue(m.fr) + '</b></td><td><input type="number" min="0" max="10" step="0.5" data-matiere="' + m.fr + '" data-type="oral" value="' + oral + '" oninput="calculerTotalLigne(this)"></td><td><input type="number" min="0" max="10" step="0.5" data-matiere="' + m.fr + '" data-type="ecrit" value="' + ecrit + '" oninput="calculerTotalLigne(this)"></td><td><b class="total-ligne" data-matiere="' + m.fr + '">' + (oral + ecrit).toFixed(1) + '</b></td></tr>';
  });
  html += '</tbody></table>';
  form.innerHTML = html;
}
function calculerTotalLigne(input) {
  let mat = input.dataset.matiere;
  let oral = Number(document.querySelector('input[data-matiere="' + mat + '"][data-type="oral"]')?.value || 0);
  let ecrit = Number(document.querySelector('input[data-matiere="' + mat + '"][data-type="ecrit"]')?.value || 0);
  let el = document.querySelector('.total-ligne[data-matiere="' + mat + '"]');
  if (el) el.textContent = (oral + ecrit).toFixed(1);
}
async function enregistrerBulletinComplet() {
  let eleve = document.getElementById('bulEleve').value;
  let tri = document.getElementById('bulTrimestre').value;
  let annee = document.getElementById('bulAnnee').value;
  let app = document.getElementById('bulAppreciationGenerale').value;
  let msg = document.getElementById('msgBulletin');
  if (!eleve) { msg.style.color = "red"; msg.textContent = "❌ Choisis l'élève"; return; }
  let inputs = [...document.querySelectorAll('#formNotes input[data-matiere]')];
  if (!inputs.length) { msg.style.color = "red"; msg.textContent = "❌ Aucune matière active"; return; }
  let ecoleEleve = ecoleDeEleveBulletin(eleve) || monEcoleNom;
  let parMatiere = {};
  inputs.forEach(function(inp){
    let mat = inp.dataset.matiere;
    if(!parMatiere[mat]) parMatiere[mat] = { oral: 0, ecrit: 0 };
    parMatiere[mat][inp.dataset.type] = Number(inp.value || 0);
  });
  try {
    for (let mat of Object.keys(parMatiere)) {
      let oral = parMatiere[mat].oral;
      let ecrit = parMatiere[mat].ecrit;
      let total = oral + ecrit;
      let exist = TOUS_BULLETINS.find(function(b) { return normaliser(b.eleve) === normaliser(eleve) && b.trimestre === tri && normaliser(b.matiere) === normaliser(mat); });
      if (exist && exist.source === "bulletins" && exist.realDocId) {
        await db.collection("bulletins").doc(exist.realDocId).update({ oral: oral, ecrit: ecrit, moyenne: total, appreciation: app, ecole: ecoleEleve });
      } else if (exist && exist.realDocId) {
        try { await db.collection(exist.source).doc(exist.realDocId).update({ oral: oral, ecrit: ecrit, moyenne: total, appreciation: app, ecole: ecoleEleve }); }
        catch(e){ await db.collection("bulletins").add({ eleve: eleve, trimestre: tri, annee: annee, matiere: mat, oral: oral, ecrit: ecrit, moyenne: total, appreciation: app, ecole: ecoleEleve, ecoleId: monEcoleId, createdAt: new Date() }); }
      } else {
        await db.collection("bulletins").add({ eleve: eleve, trimestre: tri, annee: annee, matiere: mat, oral: oral, ecrit: ecrit, moyenne: total, appreciation: app, ecole: ecoleEleve, ecoleId: monEcoleId, createdAt: new Date() });
      }
    }
    msg.style.color = "green";
    msg.textContent = "✅ Bulletin enregistré pour " + eleve + " - " + tri;
    await chargerBulletins();
    await chargerNotesExistantes();
  } catch (e) { msg.style.color = "red"; msg.textContent = "❌ " + e.message; }
}
async function chargerBulletins() {
  try {
    if (!TOUS_ELEVES_GESTION.length) {
      try {
        let snapE = await db.collection("inscriptions").limit(200).get();
        TOUS_ELEVES_GESTION = [];
        snapE.forEach(function(doc) {
          let d = { id: doc.id, ...doc.data() };
          if (estAMoiGestion(d)) TOUS_ELEVES_GESTION.push(d);
        });
        syncMesListes();
      } catch (e) {}
    }
    let tous = [];
    function ajouterNote(raw, source, docId) {
      let listes = [];
      if (Array.isArray(raw.notes)) listes.push(...raw.notes);
      if (Array.isArray(raw.lignes)) listes.push(...raw.lignes);
      if (!listes.length) listes.push(raw);
      listes.forEach(function(v) {
        let eleve = v.eleve || v.enfant || v.nomEleve || "";
        let matiere = v.matiere || v.matiereNom || "";
        let oral = Number(v.oral ?? 0);
        let ecrit = Number(v.ecrit ?? 0);
        let moyenne = Number(v.moyenne ?? (oral + ecrit));
        if (oral === 0 && ecrit === 0 && moyenne > 0) { }
        else { moyenne = oral + ecrit; }
        if (!eleve || !matiere) return;
        tous.push({ id: source + "_" + docId + "_" + normaliser(eleve) + "_" + normaliser(matiere), realDocId: docId, source: source, eleve: eleve, trimestre: v.trimestre || "Trimestre 1", annee: v.annee || "2026-2027", matiere: matiere, oral: oral, ecrit: ecrit, moyenne: moyenne, appreciation: v.appreciation || "", ecole: v.ecole || v.ecoleNom || "", ecoleId: v.ecoleId || "" });
      });
    }
    let cols = ["bulletins","notes","notes_eleves","bulletins_enseignants","notes_trimestre","resultats","notesEleves","compositions"];
    for (let col of cols) {
      try {
        let s = await db.collection(col).limit(500).get();
        s.forEach(function(d) { ajouterNote(d.data(), col, d.id); });
      } catch (e) {}
    }
    let filtreEcoleB = (document.getElementById('filtreEcoleBulletin')?.value) || "";
    let filtres = tous.filter(function(b) {
      if (filtreEcoleB) return normaliser(b.ecole) === normaliser(filtreEcoleB);
      if (!modeToutesEcoles) {
        if (!b.ecole) return true;
        return normaliser(b.ecole) === normaliser(monEcoleNom) || normaliser(b.ecoleId) === normaliser(monEcoleId);
      }
      return true;
    });
    let map = {};
    filtres.forEach(function(b) {
      let k = normaliser(b.eleve) + "||" + b.trimestre + "||" + normaliser(b.matiere);
      if(map[k] && (map[k].oral + map[k].ecrit) > 0 && (b.oral + b.ecrit) === 0) return;
      map[k] = b;
    });
    TOUS_BULLETINS = Object.values(map);
    afficherBulletins();
  } catch (e) {
    let box = document.getElementById('listeBulletins');
    if (box) box.innerHTML = "❌ " + e.message;
  }
}
async function chargerBulletinsTous() { await chargerBulletins(); }
function filtrerElevesBulletinParEcole() { chargerBulletins(); }
function afficherBulletins() {
  let box = document.getElementById('listeBulletins');
  if (!box) return;
  if (!TOUS_BULLETINS.length) { box.innerHTML = '<p class="centre muted">Aucun bulletin.</p>'; return; }
  let q = (document.getElementById('rechercheEleveBulletin')?.value || "").trim();
  let fTri = (document.getElementById('filtreTrimestreBulletin')?.value || "").trim();
  let nbFixe = getNbMatieresFixees();
  let parEleve = {};
  TOUS_BULLETINS.forEach(function(b) {
    if (q && !normaliser(b.eleve).includes(normaliser(q))) return;
    if (fTri && b.trimestre !== fTri) return;
    let k = b.eleve + "||" + b.trimestre;
    if (!parEleve[k]) parEleve[k] = { eleve: b.eleve, trimestre: b.trimestre, total: 0, nb: 0 };
    parEleve[k].total += totalVraiNoteGestionJS(b);
    parEleve[k].nb++;
  });
  if (!Object.keys(parEleve).length) { box.innerHTML = '<p class="centre muted">Aucun bulletin pour "' + q + '".</p>'; return; }
  let html = '<table class="table-blanc"><thead><tr><th>Élève</th><th>École</th><th>Trimestre</th><th>Composé / Fixé</th><th>Moyenne</th><th>Action</th></tr></thead><tbody>';
  Object.values(parEleve).forEach(function(g) {
    let moy = (g.total / (g.nb || 1)).toFixed(2);
    let ex = TOUS_BULLETINS.find(function(b) { return b.eleve === g.eleve; });
    let ecoleAff = (ex && ex.ecole) || ecoleDeEleveBulletin(g.eleve) || "";
    html += '<tr><td><b>' + g.eleve + '</b></td><td><b style="color:#1B5E20">' + ecoleAff + '</b></td><td>' + g.trimestre + '</td><td>' + g.nb + ' / ' + nbFixe + '</td><td><b>' + moy + ' / 20</b></td><td><button class="lien-action" onclick="voirBulletinDetail(\'' + g.eleve + '\',\'' + g.trimestre + '\')">👁️ Voir</button></td></tr>';
  });
  html += '</tbody></table>';
  box.innerHTML = html;
}
function filtrerBulletins() { afficherBulletins(); }
function voirBulletinDetail(eleve, tri) {
  let lignes = TOUS_BULLETINS.filter(function(b) { return b.eleve === eleve && b.trimestre === tri; });
  let moy = calculerMoyenneTrimestre(lignes).toFixed(2);
  let ecoleSpecifique = (lignes[0] && lignes[0].ecole) || ecoleDeEleveBulletin(eleve) || monEcoleNom;
  let eleveObj = TOUS_ELEVES_GESTION.find(function(e) { return normaliser(e.enfant || e.nomEnfant || "") === normaliser(eleve); }) || {};
  let parentNom = eleveObj.parent || "";
  let telParent = eleveObj.tel || "";
  let niveauEleve = eleveObj.niveau || "";
  let html = '<div class="bulletin-page" style="font-family:inherit;page-break-inside:avoid">';
  html += '<div style="text-align:center;border-bottom:3px solid #0F3D2E;padding-bottom:10px"><h2 style="margin:0">☪️ INSTITUT NOUROUL IYMANE</h2><h3 style="margin:6px 0;color:#0F3D2E">🏫 ' + ecoleSpecifique + '</h3><p style="margin:0">Bulletin de Notes - ' + tri + ' - Mode : ' + typeComposition + '</p></div>';
  html += '<div style="display:flex;gap:16px;justify-content:space-between;margin:12px 0;line-height:1.8"><div><b>Élève</b><br>' + eleve + '<br><small>Parent : ' + parentNom + ' - ' + telParent + '</small><br><small>Niveau : ' + niveauEleve + '</small></div><div><b>École</b><br>' + ecoleSpecifique + '</div><div><b>Moyenne</b><br>' + moy + ' / 20</div></div>';
  html += '<table><thead><tr><th>Matière</th><th>Oral /10</th><th>Écrit /10</th><th>Total /20</th></tr></thead><tbody>';
  lignes.forEach(function(l) {
    html += '<tr><td>' + nomMatiereBulletinSelonLangue(l.matiere) + '</td><td>' + (Number(l.oral || 0)) + '</td><td>' + (Number(l.ecrit || 0)) + '</td><td><b>' + totalVraiNoteGestionJS(l) + '</b></td></tr>';
  });
  html += '</tbody></table>';
  html += '<div style="background:#FFF9C4;padding:12px;border-radius:10px;margin-top:12px;text-align:center"><b>MOYENNE GÉNÉRALE (Somme / ' + lignes.length + ' matières notées) : ' + moy + ' / 20</b></div>';
  html += '<div style="margin-top:12px;background:#E8F5E9;padding:10px;border-radius:10px"><b>💬 Appréciation :</b><br><br><div style="border-bottom:1px solid #999;height:14px"></div><div style="border-bottom:1px solid #999;height:14px;margin-top:6px"></div></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px;text-align:center"><div style="border-top:1px solid #333;padding-top:8px"><b>Le Directeur</b><br><br><br><span style="font-size:12px;color:#666">Signature + Cachet</span></div><div style="border-top:1px solid #333;padding-top:8px"><b>Le Parent</b><br><br><br><span style="font-size:12px;color:#666">Vu et signé</span></div></div>';
  html += '<p style="text-align:center;font-size:11px;color:#666;margin-top:16px">INSTITUT NOUROUL IYMANE - ' + ecoleSpecifique + ' - ' + new Date().toLocaleDateString('fr-FR') + '</p></div>';
  document.getElementById('zoneImpression').innerHTML = html;
  document.getElementById('zoneImpression').style.display = "block";
  window.print();
}
// ===== FIN PARTIE 2 CORRIGÉE =====
// ===== PARTIE 3 CORRIGÉE - PRIX = GESTION > PARAMÈTRES / REMISES / RELEVES / DIVERS / ANNUEL / PRESENCE =====
function prixPourEleve(eleveObj) {
  if (!eleveObj) return 0;
  let nomEcole = nomEcoleDeEleveSimple(eleveObj);
  let cle = cleEcolePrix(nomEcole);
  // 1. PRIORITÉ : Prix fixé par le Directeur dans Gestion > Paramètres
  if (prixParEcole[cle] && Number(prixParEcole[cle]) > 0) return Number(prixParEcole[cle]);
  // 2. Prix sur la fiche élève
  if (eleveObj.prix && Number(eleveObj.prix) > 0) return Number(eleveObj.prix);
  if (eleveObj.frais && Number(eleveObj.frais) > 0) return Number(eleveObj.frais);
  if (eleveObj.montantTotal && Number(eleveObj.montantTotal) > 0) return Number(eleveObj.montantTotal);
  // 3. Si le Directeur n'a rien fixé dans Paramètres -> 0, pas de faux prix
  return 0;
}
async function chargerToutLeNouveau() {
  try { await chargerPrixParEcole(); } catch (e) {}
  try { await chargerRemises(); } catch (e) {}
  try { await chargerDivers(); } catch (e) {}
}
async function chargerPrixParEcole() {
  try {
    // 1. PRIORITÉ : Prix fixé dans Gestion > Paramètres (configMatieres -> fraisTotal)
    let snapC = await db.collection("configMatieres").limit(100).get();
    snapC.forEach(function(doc) {
      let d = doc.data();
      let nom = d.ecoleNom || "";
      let p = Number(d.fraisTotal || d.prix || 0);
      if (p > 0 && nom) prixParEcole[cleEcolePrix(nom)] = p;
    });
  } catch (e) {}
  try {
    // 2. Puis prix_ecoles
    let snap = await db.collection("prix_ecoles").limit(100).get();
    snap.forEach(function(doc) {
      let d = doc.data();
      let nom = d.ecole || d.ecoleNom || d.nom || doc.id;
      let p = Number(d.prix || d.frais || d.montant || 0);
      if (p > 0 && nom) prixParEcole[cleEcolePrix(nom)] = p;
    });
  } catch (e) {}
  try {
    // 3. Puis ecoles
    let snap2 = await db.collection("ecoles").limit(100).get();
    snap2.forEach(function(doc) {
      let d = doc.data();
      let nom = d.nom || "";
      let cle = cleEcolePrix(nom);
      let p = Number(d.frais || d.prix || d.fraisTotal || 0);
      if (p > 0 && !prixParEcole[cle]) prixParEcole[cle] = p;
    });
  } catch (e) {}
  // 4. Si l'école actuelle a un fraisTotal dans Paramètres, on le prend
  if (fraisTotal > 0 && monEcoleNom) prixParEcole[cleEcolePrix(monEcoleNom)] = fraisTotal;
  if (fraisTotal > 0 && !prixSecoursGlobal) prixSecoursGlobal = fraisTotal;
}
async function enregistrerPrixParEcole() {
  let ecole = document.getElementById('selectNomEcolePrix')?.value || document.getElementById('inputNomEcolePrix')?.value.trim() || document.getElementById('prixEcoleNom')?.value.trim() || monEcoleNom;
  let prix = Number(document.getElementById('inputPrixEcole')?.value || document.getElementById('prixEcoleMontant')?.value || 0);
  if (!ecole || !prix) { alert("Mets l'école et le prix"); return; }
  try {
    await db.collection("prix_ecoles").doc(cleEcolePrix(ecole)).set({ ecole: ecole, ecoleNom: ecole, prix: prix, frais: prix, date: new Date().toISOString() });
    prixParEcole[cleEcolePrix(ecole)] = prix;
    prixSecoursGlobal = prix;
    // Si c'est l'école actuelle, on met aussi dans Gestion > Paramètres
    if (normaliser(ecole) === normaliser(monEcoleNom)) {
      fraisTotal = prix;
      syncFraisTotal();
      if (monEcoleId && monEcoleId !== "TOUTES") {
        await db.collection("configMatieres").doc(monEcoleId).set({ ecoleId: monEcoleId, ecoleNom: monEcoleNom, fraisTotal: prix, matieres: matieresActivesIds, typeComposition: typeComposition, date: new Date().toISOString() }, { merge: true });
      }
    }
    let m = document.getElementById('msgPrixEcole');
    if (m) { m.style.color = "green"; m.textContent = "✅ Prix enregistré : " + ecole + " = " + prix + " FCFA"; }
    alert("✅ Prix enregistré : " + ecole + " = " + prix + " FCFA");
    chargerElevesGestion(); chargerPaiementsGestion();
  } catch (e) { alert("❌ " + e.message); }
}
async function definirPrixEcole() { return enregistrerPrixParEcole(); }
async function enregistrerPrixSecours() {
  let v = Number(document.getElementById('inputPrixSecours')?.value || 0);
  if (!v) { alert("Mets un montant"); return; }
  prixSecoursGlobal = v;
  try { localStorage.setItem("prixSecours_" + monEcoleId, String(v)); } catch(e){}
  alert("✅ Prix secours : " + v + " FCFA");
  chargerPaiementsGestion();
}
function afficherPrixParEcole() {
  let box = document.getElementById('listePrixParEcole') || document.getElementById('listePrixEcoles');
  if (!box) return;
  if (!Object.keys(prixParEcole).length) { box.innerHTML = '<p class="centre muted">Aucun prix défini. Va dans Paramètres pour fixer le prix.</p>'; return; }
  let h = '<table class="table-blanc"><tr><th>École</th><th>Prix (Gestion > Paramètres)</th></tr>';
  Object.keys(prixParEcole).sort().forEach(function(k) {
    h += '<tr><td><b>' + k.replace(/_/g, " ") + '</b></td><td><b>' + prixParEcole[k].toLocaleString('fr-FR') + ' FCFA</b></td></tr>';
  });
  h += '</table>';
  box.innerHTML = h;
}
async function chargerRemises() {
  try {
    let snap = await db.collection("remises").limit(100).get();
    mesRemises = [];
    snap.forEach(function(doc) { mesRemises.push({ id: doc.id, ...doc.data() }); });
  } catch (e) { mesRemises = []; }
  afficherRemises();
}
function afficherRemises() {
  let box = document.getElementById('listeRemises');
  if (!box) return;
  if (!mesRemises.length) { box.innerHTML = '<p class="centre muted">Aucune remise.</p>'; return; }
  let h = '<table class="table-blanc"><tr><th>Élève</th><th>Montant remise</th><th>Motif</th></tr>';
  mesRemises.forEach(function(r) {
    h += '<tr><td><b>' + (r.eleve || r.enfant || "") + '</b></td><td><b>' + (r.montant || 0) + ' FCFA</b></td><td>' + (r.motif || "") + '</td></tr>';
  });
  h += '</table>';
  box.innerHTML = h;
}
async function enregistrerRemise() {
  let eleve = document.getElementById('remiseEleve')?.value || "";
  let montant = Number(document.getElementById('remiseMontant')?.value || 0);
  let motif = document.getElementById('remiseMotif')?.value || "Remise";
  if (!eleve || !montant) { alert("Choisis l'élève et le montant"); return; }
  try {
    await db.collection("remises").add({ eleve: eleve, enfant: eleve, montant: montant, motif: motif, ecole: monEcoleNom, date: new Date().toLocaleDateString('fr-FR'), createdAt: new Date() });
    alert("✅ Remise ajoutée");
    chargerRemises(); chargerPaiementsGestion();
  } catch (e) { alert("❌ " + e.message); }
}
async function ajouterRemise() { return enregistrerRemise(); }
async function chargerPresence() {
  let box = document.getElementById('listePresence');
  if (!box) return;
  try {
    let ecoleP = (document.getElementById('filtrePresenceEcole')?.value || "");
    let niveauP = (document.getElementById('filtrePresenceNiveau')?.value || "");
    let snap = await db.collection("presences").limit(500).get();
    TOUS_PRESENCES = [];
    snap.forEach(function(d) { let v = { id: d.id, ...d.data() }; if (ecoleP && normaliser(v.ecole) !== normaliser(ecoleP)) return; if (niveauP && String(v.niveau) !== String(niveauP)) return; TOUS_PRESENCES.push(v); });
    if (!TOUS_PRESENCES.length) { box.innerHTML = '<p class="centre muted">Aucune présence enregistrée pour cette école / niveau.</p>'; return; }
    let html = '<table class="table-blanc"><tr><th>Enseignant</th><th>Date</th><th>Niveau</th><th>École</th><th>Présents</th><th>Absents</th></tr>';
    TOUS_PRESENCES.slice().reverse().forEach(function(p) {
      html += '<tr><td><b>' + (p.enseignant || p.nomEnseignant || "") + '</b></td><td>' + (p.date || "") + '</td><td>' + (p.niveau || "") + '</td><td>' + (p.ecole || p.ecoleNom || "") + '</td><td>' + (p.presents || 0) + '</td><td>' + (p.absents || 0) + '</td></tr>';
    });
    html += '</table>';
    box.innerHTML = html;
  } catch (e) { box.innerHTML = "❌ " + e.message; }
}
function filtrerPresenceParEcoleNiveau() { chargerPresence(); }
function calculerBilanAnnuel() {
  let box = document.getElementById('listeBilanAnnuel');
  if (!box) return;
  let fEcole = (document.getElementById('filtreBilanEcole')?.value || "").trim();
  let fNiveau = (document.getElementById('filtreBilanNiveau')?.value || "").trim();
  let fTri = (document.getElementById('filtreBilanTrimestre')?.value || "").trim();
  let nbFixe = getNbMatieresFixees();
  let parEleve = {};
  TOUS_BULLETINS.forEach(function(b) {
    if (fTri && b.trimestre !== fTri) return;
    let eleveObj = TOUS_ELEVES_GESTION.find(function(e) { return normaliser(e.enfant || e.nomEnfant || "") === normaliser(b.eleve); });
    let ecoleEleve = (eleveObj && nomEcoleDeEleveSimple(eleveObj)) || b.ecole || "";
    let niveauEleve = (eleveObj && eleveObj.niveau) || "";
    if (fEcole && normaliser(ecoleEleve) !== normaliser(fEcole)) return;
    if (fNiveau && String(niveauEleve) !== String(fNiveau)) return;
    let k = normaliser(b.eleve);
    if (!parEleve[k]) parEleve[k] = { eleve: b.eleve, ecole: ecoleEleve, niveau: niveauEleve, total: 0, nb: 0 };
    parEleve[k].total += totalVraiNoteGestionJS(b);
    parEleve[k].nb++;
  });
  if (!Object.keys(parEleve).length) { box.innerHTML = '<p class="centre muted">Aucun bulletin annuel.</p>'; return; }
  let html = '<table class="table-blanc"><tr><th>Élève</th><th>École</th><th>Niveau</th><th>Notes</th><th>Moyenne</th><th>Action</th></tr>';
  Object.values(parEleve).sort(function(a,b){ return a.eleve.localeCompare(b.eleve); }).forEach(function(g) {
    let moy = (g.total / (g.nb || 1)).toFixed(2);
    html += '<tr><td><b>' + g.eleve + '</b></td><td>' + g.ecole + '</td><td>' + g.niveau + '</td><td>' + g.nb + ' / ' + nbFixe + '</td><td><b>' + moy + ' / 20</b></td><td><button class="lien-action" onclick="voirBulletinAnnuelEleveDetail(\'' + g.eleve + '\')">👁️ Voir Annuel</button></td></tr>';
  });
  html += '</table>';
  box.innerHTML = html;
}
function filtrerBilanAnnuel() { calculerBilanAnnuel(); }
function calculerBulletinAnnuelEleve(eleve) {
  let lignes = TOUS_BULLETINS.filter(function(b) { return normaliser(b.eleve) === normaliser(eleve); });
  let parMatiere = {};
  lignes.forEach(function(l) {
    if (!parMatiere[l.matiere]) parMatiere[l.matiere] = { matiere: l.matiere, total: 0, nb: 0 };
    parMatiere[l.matiere].total += totalVraiNoteGestionJS(l);
    parMatiere[l.matiere].nb++;
  });
  return Object.values(parMatiere).map(function(m) {
    return { matiere: m.matiere, moyenneAnnuelle: (m.total / (m.nb || 1)) };
  });
}
function voirBulletinAnnuelEleveDetail(eleve) {
  let annuelles = calculerBulletinAnnuelEleve(eleve);
  if (!annuelles.length) { alert("Aucune note annuelle pour " + eleve); return; }
  let ecoleSpecifique = ecoleDeEleveBulletin(eleve) || monEcoleNom;
  let moy = (annuelles.reduce(function(a,c){ return a + c.moyenneAnnuelle; }, 0) / (annuelles.length || 1)).toFixed(2);
  let html = '<div class="bulletin-page"><div style="text-align:center"><h2>☪️ INSTITUT NOUROUL IYMANE</h2><h3>🏫 ' + ecoleSpecifique + '</h3><p>Bulletin Annuel - ' + eleve + '</p></div>';
  html += '<table><tr><th>Matière</th><th>Moyenne Annuelle /20</th></tr>';
  annuelles.forEach(function(l) { html += '<tr><td>' + nomMatiereBulletinSelonLangue(l.matiere) + '</td><td><b>' + l.moyenneAnnuelle.toFixed(2) + '</b></td></tr>'; });
  html += '</table><div style="background:#FFF9C4;padding:12px;border-radius:10px;margin-top:12px;text-align:center"><b>MOYENNE GÉNÉRALE ANNUELLE : ' + moy + ' / 20</b></div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px;text-align:center"><div style="border-top:1px solid #333;padding-top:8px"><b>Le Directeur</b></div><div style="border-top:1px solid #333;padding-top:8px"><b>Le Parent</b></div></div></div>';
  document.getElementById('zoneImpression').innerHTML = html;
  document.getElementById('zoneImpression').style.display = "block";
  window.print();
}
function deblocquerBulletinEleve() {
  let nom = document.getElementById('deblocageEleve')?.value.trim() || "";
  if (!nom) { alert("Mets le nom de l'élève"); return; }
  alert("✅ Bulletin de " + nom + " débloqué (fonction info).");
}
function calculerReleveTrimestre() {
  let eleve = document.getElementById('releveEleve')?.value || "";
  let tri = document.getElementById('releveTrimestre')?.value || "Trimestre 1";
  let box = document.getElementById('resultatReleve');
  if (!box) return;
  if (!eleve) { box.innerHTML = "<p class='centre muted'>Choisis un élève.</p>"; return; }
  let lignes = TOUS_BULLETINS.filter(function(b) { return normaliser(b.eleve) === normaliser(eleve) && b.trimestre === tri; });
  if (!lignes.length) { box.innerHTML = "<p class='centre muted'>Aucune note pour " + eleve + " - " + tri + "</p>"; return; }
  let moy = calculerMoyenneTrimestre(lignes).toFixed(2);
  let html = "<h3>" + eleve + " - " + tri + "</h3><table class='table-blanc'><tr><th>Matière</th><th>Note /20</th></tr>";
  lignes.forEach(function(l) { html += "<tr><td>" + l.matiere + "</td><td><b>" + totalVraiNoteGestionJS(l) + "</b></td></tr>"; });
  html += "</table><p style='text-align:center'><b>Moyenne : " + moy + " / 20</b></p>";
  box.innerHTML = html;
}
function calculerTotauxParEcole() {
  let box = document.getElementById('totauxParEcole');
  if (!box) return;
  let par = {};
  TOUS_ELEVES_GESTION.forEach(function(e) {
    let n = nomEcoleDeEleveSimple(e) || "Sans école";
    if (!par[n]) par[n] = { eleves: 0, encaisse: 0 };
    par[n].eleves++;
  });
  TOUS_PAIEMENTS_GESTION.forEach(function(p) {
    if (!statutPaiementValide(p)) return;
    let e = TOUS_ELEVES_GESTION.find(function(x) { return normaliser(x.enfant||x.nomEnfant||"") === normaliser(p.enfant||p.enfantNom||""); });
    let n = e ? nomEcoleDeEleveSimple(e) : (p.ecole || p.ecoleNom || "Sans école");
    if (!par[n]) par[n] = { eleves: 0, encaisse: 0 };
    par[n].encaisse += Number(p.montant || 0);
  });
  if (!Object.keys(par).length) { box.innerHTML = '<p class="centre muted">Aucune donnée.</p>'; return; }
  let h = '<table class="table-blanc"><tr><th>École</th><th>Élèves</th><th>Encaissé</th></tr>';
  let totE = 0, totC = 0;
  Object.keys(par).sort().forEach(function(n) {
    totE += par[n].eleves; totC += par[n].encaisse;
    h += '<tr><td><b>' + n + '</b></td><td>' + par[n].eleves + '</td><td><b>' + par[n].encaisse.toLocaleString('fr-FR') + ' FCFA</b></td></tr>';
  });
  h += '<tr><td><b>TOTAL</b></td><td><b>' + totE + '</b></td><td><b>' + totC.toLocaleString('fr-FR') + ' FCFA</b></td></tr></table>';
  box.innerHTML = h;
}
function remplirFiltresEcole() {
  let noms = [...new Set(TOUS_ELEVES_GESTION.map(function(e) { return nomEcoleDeEleveSimple(e); }).filter(function(x){ return x; }))].sort();
  let selList = ['filtreEcoleEleves','filtreEcoleBulletin','filtreBilanEcole','filtrePresenceEcole','filtreActEcole','filtreDepEcole','selectNomEcolePrix'];
  selList.forEach(function(id) {
    let sel = document.getElementById(id);
    if (!sel) return;
    let garde = sel.value;
    let label = id === 'selectNomEcolePrix' ? '— Choisir école —' : '— Toutes les écoles —';
    sel.innerHTML = '<option value="">' + label + '</option>' + noms.map(function(n) { return '<option value="' + n + '">' + n + '</option>'; }).join('');
    if (garde && noms.includes(garde)) sel.value = garde;
  });
  let dl = document.getElementById('listeEcolesData');
  if (dl) dl.innerHTML = noms.map(function(n) { return '<option value="' + n + '">'; }).join('');
  let dl2 = document.getElementById('datalistEcoles');
  if (dl2) dl2.innerHTML = noms.map(function(n) { return '<option value="' + n + '">'; }).join('');
}
function remplirDatalistsRecherche() {
  let nomsEleves = [...new Set(TOUS_ELEVES_GESTION.map(function(e) { return e.enfant || e.nomEnfant || ""; }).filter(function(x){ return x; }))].sort();
  let dl = document.getElementById('datalistEleves');
  if (dl) dl.innerHTML = nomsEleves.map(function(n) { return '<option value="' + n + '">'; }).join('');
  let dlE = document.getElementById('datalistEnseignants');
  if (dlE) dlE.innerHTML = TOUS_ENSEIGNANTS.map(function(e) { return '<option value="' + e.nom + '">'; }).join('');
}
async function chargerDivers() {
  let box = document.getElementById('listeDivers');
  if (!box) return;
  try {
    let snap = await db.collection("divers").limit(100).get();
    let h = "";
    snap.forEach(function(doc) {
      let d = doc.data();
      if (!estAMoiGestion(d)) return;
      h += '<p style="font-size:13px">📌 <b>' + (d.titre || "") + '</b> - ' + (d.texte || "") + ' <button onclick="supprimerDivers(\'' + doc.id + '\')">🗑️</button></p>';
    });
    box.innerHTML = h || "<p class='muted centre'>Aucune info divers.</p>";
  } catch (e) { box.innerHTML = "❌ " + e.message; }
}
async function ajouterDivers() {
  let titre = document.getElementById('diversTitre')?.value.trim() || "";
  let texte = document.getElementById('diversTexte')?.value.trim() || "";
  if (!titre) { alert("Mets un titre"); return; }
  try {
    await db.collection("divers").add({ titre: titre, texte: texte, ecole: monEcoleNom, ecoleNom: monEcoleNom, date: new Date().toLocaleDateString('fr-FR'), createdAt: new Date() });
    alert("✅ Divers ajouté");
    chargerDivers();
  } catch (e) { alert("❌ " + e.message); }
}
async function supprimerDivers(id) {
  if (!confirm("Supprimer ?")) return;
  try { await db.collection("divers").doc(id).delete(); chargerDivers(); } catch (e) { alert("❌ " + e.message); }
}
function exporterBulletinsPDF() { window.print(); }
function exporterBulletinsWhatsApp() {
  let txt = "📚 Bulletins - " + monEcoleNom + "\n";
  TOUS_BULLETINS.slice(0,20).forEach(function(b) { txt += "- " + b.eleve + " : " + b.matiere + " = " + b.moyenne + "\n"; });
  window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank");
}
function filtrerBulletinsAnnuels() { calculerBilanAnnuel(); }
// ===== FIN PARTIE 3 CORRIGÉE =====
// ===== PARTIE 4 CORRIGÉE - ACTIVITES & DEPENSES / EVOLUTION PAYES / SOLDE NET =====
async function chargerActivitesDepenses() {
  remplirDatalistsRecherche();
  let fAct = (document.getElementById('filtreActEcole')?.value || "").trim();
  let boxA = document.getElementById('listeActivites');
  if (boxA) {
    try {
      let snap = await db.collection("divers").limit(50).get();
      let h = "";
      snap.forEach(function(doc) {
        let d = doc.data();
        if (fAct && !normaliser(d.ecole || d.ecoleNom || d.groupe || "").includes(normaliser(fAct))) return;
        h += '<p style="font-size:13px"><b>' + (d.titre || "") + '</b> - ' + (d.texte || "") + ' - <b>' + (d.ecole || "") + '</b></p>';
      });
      boxA.innerHTML = h || "<p class='muted centre'>Aucune activité pour cette école.</p>";
    } catch (e) { boxA.innerHTML = "❌ " + e.message; }
  }
  let fDep = (document.getElementById('filtreDepEcole')?.value || "").trim();
  try {
    let snap = await db.collection("depenses").limit(500).get();
    GESTION_DEPENSES = [];
    snap.forEach(function(d) {
      let v = { id: d.id, ...d.data() };
      if (fDep && !normaliser(v.ecole || v.ecoleNom || v.groupe || "").includes(normaliser(fDep))) return;
      GESTION_DEPENSES.push(v);
    });
    let box = document.getElementById('listeDepenses');
    if (box) {
      if (!GESTION_DEPENSES.length) { box.innerHTML = '<p class="centre muted">Aucune dépense pour cette école.</p>'; }
      else {
        let h = '<table class="table-blanc"><thead><tr><th>Date</th><th>Motif</th><th>École</th><th>Montant</th><th>Statut</th></tr></thead><tbody>';
        GESTION_DEPENSES.slice().reverse().forEach(function(d) {
          let badgeStatut = (d.statut === "en_attente") ? '<span class="badge badge-attente">⏳ EN ATTENTE</span>' : (d.statut === "refuse" ? '<span class="badge badge-nonpaye">❌ REFUSÉ</span>' : '<span class="badge badge-paye">✅ VALIDÉ</span>');
          h += '<tr><td>' + (d.date || "") + '</td><td><b>' + (d.motif || "") + '</b></td><td>' + (d.ecole || d.ecoleNom || d.groupe || "") + '</td><td><b>' + Number(d.montant || 0).toLocaleString('fr-FR') + ' FCFA</b></td><td>' + badgeStatut + '</td></tr>';
        });
        h += '</tbody></table>';
        box.innerHTML = h;
      }
    }
    calculerTotauxDepensesParEcole();
  } catch (e) { console.log(e.message); }
}
async function ajouterActivite() {
  let ecole = document.getElementById('actEcole')?.value || monEcoleNom;
  let titre = document.getElementById('actTitre')?.value.trim() || "";
  let desc = document.getElementById('actDesc')?.value.trim() || "";
  let type = document.getElementById('actType')?.value || "Activité";
  if (!titre) { alert("Mets le titre"); return; }
  await db.collection("divers").add({ titre: type + " - " + titre, texte: desc, ecole: ecole, ecoleNom: ecole, date: new Date().toLocaleDateString('fr-FR'), createdAt: new Date() });
  document.getElementById('msgActivite').textContent = "✅ Activité ajoutée";
  chargerActivitesDepenses();
}
async function ajouterDepense() {
  let ecole = document.getElementById('depEcole')?.value || monEcoleNom;
  let motif = document.getElementById('depMotif')?.value.trim() || "";
  let montant = Number(document.getElementById('depMontant')?.value || 0);
  let cat = document.getElementById('depCategorie')?.value || "Autre";
  let date = document.getElementById('depDate')?.value || new Date().toLocaleDateString('fr-FR');
  if (!motif || !montant) { alert("Mets motif + montant"); return; }
  let statutDepense = (monRoleGestion === "sous-directeur") ? "en_attente" : "valide";
  await db.collection("depenses").add({ ecole: ecole, ecoleNom: ecole, groupe: ecole, motif: cat + " - " + motif, montant: montant, date: date, payeur: document.getElementById('depPayeur')?.value || "", statut: statutDepense, faitPar: emailSD || "", faitParRole: monRoleGestion || "", createdAt: new Date() });
  document.getElementById('msgDepense').textContent = (statutDepense === "en_attente") ? "⏳ Dépense envoyée en attente. Le Directeur doit valider dans Liaison." : "✅ Dépense ajoutée et validée";
  chargerActivitesDepenses();
}
function calculerTotauxDepensesParEcole() {
  let box = document.getElementById('totauxDepensesParEcole');
  if (!box) return;
  let par = {};
  GESTION_DEPENSES.forEach(function(d) {
    let n = d.ecole || d.ecoleNom || d.groupe || "Sans école";
    par[n] = (par[n] || 0) + Number(d.montant || 0);
  });
  if (!Object.keys(par).length) { box.innerHTML = '<p class="centre muted">Aucune dépense.</p>'; return; }
  let h = '<table class="table-blanc"><tr><th>École</th><th>Total Dépenses</th></tr>';
  let tot = 0;
  Object.keys(par).sort().forEach(function(n) {
    tot += par[n];
    h += '<tr><td><b>' + n + '</b></td><td><b>' + par[n].toLocaleString('fr-FR') + ' FCFA</b></td></tr>';
  });
  h += '<tr><td><b>TOTAL</b></td><td><b>' + tot.toLocaleString('fr-FR') + ' FCFA</b></td></tr></table>';
  box.innerHTML = h;
}
function filtrerDepenses() { chargerActivitesDepenses(); }
function partagerDepensesWhatsApp() { window.open("https://wa.me/?text=" + encodeURIComponent("Dépenses - " + monEcoleNom), "_blank"); }
function envoyerDepensesMail() { alert("Utilise le PDF."); }
function remplirFiltreEvolutionEnseignants() {
  var sel = document.getElementById('evolutionEnseignantSelect');
  if (!sel) return;
  var garde = sel.value;
  sel.innerHTML = '<option value="">— Tous les enseignants —</option>';
  TOUS_ENSEIGNANTS.forEach(function(e) {
    sel.innerHTML += '<option value="' + e.nom + '">' + e.nom + ' - ' + (e.role || "") + '</option>';
  });
  if (garde) sel.value = garde;
}
async function calculerEvolutionPaieEnseignants() {
  var box = document.getElementById('evolutionPaieEnseignants');
  if (!box) return;
  var filtreNom = document.getElementById('evolutionEnseignantSelect')?.value || "";
  box.innerHTML = "<p class='centre muted'>⏳ Calcul...</p>";
  var depensesSalaire = [];
  try {
    var snap = await db.collection("depenses").limit(500).get();
    snap.forEach(function(doc) {
      var d = doc.data();
      var motif = String(d.motif || "") + " " + String(d.categorie || "");
      if (!motif.toLowerCase().includes("salaire")) return;
      if (d.statut === "en_attente" || d.statut === "refuse") return;
      if (!modeToutesEcoles && !estAMoiGestion(d)) return;
      depensesSalaire.push(d);
    });
  } catch (e) { console.log("Evolution : " + e.message); }
  var liste = TOUS_ENSEIGNANTS;
  if (filtreNom) liste = TOUS_ENSEIGNANTS.filter(function(e) { return e.nom === filtreNom; });
  if (!liste.length) { box.innerHTML = "<p class='centre muted'>Aucun enseignant.</p>"; return; }
  var html = "<table class='table-blanc'><tr><th>Enseignant</th><th>Salaire prévu</th><th>Déjà payé</th><th>Reste</th><th>État</th></tr>";
  liste.forEach(function(ens) {
    var prevu = Number(ens.salaire || 0);
    var dejaPaye = 0;
    depensesSalaire.forEach(function(d) {
      var motif = String(d.motif || "");
      if (motif.toLowerCase().includes(ens.nom.toLowerCase())) dejaPaye += Number(d.montant || 0);
    });
    var reste = Math.max(0, prevu - dejaPaye);
    var etat = (prevu > 0 && dejaPaye >= prevu) ? "✅ PAYÉ" : (dejaPaye > 0 ? "◐ AVANCE" : "✗ NON PAYÉ");
    html += "<tr><td><b>" + ens.nom + "</b><br><small>" + (ens.role || "") + "</small></td>";
    html += "<td><b>" + prevu.toLocaleString('fr-FR') + " FCFA</b></td>";
    html += "<td><b>" + dejaPaye.toLocaleString('fr-FR') + " FCFA</b></td>";
    html += "<td><b style='color:red'>" + reste.toLocaleString('fr-FR') + " FCFA</b></td>";
    html += "<td>" + etat + "</td></tr>";
  });
  html += "</table>";
  html += "<p class='centre muted' style='margin-top:8px'>Seules les dépenses VALIDÉES dans Liaison comptent. Les EN ATTENTE ne comptent pas.</p>";
  box.innerHTML = html;
}
async function payerEnseignant(nom, salaire) {
  if (!confirm("Payer " + nom + " ?\nMontant : " + salaire + " FCFA")) return;
  try {
    let statutDepense = (monRoleGestion === "sous-directeur") ? "en_attente" : "valide";
    await db.collection("depenses").add({ ecole: monEcoleNom, ecoleNom: monEcoleNom, groupe: monEcoleNom, motif: "Salaire - " + nom, categorie: "Salaire", montant: Number(salaire || 0), date: new Date().toLocaleDateString('fr-FR'), payeur: "Gestion", enseignant: nom, statut: statutDepense, faitPar: emailSD || "", faitParRole: monRoleGestion || "", createdAt: new Date() });
    alert((statutDepense === "en_attente") ? "⏳ " + nom + " envoyé en attente. Le Directeur doit valider dans Liaison." : "✅ " + nom + " payé : " + salaire + " FCFA");
    calculerEvolutionPaieEnseignants();
    calculerSoldeNetEnseignants();
  } catch (e) { alert("❌ " + e.message); }
}
async function calculerSoldeNetEnseignants() {
  var box = document.getElementById('soldeNetEnseignants');
  if (!box) return;
  box.innerHTML = "<p class='centre muted'>⏳ Calcul...</p>";
  var encaisse = calculerEncaisseOfficiel();
  var payeEnseignant = 0;
  try {
    var snap = await db.collection("depenses").limit(500).get();
    snap.forEach(function(doc) {
      var d = doc.data();
      var motif = String(d.motif || "") + " " + String(d.categorie || "");
      if (!motif.toLowerCase().includes("salaire")) return;
      if (d.statut === "en_attente" || d.statut === "refuse") return;
      if (!modeToutesEcoles && !estAMoiGestion(d)) return;
      payeEnseignant += Number(d.montant || 0);
    });
  } catch (e) { console.log("Solde net : " + e.message); }
  var soldeNet = encaisse - payeEnseignant;
  box.innerHTML = "<table class='table-blanc'>" +
    "<tr><th>Encaissé (élèves validés)</th><td><b>" + encaisse.toLocaleString('fr-FR') + " FCFA</b></td></tr>" +
    "<tr><th>Paye enseignants (Dépenses Salaire VALIDÉES)</th><td><b>" + payeEnseignant.toLocaleString('fr-FR') + " FCFA</b></td></tr>" +
    "<tr><th>Solde net</th><td><b>" + soldeNet.toLocaleString('fr-FR') + " FCFA</b></td></tr>" +
    "</table><p class='centre muted' style='margin-top:8px'>Solde net = Encaissé - Paye validée. Les EN ATTENTE ne comptent pas.</p>";
}
function telechargerPaiementsPDF() { window.print(); }
if (typeof auth !== "undefined") {
  auth.onAuthStateChanged(async function(user) {
    if (user) {
      let s = localStorage.getItem("gestion_session");
      if (s) {
        try {
          let j = JSON.parse(s);
          if (j.email === user.email) {
            monRoleGestion = j.role || "sous-directeur";
            modeToutesEcoles = !!j.toutes;
            await chargerMonEcoleGestion(user.email);
          }
        } catch (e) {}
      }
    }
  });
}
window.addEventListener('load', function() {
  let s = localStorage.getItem("gestion_session");
  if (s && typeof auth !== "undefined" && auth.currentUser) {
    try { let j = JSON.parse(s); chargerMonEcoleGestion(j.email); } catch (e) {}
  }
});
// ===== FIN PARTIE 4 CORRIGÉE - FIN DU FICHIER gestion.js =====



