
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Inicialização e exportação dos serviços necessários para o App.tsx
export const auth = getAuth(app);
export const db = getFirestore(app);

// Inicialização segura do Analytics
let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) analytics = getAnalytics(app);
  });
}

export { app, analytics };
