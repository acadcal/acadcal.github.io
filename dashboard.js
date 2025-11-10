/* dashboard.js - stacked-month view + jump-to-month + clean event layout
   Added:
     - Logout button: clears ac_user and redirects to index.html
     - Role removed from editable profile; role displayed as read-only
   Storage:
     - events => ac_events_2025
     - profile => ac_user
     - notified map => ac_notified_2025
*/

(() => {
  const YEAR = 2025;
  const STORAGE_KEY = 'ac_events_2025';
  const PROFILE_KEY = 'ac_user';
  const NOTIFIED_KEY = 'ac_notified_2025';

  // DOM
  const monthsGrid = document.getElementById('months-grid');
  const eventCountEl = document.getElementById('event-count');
  const jumpMonthSelect = document.getElementById('jump-month');

  const panel = document.getElementById('day-panel');
  const panelDate = document.getElementById('panel-date');
  const panelClose = document.getElementById('panel-close');
  const eventList = document.getElementById('event-list');
  const eventForm = document.getElementById('event-form');
  const titleInput = document.getElementById('event-title');
  const typeInput = document.getElementById('event-type');
  const timeInput = document.getElementById('event-time');
  const descInput = document.getElementById('event-desc');
  const cancelBtn = document.getElementById('cancel-event');

  const btnNotifPerm = document.getElementById('notif-perm-btn');
  const notifState = document.getElementById('notif-state');
  const toast = document.getElementById('toast');

  const editProfileBtn = document.getElementById('edit-profile-btn');
  const profilePanel = document.getElementById('profile-panel');
  const profileUsername = document.getElementById('profile-username');
  const profileRoleReadonly = document.getElementById('profile-role-readonly');
  const studentFieldsPanel = document.getElementById('student-fields-panel');
  const profileSnum = document.getElementById('profile-snumber');
  const profileSname = document.getElementById('profile-sname');
  const profileSage = document.getElementById('profile-sage');
  const profileSyear = document.getElementById('profile-syear');
  const saveProfileBtn = document.getElementById('save-profile');
  const closeProfileBtn = document.getElementById('close-profile');
  const userNameDisplay = document.getElementById('user-name-display');
  const logoutBtn = document.getElementById('logout-btn');

  // state
  let events = loadEvents();
  let activeDate = null;
  let notifiedMap = loadNotifiedMap();

  // helpers
  function uid(){ return 'e' + Math.random().toString(36).slice(2,9); }
  function pad(n){ return String(n).padStart(2,'0'); }
  function isoDate(y,m,d){ return `${y}-${pad(m)}-${pad(d)}`; }
  function monthName(m){ return ['January','February','March','April','May','June','July','August','September','October','November','December'][m]; }
  function weekdayShort(i){ return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]; }

  // storage helpers
  function loadEvents(){ try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch(e){ console.error(e); return []; } }
  function saveEvents(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); updateStats(); dispatchNotificationScan(); }
  function loadProfile(){ try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null; } catch(e){ return null; } }
  function saveProfile(profile){ localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); renderProfile(profile); }
  function loadNotifiedMap(){ try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY)) || {}; } catch(e){ return {}; } }
  function saveNotifiedMap(){ localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notifiedMap)); }

  // seed PH holidays idempotently
  function seedPhilippinesHolidays() {
    const holidays = [
      { date: '2025-01-01', title: "New Year's Day", type: 'Holiday' },
      { date: '2025-04-09', title: 'Araw ng Kagitingan', type: 'Holiday' },
      { date: '2025-04-17', title: 'Maundy Thursday', type: 'Holiday' },
      { date: '2025-04-18', title: 'Good Friday', type: 'Holiday' },
      { date: '2025-05-01', title: 'Labor Day', type: 'Holiday' },
      { date: '2025-05-31', title: 'Eid al-Fitr', type: 'Holiday' },
      { date: '2025-06-06', title: 'Eid al-Adha', type: 'Holiday' },
      { date: '2025-06-12', title: 'Independence Day', type: 'Holiday' },
      { date: '2025-08-21', title: 'Ninoy Aquino Day', type: 'Holiday' },
      { date: '2025-08-25', title: 'National Heroes Day', type: 'Holiday' },
      { date: '2025-10-31', title: "All Saints' Eve", type: 'Holiday' },
      { date: '2025-11-01', title: "All Saints' Day", type: 'Holiday' },
      { date: '2025-11-02', title: "All Souls' Day", type: 'Holiday' },
      { date: '2025-11-30', title: 'Bonifacio Day', type: 'Holiday' },
      { date: '2025-12-08', title: 'Immaculate Conception', type: 'Holiday' },
      { date: '2025-12-24', title: 'Christmas Eve', type: 'Holiday' },
      { date: '2025-12-25', title: 'Christmas Day', type: 'Holiday' },
      { date: '2025-12-30', title: 'Rizal Day', type: 'Holiday' },
      { date: '2025-12-31', title: "New Year's Eve", type: 'Holiday' },
    ];
    let added = 0;
    holidays.forEach(h=>{
      const exists = events.some(e => e.date === h.date && e.title === h.title && e.type === h.type);
      if (!exists) {
        events.push({ id: uid(), date: h.date, time: null, title: h.title, type: h.type, description: 'Philippine national holiday (2025)', createdAt: Date.now() });
        added++;
      }
    });
    if (added > 0) saveEvents();
  }

  // render functions
  function updateStats(){ eventCountEl.textContent = events.length; }

  function buildJumpSelector(){
    jumpMonthSelect.innerHTML = '';
    for (let m = 0; m < 12; m++){
      const opt = document.createElement('option'); opt.value = m; opt.textContent = `${monthName(m)} ${YEAR}`;
      jumpMonthSelect.appendChild(opt);
    }
    jumpMonthSelect.addEventListener('change', () => {
      const idx = Number(jumpMonthSelect.value);
      const target = monthsGrid.querySelector(`.month[data-month="${idx}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderAllMonths(){
    monthsGrid.innerHTML = '';
    for (let m = 0; m < 12; m++){
      const monthCard = document.createElement('article'); monthCard.className='month'; monthCard.dataset.month = m;

      const header = document.createElement('div'); header.className='month-header';
      header.innerHTML = `<div class="name">${monthName(m)}</div><div class="year">${YEAR}</div>`;
      monthCard.appendChild(header);

      const weekdays = document.createElement('div'); weekdays.className='weekdays';
      for (let wd=0; wd<7; wd++){ const w=document.createElement('div'); w.textContent=weekdayShort(wd); weekdays.appendChild(w); }
      monthCard.appendChild(weekdays);

      const days = document.createElement('div'); days.className='days';
      const firstDay = new Date(YEAR, m, 1).getDay();
      const lastDate = new Date(YEAR, m+1, 0).getDate();

      for (let i=0;i<firstDay;i++){ const empty=document.createElement('div'); empty.className='day empty'; days.appendChild(empty); }

      for (let d=1; d<=lastDate; d++){
        const iso = isoDate(YEAR, m+1, d);
        const cell = document.createElement('div'); cell.className='day';
        const dateNumber = document.createElement('div'); dateNumber.className='date-number'; dateNumber.textContent = d;
        cell.appendChild(dateNumber);

        const today = new Date();
        if (today.getFullYear() === YEAR && today.getMonth() === m && today.getDate() === d) cell.classList.add('today');

        const evArea = document.createElement('div'); evArea.className='events-area';
        const evs = events.filter(e => e.date === iso);
        const toShow = evs.slice(0, 3);
        toShow.forEach(e=>{
          const el = document.createElement('div');
          el.className = 'event-line ' + (e.type === 'Holiday' ? 'holiday' : 'deadline');
          el.textContent = (e.time ? (e.time + ' • ') : '') + e.title;
          el.title = e.description || '';
          evArea.appendChild(el);
        });
        if (evs.length > 3){
          const more = document.createElement('div'); more.className='more-indicator'; more.textContent = '+' + (evs.length - 3) + ' more';
          more.addEventListener('click', (ev) => { ev.stopPropagation(); openDayPanel(iso); });
          evArea.appendChild(more);
        }
        cell.appendChild(evArea);

        cell.addEventListener('click', (ev) => { ev.stopPropagation(); openDayPanel(iso); });

        days.appendChild(cell);
      }

      monthCard.appendChild(days);
      monthsGrid.appendChild(monthCard);
    }
  }

  // panel behavior
  function openDayPanel(iso){
    activeDate = iso;
    panelDate.textContent = `${iso} • ${new Date(iso).toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric'})}`;
    titleInput.value = ''; descInput.value = ''; timeInput.value = ''; typeInput.value = 'Deadline';
    renderPanelEvents();

    const profile = loadProfile() || {};
    eventForm.style.display = (profile.role === 'Teacher') ? 'block' : 'none';

    panel.classList.remove('hidden');
  }
  function closePanel(){ panel.classList.add('hidden'); activeDate = null; }
  panelClose?.addEventListener('click', closePanel);
  cancelBtn?.addEventListener('click', (e)=>{ e.preventDefault(); closePanel(); });

  function renderPanelEvents(){
    eventList.innerHTML = '';
    if (!activeDate) return;
    const evs = events.filter(e => e.date === activeDate).sort((a,b) => (a.time||'') > (b.time||'') ? 1 : -1);
    if (evs.length === 0){
      const p = document.createElement('div'); p.className='meta'; p.textContent='No events for this day.'; eventList.appendChild(p); return;
    }
    const profile = loadProfile() || {};
    const canEdit = profile.role === 'Teacher';

    evs.forEach(ev => {
      const li = document.createElement('li'); li.className='event-item';
      const left = document.createElement('div'); left.style.flex='1';
      const title = document.createElement('div'); title.className='title'; title.textContent = (ev.time ? (ev.time + ' • ') : '') + ev.title;
      const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = `<strong>${ev.type}</strong> • added ${new Date(ev.createdAt).toLocaleString()}`;
      const desc = document.createElement('div'); desc.className='meta'; desc.textContent = ev.description || '';
      left.appendChild(title); left.appendChild(meta); if (ev.description) left.appendChild(desc);
      li.appendChild(left);

      if (canEdit){
        const del = document.createElement('button'); del.className='delete'; del.textContent='Delete';
        del.addEventListener('click', ()=>{
          if (!confirm('Delete this event?')) return;
          events = events.filter(x => x.id !== ev.id); saveEvents(); renderAllMonths(); renderPanelEvents();
        });
        li.appendChild(del);
      }

      eventList.appendChild(li);
    });
  }

  // add event (teachers only)
  eventForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const profile = loadProfile() || {};
    if (profile.role !== 'Teacher') { alert('Only teachers can create events.'); return; }
    if (!activeDate) return alert('No date selected');
    const title = titleInput.value.trim(); if (!title) return alert('Please provide a title');
    const type = typeInput.value; const time = timeInput.value || null; const desc = descInput.value.trim() || '';
    const newEv = { id: uid(), date: activeDate, time, title, type, description: desc, createdAt: Date.now() };
    events.push(newEv); saveEvents(); renderAllMonths(); renderPanelEvents();
    titleInput.value=''; descInput.value=''; timeInput.value='';
  });

  // profile rendering & persistence (role read-only)
  function renderProfile(profile){
    if (!profile) { userNameDisplay.textContent = 'Guest'; profileRoleReadonly.textContent = '—'; return; }
    userNameDisplay.textContent = profile.username || 'Guest';
    profileUsername.value = profile.username || '';
    profileRoleReadonly.textContent = profile.role || '—';
    if (profile.role === 'Student'){
      studentFieldsPanel.classList.remove('hidden');
      profileSnum.value = profile.studentNumber || '';
      profileSname.value = profile.studentName || '';
      profileSage.value = profile.studentAge || '';
      profileSyear.value = profile.studentYear || '';
    } else {
      studentFieldsPanel.classList.add('hidden');
      profileSnum.value = profile.studentNumber || '';
      profileSname.value = profile.studentName || '';
      profileSage.value = profile.studentAge || '';
      profileSyear.value = profile.studentYear || '';
    }
  }

  editProfileBtn?.addEventListener('click', ()=>{
    const p = loadProfile() || { username:'Guest', role:'' };
    renderProfile(p);
    profilePanel.classList.toggle('hidden');
  });

  saveProfileBtn?.addEventListener('click', ()=>{
    // Only username and student info editable — role preserved
    const existing = loadProfile() || { username:'Guest', role:'' };
    const profile = {
      username: profileUsername.value.trim() || existing.username || 'Guest',
      role: existing.role || '',
      studentNumber: profileSnum.value.trim(),
      studentName: profileSname.value.trim(),
      studentAge: profileSage.value ? Number(profileSage.value) : '',
      studentYear: profileSyear.value.trim()
    };
    saveProfile(profile);
    profilePanel.classList.add('hidden');
    showToast('Profile saved');
    if (activeDate) openDayPanel(activeDate);
  });

  closeProfileBtn?.addEventListener('click', ()=> profilePanel.classList.add('hidden'));

  if (!loadProfile()) saveProfile({ username:'Guest', role:'', studentNumber:'', studentName:'', studentAge:'', studentYear:'' });
  else renderProfile(loadProfile());

  // logout: clear active profile and redirect to login page
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem(PROFILE_KEY);
    showToast('Logged out');
    setTimeout(() => { window.location.href = 'index.html'; }, 300);
  });

  // notifications
  function updateNotifStateLabel(){ notifState.textContent = Notification.permission === 'granted' ? 'On' : (Notification.permission === 'denied' ? 'Blocked' : 'Off'); }
  btnNotifPerm?.addEventListener('click', async ()=>{
    if (!('Notification' in window)) { alert('Browser notifications not supported'); return; }
    if (Notification.permission === 'granted') { showToast('Notifications already allowed'); updateNotifStateLabel(); return; }
    if (Notification.permission === 'denied') { alert('Notifications blocked — enable in browser settings.'); return; }
    try {
      const r = await Notification.requestPermission();
      if (r === 'granted') { showToast('Notifications enabled'); dispatchNotificationScan(); }
      else showToast('Notifications not granted');
      updateNotifStateLabel();
    } catch (e) { console.error(e); }
  });

  function showToast(msg, ms=3500){ toast.textContent = msg; toast.classList.remove('hidden'); setTimeout(()=> toast.classList.add('hidden'), ms); }

  function dispatchNotificationScan(){ try { scanAndNotify(); } catch(e) { console.error(e); } }
  function scanAndNotify(){
    const now = new Date(); const todayISO = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    if (!notifiedMap[todayISO]) notifiedMap[todayISO] = [];
    events.forEach(ev=>{
      if (ev.date !== todayISO) return;
      if (notifiedMap[todayISO].includes(ev.id)) return;
      if (ev.time){
        const [h,m] = ev.time.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) { triggerNotification(ev); notifiedMap[todayISO].push(ev.id); }
        else {
          if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) { triggerNotification(ev); notifiedMap[todayISO].push(ev.id); }
        }
      } else {
        triggerNotification(ev); notifiedMap[todayISO].push(ev.id);
      }
    });
    saveNotifiedMap();
  }
  function triggerNotification(ev){
    const title = `${ev.type}: ${ev.title}`; const body = (ev.time ? `${ev.time} • ` : '') + (ev.description || '');
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(title, { body, tag: ev.id }); } catch(e){ console.warn(e); }
    }
    showToast(`${title} — ${ev.time ? ev.time + ' ' : ''}${ev.description || ''}`, 5000);
  }
  setInterval(scanAndNotify, 30 * 1000);
  setTimeout(scanAndNotify, 1200);
  updateNotifStateLabel();

  // initialize UI
  function initialize(){
    buildJumpSelector();
    seedPhilippinesHolidays();
    renderAllMonths();
    updateStats();
    renderProfile(loadProfile());
  }

  initialize();

  // helper functions used earlier (ensuring closure-safe re-declarations)
  function buildJumpSelector(){
    jumpMonthSelect.innerHTML = '';
    for (let m=0;m<12;m++){
      const opt = document.createElement('option'); opt.value = m; opt.textContent = `${monthName(m)} ${YEAR}`;
      jumpMonthSelect.appendChild(opt);
    }
    jumpMonthSelect.addEventListener('change', () => {
      const idx = Number(jumpMonthSelect.value);
      const target = monthsGrid.querySelector(`.month[data-month="${idx}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function pad(n){ return String(n).padStart(2,'0'); }

  // expose debug
  window.__ac2025 = {
    events,
    reload() { events = loadEvents(); renderAllMonths(); updateStats(); },
    forceScan: scanAndNotify
  };

  // click outside to close panel
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !e.target.closest('.day')) closePanel();
  });

})();
