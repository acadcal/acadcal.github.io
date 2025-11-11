// firebase-init.js
// Central module that exports auth, db, and a small helper wrapper using the globally-initialized app (window.__fb).
// Make sure each HTML page includes the inline initializer that sets window.__fb before importing this module.

import {
  createUserWithEmailAndPassword as _createUserWithEmailAndPassword,
  signInWithEmailAndPassword as _signInWithEmailAndPassword,
  signOut as _signOut,
  onAuthStateChanged as _onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import { serverTimestamp as _serverTimestamp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const getAuth = window.__fb?.getAuth;
const getFirestore = window.__fb?.getFirestore;
const app = window.__fb?.app;

if (!getAuth || !getFirestore || !app) {
  throw new Error('Firebase not initialized. Ensure the inline initializer script is present in <head> of your HTML pages.');
}

export const auth = getAuth(app);
export const db = getFirestore(app);

export const firebaseHelpers = {
  createUserWithEmailAndPassword: _createUserWithEmailAndPassword,
  signInWithEmailAndPassword: _signInWithEmailAndPassword,
  signOut: _signOut,
  onAuthStateChanged: _onAuthStateChanged,
  serverTimestamp: _serverTimestamp
};
