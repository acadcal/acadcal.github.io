// dashboard.js
import { auth, db, firebaseHelpers } from './firebase-init.js';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  orderBy,
  writeBatch,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const YEAR = 2025;
const EVENTS_COLLECTION = 'events2025';

/* DOM references */
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

let events = [];
let activeDate = null;
let currentUser = null;
let currentProfile = null;

function uidLocal(){ return 'e' + Math.random().toString(36).slice(2,9); }
function pad(n){ return String(n).padStart(2,'0'); }
function isoDate(y,m,d){ return `${y}-${pad(m)}-${pad(d)}`; }
function monthName(m){ return ['January','February','March','April','May','June','July','August','September','October','November','December'][m]; }
function weekdayShort(i){ return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]; }
function showToast(msg, ms=3500){ toast.textContent = msg; toast.classList.remove('hidden'); setTimeout(()=> toast.classList.add('hidden'), ms); }

/* Auth state */
firebaseHelpers.onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  try {
    const udocSnap = await getDoc(doc(db, 'users', user.uid));
    currentProfile = udocSnap.exists() ? udocSnap.data() : { username: user.email, role: '' };
    renderProfile(currentProfile);
    startEventsListener();
  } catch (e) { console.error('failed to load profile', e); }
});

/* Firestore listener */
let unsubscribeEvents = null;
function startEventsListener(){
  if (unsubscribeEvents) unsubscribeEvents();
  const q = query(collection(db, EVENTS_COLLECTION), orderBy('date'));
  unsubscribeEvents = onSnapshot(q, (snapshot) => {
    const arr = [];
    snapshot.forEach(d => {
      const data = d.data();
      arr.push({
        id: d.id,
        date: data.date,
        time: data.time || null,
        title: data.title,
        type: data.type || 'Deadline',
        description: data.description || '',
        createdAt: data.createdAt ? data.createdAt.toMillis ? data.createdAt.toMillis() : Date.now() : Date.now()
      });
    });
    events = arr;
    updateStats();
    renderAllMonths();
    if (activeDate) renderPanelEvents();
  }, err => console.error('events listener error', err));
}

/* Firestore write helpers */
async function addEventToFirestore(ev) {
  if (!currentUser || !currentProfile) throw new Error('not authenticated');
  if (currentProfile.role !== 'Teacher') throw new Error('Only teachers can add events.');
  const payload = {
    date: ev.date,
    time: ev.time || null,
    title: ev.title,
    type: ev.type || 'Deadline',
    description: ev.description || '',
    createdBy: currentUser.uid,
    createdAt: firebaseHelpers.serverTimestamp()
  };
  const ref = await addDoc(collection(db, EVENTS_COLLECTION), payload);
  return ref.id;
}

async function deleteEventFromFirestore(eventId) {
  if (!currentUser || !currentProfile) throw new Error('not authenticated');
  if (currentProfile.role !== 'Teacher') throw new Error('Only teachers can delete events.');
  await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
}

/* UI renderers */
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

function openDayPanel(iso){
  activeDate = iso;
  panelDate.textContent = `${iso} • ${new Date(iso).toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric'})}`;
  titleInput.value = ''; descInput.value = ''; timeInput.value = ''; typeInput.value = 'Deadline';
  renderPanelEvents();
  eventForm.style.display = (currentProfile && currentProfile.role === 'Teacher') ? 'block' : 'none';
  panel.classList.remove('hidden');
}
function closePanel(){ panel.classList.add('hidden'); activeDate = null; }
panelClose?.addEventListener('click', closePanel);
cancelBtn?.addEventListener('click', (e)=>{ e.preventDefault(); closePanel(); });

function renderPanelEvents(){
  eventList.innerHTML = '';
  if (!activeDate) return;
  const evs = events.filter(e => e.date === activeDate).sort((a,b)=>(a.time||'') > (b.time||'') ? 1 : -1);
  if (evs.length === 0){
    const p = document.createElement('div'); p.className='meta'; p.textContent='No events for this day.'; eventList.appendChild(p); return;
  }
  const canEdit = currentProfile && currentProfile.role === 'Teacher';
  evs.forEach(ev=>{
    const li = document.createElement('li'); li.className='event-item';
    const left = document.createElement('div'); left.style.flex='1';
    const title = document.createElement('div'); title.className='title'; title.textContent = (ev.time ? (ev.time + ' • ') : '') + ev.title;
    const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = `<strong>${ev.type}</strong> • added ${new Date(ev.createdAt).toLocaleString()}`;
    const desc = document.createElement('div'); desc.className='meta'; desc.textContent = ev.description || '';
    left.appendChild(title); left.appendChild(meta); if (ev.description) left.appendChild(desc);
    li.appendChild(left);
    if (canEdit){
      const del = document.createElement('button'); del.className='delete'; del.textContent='Delete';
      del.addEventListener('click', async ()=>{
        if (!confirm('Delete this event?')) return;
        try { await deleteEventFromFirestore(ev.id); showToast('Event deleted'); } catch (e) { console.error(e); showToast('Delete failed'); }
      });
      li.appendChild(del);
    }
    eventList.appendChild(li);
  });
}

