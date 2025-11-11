// firebase-init.js
// Exposes auth, db and helper wrappers using the globally-initialized app (window.__fb)

import { serverTimestamp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import {
  createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
  signInWithEmailAndPassword as _signInWithEmailAndPassword,
  signOut as _signOut,
  onAuthStateChanged as _onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const getAuth = window.__fb?.getAuth;
const getFirestore = window.__fb?.getFirestore;
const app = window.__fb?.app;

if (!getAuth || !getFirestore || !app) {
  throw new Error('Firebase not initialized. Ensure the inline initializer script is present in head of HTML pages.');
}

export const auth = getAuth(app);
export const db = getFirestore(app);

export const firebaseHelpers = {
  createUserWithEmailAndPassword: _createUserWithEmailAndPassword,
  signInWithEmailAndPassword: _signInWithEmailAndPassword,
  signOut: _signOut,
  onAuthStateChanged: _onAuthStateChanged,
  serverTimestamp
};
