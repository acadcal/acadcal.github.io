// register.js - robust registration (handles optional email input)
// Saves users to localStorage key "ac_users" and active profile to "ac_user"

(function () {
  const roleSel = document.getElementById('role');
  const studentFields = document.getElementById('student-fields');
  const registerBtn = document.getElementById('register-btn');
  const msgEl = document.getElementById('register-msg');

  if (!registerBtn) return; // not on register page

  function setMessage(text) {
    if (msgEl) msgEl.textContent = text;
    else console.warn('register message:', text);
  }

  function loadUsers() {
    try {
      return JSON.parse(localStorage.getItem('ac_users')) || [];
    } catch (e) {
      console.error('Failed to read ac_users', e);
      return [];
    }
  }
  function saveUsers(users) {
    try {
      localStorage.setItem('ac_users', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save ac_users', e);
    }
  }
  function saveActiveProfile(profile) {
    try {
      localStorage.setItem('ac_user', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save ac_user', e);
    }
  }

  // toggle student fields visibility if that control exists
  roleSel?.addEventListener('change', () => {
    if (roleSel.value === 'Student') studentFields?.classList.remove('hidden');
    else studentFields?.classList.add('hidden');
  });

  registerBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    setMessage('');

    const role = document.getElementById('role')?.value?.trim();
    const username = document.getElementById('username')?.value?.trim();
    const emailInput = document.getElementById('email'); // optional
    const email = emailInput ? (emailInput.value || '').trim() : '';
    const password = document.getElementById('password')?.value || '';

    // Basic required checks (email only required if the field exists)
    if (!role) return setMessage('Please select a role.');
    if (!username) return setMessage('Please enter a username.');
    if (!password) return setMessage('Please enter a password.');
    if (emailInput && !email) return setMessage('Please enter an email address.');

    const users = loadUsers();
    if (users.some(u => u.username === username)) {
      return setMessage('Username already taken. Choose another.');
    }

    // If Student role, validate student fields (if present in DOM)
    let studentNumber = '', studentName = '', studentAge = '', studentYear = '';
    if (role === 'Student') {
      studentNumber = document.getElementById('student-number')?.value?.trim() || '';
      studentName = document.getElementById('student-name')?.value?.trim() || '';
      studentAge = document.getElementById('student-age')?.value || '';
      studentYear = document.getElementById('student-year')?.value?.trim() || '';

      // Only require fields that are present in DOM
      const missing = [];
      if (document.getElementById('student-number') && !studentNumber) missing.push('student number');
      if (document.getElementById('student-name') && !studentName) missing.push('full name');
      if (document.getElementById('student-year') && !studentYear) missing.push('year level');

      if (missing.length > 0) return setMessage('Please complete student fields: ' + missing.join(', ') + '.');
    }

    // Create user object and store
    const newUser = {
      username,
      email,
      password, // plain text for prototype only
      role,
      studentNumber,
      studentName,
      studentAge,
      studentYear,
      createdAt: Date.now()
    };

    users.push(newUser);
    saveUsers(users);

    // also save active profile so dashboard sees it immediately
    const profile = {
      username: newUser.username,
      role: newUser.role,
      studentNumber: newUser.studentNumber,
      studentName: newUser.studentName,
      studentAge: newUser.studentAge,
      studentYear: newUser.studentYear
    };
    saveActiveProfile(profile);

    // redirect to dashboard (user is "logged in")
    window.location.href = 'dashboard.html';
  });
})();
