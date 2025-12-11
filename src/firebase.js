import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tu configuración REAL (Copiada de lo que me pasaste)
const firebaseConfig = {
  apiKey: "AIzaSyDzQjbVr1-E98UI0GZwqDddYd8S39BkEy4",
  authDomain: "footagepusher-app.firebaseapp.com",
  projectId: "footagepusher-app",
  storageBucket: "footagepusher-app.firebasestorage.app",
  messagingSenderId: "412727153592",
  appId: "1:412727153592:web:260ee90b3153adb46bf54d"
};

// 1. Inicializar la App
const app = initializeApp(firebaseConfig);

// 2. Preparar la Autenticación (Esta "auth" servirá para Google, Email y Anónimo)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 3. Preparar la Base de Datos
export const db = getFirestore(app);