// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBmDteoc5cZNd926OFZdg-ZRyqvCJcMtNA",
  authDomain: "feedback-app-414af.firebaseapp.com",
  projectId: "feedback-app-414af",
  storageBucket: "feedback-app-414af.firebasestorage.app",
  messagingSenderId: "220037378686",
  appId: "1:220037378686:web:f43d0fc2228daebada1e2f",
  measurementId: "G-9QR74LS7SX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
