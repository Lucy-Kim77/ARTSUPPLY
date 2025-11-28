// assets/js/firebase-config.js
// Initialize Firebase app, Auth, Firestore & Storage (v9+ modular style)

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
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

// Your existing config
const firebaseConfig = {
  apiKey: "AIzaSyArpnMN7nmuYe_U7X0k8sga2JflaBOTeGw",
  authDomain: "artsupply-fa963.firebaseapp.com",
  projectId: "artsupply-fa963",
  storageBucket: "artsupply-fa963.firebasestorage.app",
  messagingSenderId: "290282337476",
  appId: "1:290282337476:web:902594c84b1d8a5e7d0591",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {
  app,
  auth,
  db,
  storage,
  onAuthStateChanged,
  signOut,
  // Firestore helpers
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  // Storage helpers
  storageRef,
  uploadBytesResumable,
  getDownloadURL,
};
