
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyCZ4Be46dSTLIoDSG54Vpyxz5_tReyu45Q",
  authDomain: "barbearia-maciel-fcf35.firebaseapp.com",
  projectId: "barbearia-maciel-fcf35",
  storageBucket: "barbearia-maciel-fcf35.appspot.com",
  messagingSenderId: "796176856173",
  appId: "1:796176856173:web:b0e287f6fc09cd65a77b64"
};

const app = initializeApp(firebaseConfig);

// Configuração dinâmica da persistência de login para Celular vs Web
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' 
    ? browserLocalPersistence 
    : getReactNativePersistence(AsyncStorage)
});

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});