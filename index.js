// index.js (updated)
// Resolves username via public usernames/{username} mapping before attempting sign-in.

import { auth, db, firebaseHelpers } from './firebase-init.js';
import { collection, doc, getDoc, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const loginBtn = document.getElementById('login-btn');
const msgEl = document.getElementById('login-msg');

function setMessage(text) {
  if (msgEl) msgEl.textContent = text; else console.warn(text);
}

loginBtn?.addEventListener('click', async (ev) => {
  ev.preventDefault();
  setMessage('');

  const identifier = document.getElementById('login-username')?.value?.trim();
  const password = document.getElementById('login-password')?.value?.trim();

  if (!identifier) return setMessage('Please enter username or email.');
  if (!password) return setMessage('Please enter password.');

  try {
    let emailToUse = identifier;

    // If input doesn't contain '@', treat it as username and look up the public mapping
    if (!identifier.includes('@')) {
      const usernameKey = identifier.toLowerCase();
      const mappingSnap = await getDoc(doc(db, 'usernames', usernameKey));
      if (!mappingSnap.exists()) return setMessage('User not found.');
      const mapping = mappingSnap.data();
      emailToUse = mapping.email;
      if (!emailToUse) return setMessage('User mapping invalid. Use email to sign-in.');
    }

    await firebaseHelpers.signInWithEmailAndPassword(auth, emailToUse, password);

    // redirect to dashboard
    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error('login error', err);
    // Common Firebase error handling
    if (err && err.code === 'auth/wrong-password') setMessage('Incorrect password.');
    else if (err && err.code === 'auth/user-not-found') setMessage('Account not found.');
    else setMessage(err.message || 'Login failed');
  }
});
