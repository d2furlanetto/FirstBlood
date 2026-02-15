
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Configuração do Firebase para o projeto COMANDOS
const firebaseConfig = {
  apiKey: "AIzaSyANfdrzmup0F4C3A1ACzhgJ4YREvuqyFJU",
  authDomain: "comandos-firstblood.firebaseapp.com",
  projectId: "comandos-firstblood",
  storageBucket: "comandos-firstblood.firebasestorage.app",
  messagingSenderId: "955788028742",
  appId: "1:955788028742:web:12e0d2a3f038dc1b3bd347",
  measurementId: "G-EV3VM9ZD6X"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);

// Inicialização dos serviços associados à instância do app
const auth = getAuth(app);
const db = getFirestore(app);

// Inicialização segura do Analytics
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

export { app, auth, db };
