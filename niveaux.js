const NIVEAUX = [
{ nom:"Niveau 1 • Fondation", age:"4-6 ans", couleur:"#2E7D32", emoji:"🌱", desc:"Le premier pas. L'enfant découvre l'amour du Coran avec douceur.", matieres:[ {nom:"📖 Coran", lecon:"Al-Fatiha + 3 petites sourates"}, {nom:"✍️ Arabe", lecon:"Reconnaître les lettres ا ب ت"}, {nom:"🎙️ Tajwid", lecon:"Bien prononcer chaque lettre"}, {nom:"📜 Hadith", lecon:"5 hadiths courts"}, {nom:"🤲 Akhlaq", lecon:"Dire Salam, Respect des parents"} ] },
{ nom:"Niveau 2 • Lecture", age:"6-8 ans", couleur:"#1565C0", emoji:"📖", desc:"L'enfant commence à lire seul.", matieres:[ {nom:"📖 Coran", lecon:"Juz Amma - Premières sourates"}, {nom:"✍️ Arabe", lecon:"Lire les mots + syllabes"}, {nom:"🎙️ Tajwid", lecon:"Les voyelles + allongements"}, {nom:"📜 Hadith", lecon:"10 hadiths"}, {nom:"🤲 Akhlaq", lecon:"Propreté, Partage, Honnêteté"} ] },
{ nom:"Niveau 3 • Approfondissement", age:"8-10 ans", couleur:"#6A1B9A", emoji:"🕌", desc:"Il ne lit plus seulement, il comprend.", matieres:[ {nom:"📖 Coran", lecon:"Juz Amma complet"}, {nom:"✍️ Arabe", lecon:"Lire des phrases + écrire"}, {nom:"🎙️ Tajwid", lecon:"Règles de base"}, {nom:"📜 Hadith", lecon:"20 hadiths + leur sens"}, {nom:"🤲 Akhlaq", lecon:"Patience, Respect du maître"} ] },
{ nom:"Niveau 4 • Maîtrise", age:"10-12 ans", couleur:"#E65100", emoji:"✍️", desc:"L'enfant devient autonome.", matieres:[ {nom:"📖 Coran", lecon:"Mémorisation + Révision"}, {nom:"✍️ Arabe", lecon:"Écriture + Compréhension"}, {nom:"🎙️ Tajwid", lecon:"Toutes les règles"}, {nom:"📜 Hadith", lecon:"30 hadiths + Explication"}, {nom:"🤲 Akhlaq", lecon:"Comportement du bon musulman"} ] },
{ nom:"Niveau 5 • Excellence", age:"12 ans +", couleur:"#B8860B", emoji:"🎓", desc:"L'élève est prêt, il peut aider les plus petits.", matieres:[ {nom:"📖 Coran", lecon:"Mémorisation avancée"}, {nom:"✍️ Arabe", lecon:"Expression + Rédaction"}, {nom:"🎙️ Tajwid", lecon:"Maîtrise complète"}, {nom:"📜 Hadith", lecon:"40 hadiths + Enseignement"}, {nom:"🤲 Akhlaq", lecon:"Être un exemple"} ] },
];
function afficherNiveaux(){
  document.getElementById('listeNiveaux').innerHTML = NIVEAUX.map((n,i)=>`
  <div class="niveau-pro" style="--c:${n.couleur}">
  <div class="niveau-num">${i+1}</div><span class="niveau-age">👶 ${n.age}</span>
  <h3>${n.emoji} ${n.nom}</h3><p>${n.desc}</p>
  <div style="background:#FDF8EE;padding:10px;border-radius:12px;margin-top:10px">
  <b style="font-size:12px">📚 MÊME PROGRAMME - LEÇONS DIFFÉRENTES</b>
  ${n.matieres.map(m=>`<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #FDE68A;font-size:13px"><b style="min-width:90px">${m.nom}</b><span>${m.lecon}</span></div>`).join('')}
  </div></div>`).join('');
}