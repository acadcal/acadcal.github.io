let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("loggedUser")) || null;

// ---------- REGISTER ----------
function register(){
  const role = document.getElementById("role").value;
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const snum = document.getElementById("studentNumber").value.trim();
  const sname = document.getElementById("studentName").value.trim();
  const syear = document.getElementById("studentYear").value.trim();

  if(!username || !password || !role) return alert("Please complete all fields.");

  if(users.find(u=>u.username===username)) return alert("Username already taken.");

  const newUser = {
    role, username, password,
    studentNumber: role==="Student"?snum:"",
    studentName: role==="Student"?sname:"",
    studentYear: role==="Student"?syear:"",
    grades:[], subjects:[], lessons:[], quizzes:[], activities:[], deadlines:[], attendance:[]
  };

  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
  alert("Registration successful!");
  window.location.href="index.html";
}

// ---------- LOGIN ----------
function login(){
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const user = users.find(u=>u.username===username && u.password===password);
  if(!user) return alert("Invalid username or password.");
  localStorage.setItem("loggedUser", JSON.stringify(user));
  window.location.href="dashboard.html";
}

// ---------- LOGOUT ----------
function logout(){
  localStorage.removeItem("loggedUser");
  window.location.href="index.html";
}

// ---------- DASHBOARD INITIALIZATION ----------
window.onload = ()=>{
  if(!currentUser) return;
  const welcome = document.getElementById("welcome");
  if(welcome) welcome.textContent = `Welcome, ${currentUser.username} (${currentUser.role})`;
  if(currentUser.role==="Student") showStudent();
  if(currentUser.role==="Teacher") showTeacher();
};

// ---------- STUDENT DASHBOARD ----------
function showStudent(){
  document.getElementById("studentDashboard").classList.remove("hidden");
  document.getElementById("snum").textContent = currentUser.studentNumber;
  document.getElementById("sname").textContent = currentUser.studentName;
  document.getElementById("syear").textContent = currentUser.studentYear;

  fillList("grades");
  fillList("subjects");
  fillList("lessons");
  fillList("quizzes");
  fillList("activities");
  fillList("deadlines");
  fillList("attendance");
  buildCalendar();
}
function fillList(type){
  const ul = document.getElementById(type);
  ul.innerHTML="";
  (currentUser[type]||[]).forEach(i=>{
    const li=document.createElement("li"); li.textContent=i; ul.appendChild(li);
  });
}
function buildCalendar(){
  const cal=document.getElementById("calendar"); cal.innerHTML="";
  const today=new Date(); const y=today.getFullYear(), m=today.getMonth();
  const fd=new Date(y,m,1).getDay(); const lm=new Date(y,m+1,0).getDate();
  for(let i=0;i<fd;i++){ cal.appendChild(document.createElement("div")); }
  for(let d=1; d<=lm; d++){
    const day=document.createElement("div"); day.classList.add("day"); day.innerHTML=`<strong>${d}</strong>`;
    (currentUser.deadlines||[]).forEach(ev=>{
      const [type,date]=ev.split(": ");
      const ed=new Date(date);
      if(ed.getDate()===d && ed.getMonth()===m && ed.getFullYear()===y){
        const eDiv=document.createElement("div");
        eDiv.classList.add("event", type==="Holiday"?"holiday":"deadline");
        eDiv.textContent=type;
        day.appendChild(eDiv);
      }
    });
    cal.appendChild(day);
  }
}

// ---------- TEACHER DASHBOARD ----------
function showTeacher(){
  const tDash=document.getElementById("teacherDashboard");
  tDash.classList.remove("hidden");
  const select=document.getElementById("studentSelect");
  select.innerHTML="";
  users.filter(u=>u.role==="Student").forEach(s=>{
    const opt=document.createElement("option");
    opt.value=s.username;
    opt.textContent=`${s.studentName} (${s.studentNumber})`;
    select.appendChild(opt);
  });
}

function updateStudent(){
  const sUser=document.getElementById("studentSelect").value;
  const stu=users.find(u=>u.username===sUser);
  if(!stu) return alert("Student not found.");

  const subject=document.getElementById("subject").value;
  const grade=document.getElementById("grade").value;
  const lesson=document.getElementById("lesson").value;
  const quiz=document.getElementById("quiz").value;
  const activity=document.getElementById("activity").value;
  const date=document.getElementById("date").value;
  const type=document.getElementById("type").value;
  const attend=document.getElementById("attend").value;

  if(subject) stu.subjects.push(subject);
  if(grade) stu.grades.push(grade);
  if(lesson) stu.lessons.push(lesson);
  if(quiz) stu.quizzes.push(quiz);
  if(activity) stu.activities.push(activity);
  if(date && type) stu.deadlines.push(`${type}: ${date}`);
  if(attend) stu.attendance.push(`${date} - ${attend}`);

  localStorage.setItem("users", JSON.stringify(users));
  alert("Student record updated.");
}