/* event form */
eventForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!activeDate) return alert('No date selected');
  if (!currentProfile || currentProfile.role !== 'Teacher') return alert('Only teachers can create events.');
  const title = titleInput.value.trim(); if (!title) return alert('Please provide a title');
  const type = typeInput.value; const time = timeInput.value || null; const desc = descInput.value.trim() || '';
  try {
    await addEventToFirestore({ date: activeDate, time, title, type, description: desc });
    titleInput.value=''; descInput.value=''; timeInput.value='';
    showToast('Event saved');
  } catch (err) {
    console.error('add event failed', err); showToast('Add failed: ' + (err.message||''));
  }
});

/* profile */
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
  currentProfile = profile;
}

editProfileBtn?.addEventListener('click', ()=>{
  const p = currentProfile || { username:'Guest', role:'' };
  renderProfile(p);
  profilePanel.classList.toggle('hidden');
});

saveProfileBtn?.addEventListener('click', async ()=>{
  if (!currentUser) return showToast('Not authenticated');
  const existing = currentProfile || { username:'Guest', role:'' };
  const profileToSave = {
    username: profileUsername.value.trim() || existing.username || 'Guest',
    role: existing.role || '',
    studentNumber: profileSnum.value.trim(),
    studentName: profileSname.value.trim(),
    studentAge: profileSage.value ? Number(profileSage.value) : '',
    studentYear: profileSyear.value.trim()
  };
  try {
    await setDoc(doc(db, 'users', currentUser.uid), profileToSave, { merge: true });
    currentProfile = profileToSave;
    renderProfile(profileToSave);
    showToast('Profile saved');
    profilePanel.classList.add('hidden');
  } catch (e) {
    console.error('save profile failed', e); showToast('Save failed');
  }
});

closeProfileBtn?.addEventListener('click', ()=> profilePanel.classList.add('hidden'));

/* logout */
logoutBtn?.addEventListener('click', async () => {
  try {
    await firebaseHelpers.signOut(auth);
    showToast('Logged out');
    setTimeout(()=> { window.location.href = 'index.html'; }, 300);
  } catch (e) { console.error(e); showToast('Logout failed'); }
});

/* notifications (in-page) */
function updateNotifStateLabel(){ notifState.textContent = Notification.permission === 'granted' ? 'On' : (Notification.permission === 'denied' ? 'Blocked' : 'Off'); }
btnNotifPerm?.addEventListener('click', async ()=>{
  if (!('Notification' in window)) { alert('Browser notifications not supported'); return; }
  if (Notification.permission === 'granted') { showToast('Notifications already allowed'); updateNotifStateLabel(); return; }
  if (Notification.permission === 'denied') { alert('Notifications blocked — enable in browser settings.'); return; }
  try {
    const res = await Notification.requestPermission();
    if (res === 'granted') { showToast('Notifications enabled'); }
    else showToast('Notifications not granted');
    updateNotifStateLabel();
  } catch (e) { console.error(e); }
});

/* scan for today's events every 30s */
function scanAndNotify(){
  const now = new Date(); const todayISO = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const todaysEvents = events.filter(e => e.date === todayISO);
  todaysEvents.forEach(ev => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(`${ev.type}: ${ev.title}`, { body: ev.description || (ev.time || '') }); } catch(e){}
    }
    showToast(`${ev.type}: ${ev.title}`);
  });
}
setInterval(scanAndNotify, 30*1000);
updateNotifStateLabel();

/* migration helper (dev) */
async function migrateLocalEventsToFirestore() {
  try {
    const raw = localStorage.getItem('ac_events_2025');
    if (!raw) return;
    const localEvents = JSON.parse(raw);
    if (!Array.isArray(localEvents) || localEvents.length === 0) return;
    if (!currentProfile || currentProfile.role !== 'Teacher') {
      console.warn('Migration requires a logged-in teacher to run.');
      return;
    }
    const batch = writeBatch(db);
    localEvents.forEach(l => {
      const id = l.id || uidLocal();
      const ref = doc(db, EVENTS_COLLECTION, id);
      batch.set(ref, {
        date: l.date,
        time: l.time || null,
        title: l.title,
        type: l.type || 'Deadline',
        description: l.description || '',
        createdBy: currentUser.uid,
        createdAt: l.createdAt ? l.createdAt : firebaseHelpers.serverTimestamp()
      });
    });
    await batch.commit();
    showToast('Local events migrated (check Firestore).');
  } catch (e) { console.error('migration failed', e); }
}

/* init */
function initialize(){
  buildJumpSelector();
  renderAllMonths();
  updateStats();
  // window.__ac2025 = { migrateLocalEventsToFirestore }; // expose if you want
}
initialize();

window.__ac2025 = { events, reload: startEventsListener, migrateLocalEventsToFirestore };

document.addEventListener('click', (e) => {
  if (!panel.contains(e.target) && !e.target.closest('.day')) closePanel();
});
