// firebase.js - Connexion Firebase

const firebaseConfig = {
  apiKey: "AIzaSyBOp24E27qtwEC0tZ41vMagPZF3bm7GPMY",
  authDomain: "an-nourou-iman.firebaseapp.com",
  projectId: "an-nourou-iman",
  storageBucket: "an-nourou-iman.firebasestorage.app",
  messagingSenderId: "525522109818",
  appId: "1:525522109818:web:b825845755aed53fa382c3"
};

// FIX : On vérifie que Firebase est bien chargé avant de l'utiliser
if (typeof firebase === 'undefined') {
  console.error("❌ Firebase n'est pas chargé. Vérifie ta connexion internet et les scripts <script src=...> dans index.html");
} else {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Si tu utilises l'auth dans admin.html / gestion.html, on l'expose aussi
const auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;