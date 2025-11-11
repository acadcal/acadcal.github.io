// register.js
import { auth, db, firebaseHelpers } from './firebase-init.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

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
    const userCredential = await firebaseHelpers.createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

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

    // redirect to dashboard (user already signed in by Firebase)
    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error('register error', err);
    setMessage(err.message || 'Registration failed.');
  }
});
