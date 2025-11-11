// index.js
import { auth, db, firebaseHelpers } from './firebase-init.js';
import { collection, query, where, getDocs, limit } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

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

    if (!identifier.includes('@')) {
      const q = query(collection(db, 'users'), where('username', '==', identifier), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) return setMessage('User not found.');
      const userDoc = snap.docs[0].data();
      emailToUse = userDoc.email;
    }

    await firebaseHelpers.signInWithEmailAndPassword(auth, emailToUse, password);

    // redirect to dashboard
    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error('login error', err);
    setMessage(err.message || 'Login failed');
  }
});
