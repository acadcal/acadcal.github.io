// index.js - login page (robust, uses ac_users and writes ac_user on success)

(function () {
  const loginBtn = document.getElementById('login-btn');
  const msgEl = document.getElementById('login-msg');

  if (!loginBtn) return; // not on login page

  function setMessage(text) {
    if (msgEl) msgEl.textContent = text;
    else console.warn('login message:', text);
  }

  function loadUsers() {
    try {
      return JSON.parse(localStorage.getItem('ac_users')) || [];
    } catch (e) {
      console.error('Failed to read ac_users', e);
      return [];
    }
  }

  function saveActiveProfile(profile) {
    try {
      localStorage.setItem('ac_user', JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save ac_user', e);
    }
  }

  loginBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    setMessage('');

    const username = document.getElementById('login-username')?.value?.trim();
    const password = document.getElementById('login-password')?.value || '';

    if (!username) return setMessage('Please enter your username.');
    if (!password) return setMessage('Please enter your password.');

    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      return setMessage('Invalid username or password.');
    }

    // Build profile for dashboard (fields the dashboard expects)
    const profile = {
      username: user.username,
      role: user.role || '',
      studentNumber: user.studentNumber || '',
      studentName: user.studentName || '',
      studentAge: user.studentAge || '',
      studentYear: user.studentYear || ''
    };

    saveActiveProfile(profile);
    window.location.href = 'dashboard.html';
  });
})();
