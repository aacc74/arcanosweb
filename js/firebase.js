// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAY9aPCtpNEv77Bmm3ITDwuwg7FPSWVHTA",
    authDomain: "arcanosweb-3a746.firebaseapp.com",
    projectId: "arcanosweb-3a746",
    storageBucket: "arcanosweb-3a746.appspot.com",
    messagingSenderId: "708200899753",
    appId: "1:708200899753:web:eafb8bf818a25fdbfd75b8"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();