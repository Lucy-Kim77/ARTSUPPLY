// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyArpnMN7nmuYe_U7X0k8sga2JflaBOTeGw",
  authDomain: "artsupply-fa963.firebaseapp.com",
  projectId: "artsupply-fa963",
  storageBucket: "artsupply-fa963.firebasestorage.app",
  messagingSenderId: "290282337476",
  appId: "1:290282337476:web:902594c84b1d8a5e7d0591"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  app,
  auth,
  db,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
};



/*// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArpnMN7nmuYe_U7X0k8sga2JflaBOTeGw",
  authDomain: "artsupply-fa963.firebaseapp.com",
  projectId: "artsupply-fa963",
  storageBucket: "artsupply-fa963.firebasestorage.app",
  messagingSenderId: "290282337476",
  appId: "1:290282337476:web:902594c84b1d8a5e7d0591"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);*/
