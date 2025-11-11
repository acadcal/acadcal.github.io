// register.js (updated)
// Writes a public username->email mapping to usernames/{username} so login-by-username can be resolved before auth.

import { auth, db, firebaseHelpers } from './firebase-init.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const roleSel = document.getElementById('role');
const studentFields = document.getElementById('student-fields');
const registerBtn = document.getElementById('register-btn');
const msgEl = document.getElementById('register-msg');

if (roleSel) {
  roleSel.addEventListener('change', () => {
    if (roleSel.value === 'Student') studentFields?.classList.remove('hidden');
    else studentFields?.classList.add('hidden');
    const account = document.getElementById('account-fields');
    if (roleSel.value) account.classList.remove('hidden'); else account.classList.add('hidden');
  });
}

function setMessage(text) {
  if (msgEl) msgEl.textContent = text; else console.warn(text);
}

registerBtn?.addEventListener('click', async (ev) => {
  ev.preventDefault();
  setMessage('');

  const role = document.getElementById('role')?.value?.trim();
  const email = document.getElementById('email')?.value?.trim();
  const username = document.getElementById('username')?.value?.trim();
  const password = document.getElementById('password')?.value || '';

  if (!role) return setMessage('Please select a role.');
  if (!email) return setMessage('Please enter an email address.');
  if (!username) return setMessage('Please enter a username.');
  if (!password || password.length < 6) return setMessage('Password must be at least 6 characters.');

  let studentNumber = '', studentName = '', studentAge = '', studentYear = '';
  if (role === 'Student') {
    studentNumber = document.getElementById('student-number')?.value?.trim() || '';
    studentName = document.getElementById('student-name')?.value?.trim() || '';
    studentAge = document.getElementById('student-age')?.value || '';
    studentYear = document.getElementById('student-year')?.value?.trim() || '';

    const missing = [];
    if (document.getElementById('student-number') && !studentNumber) missing.push('student number');
    if (document.getElementById('student-name') && !studentName) missing.push('full name');
    if (document.getElementById('student-year') && !studentYear) missing.push('year level');
    if (missing.length > 0) return setMessage('Please complete student fields: ' + missing.join(', '));
  }

  try {
    // Prevent duplicate username: check the usernames collection
    const usernameDocRef = doc(db, 'usernames', username.toLowerCase());
    const existing = await getDoc(usernameDocRef);
    if (existing.exists()) {
      return setMessage('Username already taken. Choose another.');
    }

    // create auth user
    const userCredential = await firebaseHelpers.createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // user profile doc
    const userDoc = {
      username,
      email,
      role,
      studentNumber,
      studentName,
      studentAge: studentAge ? Number(studentAge) : '',
      studentYear,
      createdAt: firebaseHelpers.serverTimestamp()
    };

    await setDoc(doc(db, 'users', uid), userDoc);

    // public username mapping (lowercased key)
    await setDoc(usernameDocRef, { uid, email });

    // redirect
    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error('register error', err);
    // handle common errors
    if (err && err.code === 'auth/email-already-in-use') setMessage('Email already in use.');
    else setMessage(err.message || 'Registration failed.');
  }
});
