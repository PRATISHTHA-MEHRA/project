/* ============================================================
   BrightPath Coaching — Admin app engine
   Layout, auth, tables, modals, toasts, charts
   ============================================================ */
const App = (function () {

  /* ---------- ICONS (lucide-style inline svg) ---------- */
  const I = {
    dash:'<path d="M3 13h8V3H3zM13 21h8V8h-8zM13 3v3h8V3zM3 21h8v-6H3z"/>',
    students:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    admit:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    enquiry:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    demo:'<path d="M23 7l-7 5 7 5zM1 5h15v14H1z"/>',
    teacher:'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    course:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    batch:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    timetable:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    attendance:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    fees:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    pending:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    payment:'<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
    money:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    exam:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/>',
    marks:'<path d="M12 20V10M18 20V4M6 20v-4"/>',
    homework:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    material:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    reports:'<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search:'<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
    bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    edit:'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    trash:'<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    print:'<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    check:'<path d="M20 6L9 17l-5-5"/>',
    x:'<path d="M18 6L6 18M6 6l12 12"/>',
    logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    whatsapp:'<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>',
    phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    rupee:'<path d="M6 3h12M6 8h12M6 13l8.5 8M14 8a6 5 0 0 1-8 5h2"/>',
    trending:'<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
    up:'<path d="M12 19V5M5 12l7-7 7 7"/>', down:'<path d="M12 5v14M19 12l-7 7-7-7"/>',
    chevron:'<path d="M9 18l6-6-6-6"/>', chevD:'<path d="M6 9l6 6 6-6"/>',
    menu:'<path d="M3 12h18M3 6h18M3 18h18"/>',
    filter:'<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'
  };
  function svg(name, cls){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls||''}">${I[name]||''}</svg>`; }

  /* ---------- NAV ---------- */
  const NAV = [
    { group:"Overview", items:[ {k:"dashboard",t:"Dashboard",ic:"dash"} ]},
    { group:"Academics", items:[
      {k:"students",t:"Students",ic:"students"},
      {k:"admissions",t:"Admissions",ic:"admit"},
      {k:"enquiries",t:"Enquiries",ic:"enquiry",badge:"8"},
      {k:"demo-classes",t:"Demo Classes",ic:"demo"},
      {k:"teachers",t:"Teachers",ic:"teacher"},
      {k:"courses",t:"Courses & Subjects",ic:"course"},
      {k:"batches",t:"Batches",ic:"batch"},
      {k:"timetable",t:"Timetable",ic:"timetable"},
      {k:"attendance",t:"Attendance",ic:"attendance"}
    ]},
    { group:"Finance", items:[
      {k:"fees",t:"Fee Collection",ic:"fees"},
      {k:"pending-fees",t:"Pending Fees",ic:"pending",badge:"24"},
      {k:"teacher-payments",t:"Teacher Payments",ic:"payment"},
      {k:"income-expense",t:"Income & Expense",ic:"money"}
    ]},
    { group:"Assessment", items:[
      {k:"exams",t:"Exams",ic:"exam"},
      {k:"marks",t:"Marks",ic:"marks"},
      {k:"homework",t:"Homework",ic:"homework"},
      {k:"study-material",t:"Study Material",ic:"material"}
    ]},
    { group:"Insights", items:[
      {k:"reports",t:"Reports",ic:"reports"},
      {k:"settings",t:"Settings",ic:"settings"}
    ]}
  ];

  /* ---------- AUTH ---------- */
  function guard(){
    if (!sessionStorage.getItem("bp_admin")) { location.href = "login.html"; return false; }
    return true;
  }
  function login(user, pass){
    if (user.trim()==="admin" && pass==="admin123"){
      sessionStorage.setItem("bp_admin", JSON.stringify({name:"Anand Kulkarni", role:"Centre Admin", initials:"AK"}));
      return true;
    }
    return false;
  }
  function logout(){ sessionStorage.removeItem("bp_admin"); location.href="login.html"; }
  function me(){ try { return JSON.parse(sessionStorage.getItem("bp_admin")) || {}; } catch(e){ return {}; } }

  /* ---------- LAYOUT ---------- */
  function layout(active, title, crumbs, headActions){
    const u = me();
    const sb = NAV.map(g=>`
      <div class="sb-group">${g.group}</div>
      ${g.items.map(it=>`
        <a class="sb-link ${it.k===active?'active':''}" href="${it.k}.html">
          ${svg(it.ic)}<span>${it.t}</span>
          ${it.badge?`<span class="badge-dot num">${it.badge}</span>`:''}
        </a>`).join('')}
    `).join('');

    const notif = DB.notifications.map(n=>`
      <div class="notif">
        <div class="ic b-${n.color}">${svg(n.type==='fee'?'rupee':n.type==='alert'?'bell':n.type==='demo'?'demo':'enquiry')}</div>
        <div><b>${n.title}</b><p>${n.text}</p><div class="t">${n.time}</div></div>
      </div>`).join('');

    document.body.innerHTML = `
      <div class="app">
        <aside class="sidebar" id="sidebar">
          <div class="sb-brand">
            <div class="mark">B</div>
            <div class="name">BrightPath<small>Coaching Centre</small></div>
          </div>
          <nav class="sb-nav">${sb}</nav>
        </aside>
        <div class="main">
          <header class="topbar">
            <button class="tb-icon" style="display:none" id="mtoggle">${svg('menu')}</button>
            <div class="tb-search">${svg('search')}<input type="text" placeholder="Search students, batches, receipts…" id="globalSearch"></div>
            <div class="tb-actions">
              <div class="dd">
                <button class="tb-icon" id="notifBtn">${svg('bell')}<span class="dot"></span></button>
                <div class="dd-menu" id="notifMenu" style="min-width:320px">
                  <div class="dd-head"><b>Notifications</b><a href="#" style="font-size:12px">Mark all read</a></div>
                  <div class="notif-list">${notif}</div>
                </div>
              </div>
              <div class="dd">
                <div class="tb-profile" id="profileBtn">
                  <div class="av">${u.initials||'AK'}</div>
                  <div class="who"><b>${u.name||'Admin'}</b><span>${u.role||'Administrator'}</span></div>
                  ${svg('chevD','tb-chev')}
                </div>
                <div class="dd-menu" id="profileMenu">
                  <div class="dd-item">${svg('user')}My Profile</div>
                  <a class="dd-item" href="settings.html">${svg('settings')}Settings</a>
                  <div class="dd-divide"></div>
                  <a class="dd-item" href="logout.html" style="color:var(--red)">${svg('logout')}Logout</a>
                </div>
              </div>
            </div>
          </header>
          <main class="page">
            <div class="page-head">
              <div>
                <div class="crumb"><a href="dashboard.html">Home</a>${crumbs?crumbs.map(c=>`<span class="sep">›</span>${c}`).join(''):''}</div>
                <h1>${title}</h1>
              </div>
              <div class="head-actions">${headActions||''}</div>
            </div>
            <div id="pageContent"></div>
          </main>
        </div>
      </div>
      <div class="modal-back" id="modalBack"></div>
      <div class="toast-wrap" id="toastWrap"></div>`;

    // dropdown wiring
    wireDD('notifBtn','notifMenu'); wireDD('profileBtn','profileMenu');
    const mt = document.getElementById('mtoggle');
    if (window.innerWidth <= 920){ mt.style.display='grid'; mt.onclick=()=>document.getElementById('sidebar').classList.toggle('show'); }
    document.getElementById('globalSearch').addEventListener('keydown',e=>{ if(e.key==='Enter') toast('Search is a mock in this demo','info'); });
    return document.getElementById('pageContent');
  }
  function wireDD(btn,menu){
    const b=document.getElementById(btn), m=document.getElementById(menu);
    if(!b) return;
    b.addEventListener('click',e=>{ e.stopPropagation(); document.querySelectorAll('.dd-menu.open').forEach(x=>{if(x!==m)x.classList.remove('open');}); m.classList.toggle('open'); });
    document.addEventListener('click',()=>m.classList.remove('open'));
    m.addEventListener('click',e=>e.stopPropagation());
  }

  /* ---------- TOAST ---------- */
  function toast(msg, type='ok'){
    const w=document.getElementById('toastWrap'); if(!w) return;
    const ic = type==='ok'?'check':type==='err'?'x':'bell';
    const el=document.createElement('div'); el.className=`toast ${type}`;
    el.innerHTML=`<div class="ic">${svg(ic)}</div><div>${msg}</div>`;
    w.appendChild(el);
    setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),250); }, 2600);
  }

  /* ---------- MODAL ---------- */
  function modal(opts){
    const back=document.getElementById('modalBack');
    const size=opts.size||'';
    back.innerHTML=`
      <div class="modal ${size}">
        <div class="modal-head">
          <div><h3>${opts.title}</h3>${opts.sub?`<div class="sub">${opts.sub}</div>`:''}</div>
          <button class="modal-x" id="mClose">${svg('x')}</button>
        </div>
        <div class="modal-body">${opts.body}</div>
        ${opts.foot!==false?`<div class="modal-foot">${opts.foot||`<button class="btn btn-light" data-close>Close</button>`}</div>`:''}
      </div>`;
    back.classList.add('open');
    document.getElementById('mClose').onclick=closeModal;
    back.onclick=e=>{ if(e.target===back) closeModal(); };
    back.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);
    if(opts.onOpen) opts.onOpen(back);
  }
  function closeModal(){ const b=document.getElementById('modalBack'); b.classList.remove('open'); b.innerHTML=''; }

  function confirmModal(msg, onYes, opts={}){
    modal({ size:'sm', title:opts.title||'Confirm action', foot:false,
      body:`<p style="color:var(--ink-2);margin:0 0 4px">${msg}</p>
        <div class="modal-foot" style="padding:18px 0 0;margin:0;border:none">
          <button class="btn btn-light" data-close>Cancel</button>
          <button class="btn ${opts.danger?'btn-danger':'btn-primary'}" id="cfYes">${opts.yes||'Confirm'}</button>
        </div>`,
      onOpen:b=>{ b.querySelector('#cfYes').onclick=()=>{ closeModal(); onYes&&onYes(); }; }
    });
  }

  /* ---------- BADGE helper ---------- */
  const BMAP = {
    "Active":"b-green","Inactive":"b-slate","Paid":"b-green","Pending":"b-yellow","Overdue":"b-red",
    "Partially Paid":"b-amber","Hold":"b-slate","On Leave":"b-amber","Upcoming":"b-blue","Completed":"b-slate",
    "Scheduled":"b-blue","Cancelled":"b-red","Rescheduled":"b-violet","Teacher Absent":"b-red","Holiday":"b-slate",
    "New":"b-blue","Contacted":"b-violet","Demo Scheduled":"b-amber","Demo Completed":"b-violet","Interested":"b-brand",
    "Converted":"b-green","Lost":"b-red","No Show":"b-red","Result Published":"b-green","Closed":"b-slate",
    "Approved":"b-green","Rejected":"b-red","Present":"b-green","Absent":"b-red","Late":"b-amber","Leave":"b-blue",
    "Not Marked":"b-slate"
  };
  function badge(text){ return `<span class="badge ${BMAP[text]||'b-slate'}"><span class="pip"></span>${text}</span>`; }
  function money(n){ return '₹' + Number(n||0).toLocaleString('en-IN'); }
  const AVCOLORS=['r','g','b','v','t','s'];
  function avatar(name,i){ const c=AVCOLORS[(name?name.charCodeAt(0):0)%AVCOLORS.length]; const ini=name?name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase():'?'; return `<div class="av ${c}">${ini}</div>`; }
  function whoCell(name, sub){ return `<div class="who-cell">${avatar(name)}<div><div class="t-main">${name}</div>${sub?`<div class="t-sub">${sub}</div>`:''}</div></div>`; }

  /* ---------- TABLE ENGINE ---------- */
  /* config: {columns:[{key,label,num,render(row)}], rows, searchKeys, filters:[{label,key,options}], actions(row), pageSize, empty,
     dateFilter, dateValue (preset the date input's value), onDateChange(dateStr) (called when the date input changes — use this to refetch server-side date-scoped data)} */
  function table(mount, cfg){
    const state={ q:'', filters:{}, page:1, ps:cfg.pageSize||10, sortKey:null, sortDir:1 };
    const el = typeof mount==='string'?document.getElementById(mount):mount;

    const toolbar = `
      <div class="toolbar">
        <div class="search-in">${svg('search')}<input type="text" placeholder="${cfg.searchPlaceholder||'Search…'}" id="tblSearch"></div>
        ${(cfg.filters||[]).map(f=>`<select class="filter-sel" data-fk="${f.key}"><option value="">${f.label}</option>${f.options.map(o=>`<option>${o}</option>`).join('')}</select>`).join('')}
        ${cfg.dateFilter?`<input type="date" class="filter-sel" id="tblDate" style="min-width:150px" value="${cfg.dateValue||''}">`:''}
        <div class="grow"></div>
        ${cfg.toolbarRight||''}
      </div>`;

    function filtered(){
      let r=cfg.rows.slice();
      if(state.q){ const q=state.q.toLowerCase(); r=r.filter(row=>(cfg.searchKeys||Object.keys(row)).some(k=>String(row[k]??'').toLowerCase().includes(q))); }
      Object.entries(state.filters).forEach(([k,v])=>{ if(v) r=r.filter(row=>String(row[k])===v); });
      if(state.dateFilter){ r=r.filter(row=>row.date===state.dateFilter); }
      if(state.sortKey){ r.sort((a,b)=>{ const x=a[state.sortKey],y=b[state.sortKey]; return (x>y?1:x<y?-1:0)*state.sortDir; }); }
      return r;
    }
    function render(){
      const all=filtered(); const total=all.length;
      const pages=Math.max(1,Math.ceil(total/state.ps));
      if(state.page>pages) state.page=pages;
      const rows=all.slice((state.page-1)*state.ps, state.page*state.ps);
      const body = total===0
        ? `<div class="empty"><div class="ic">${svg(cfg.emptyIcon||'search')}</div><h4>${cfg.emptyTitle||'No records found'}</h4><p>${cfg.emptyText||'Try adjusting your search or filters.'}</p></div>`
        : `<div class="tbl-wrap"><table class="tbl"><thead><tr>
            ${cfg.columns.map(c=>`<th class="${c.num?'num':''}" ${c.sort!==false?`data-sort="${c.key}" style="cursor:pointer"`:''}>${c.label}</th>`).join('')}
            ${cfg.actions?`<th style="text-align:right">Actions</th>`:''}
          </tr></thead><tbody>
            ${rows.map((row,ri)=>`<tr>
              ${cfg.columns.map(c=>`<td class="${c.num?'num':''}">${c.render?c.render(row,ri):(row[c.key]??'—')}</td>`).join('')}
              ${cfg.actions?`<td style="text-align:right"><div class="act" style="justify-content:flex-end">${cfg.actions(row)}</div></td>`:''}
            </tr>`).join('')}
          </tbody></table></div>
          <div class="tbl-foot">
            <span>Showing <b>${(state.page-1)*state.ps+1}–${Math.min(state.page*state.ps,total)}</b> of <b>${total}</b></span>
            <div class="pager">
              <button ${state.page===1?'disabled':''} data-pg="prev">‹</button>
              ${Array.from({length:pages},(_,i)=>i+1).slice(Math.max(0,state.page-3),state.page+2).map(p=>`<button class="${p===state.page?'active':''}" data-pg="${p}">${p}</button>`).join('')}
              <button ${state.page===pages?'disabled':''} data-pg="next">›</button>
            </div>
          </div>`;
      el.querySelector('.tbl-host').innerHTML = body;
      // wire
      el.querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>{ const v=b.dataset.pg; state.page = v==='prev'?state.page-1:v==='next'?state.page+1:+v; render(); });
      el.querySelectorAll('[data-sort]').forEach(th=>th.onclick=()=>{ const k=th.dataset.sort; if(state.sortKey===k) state.sortDir*=-1; else {state.sortKey=k; state.sortDir=1;} render(); });
      if(cfg.afterRender) cfg.afterRender(el);
    }

    el.innerHTML = `<div class="card">${toolbar}<div class="tbl-host"></div></div>`;
    el.querySelector('#tblSearch').addEventListener('input',e=>{ state.q=e.target.value; state.page=1; render(); });
    el.querySelectorAll('[data-fk]').forEach(s=>s.addEventListener('change',e=>{ state.filters[e.target.dataset.fk]=e.target.value; state.page=1; render(); }));
    if(cfg.dateFilter){
      const dateInput = el.querySelector('#tblDate');
      if(dateInput){
        dateInput.addEventListener('change', e=>{
          if(cfg.onDateChange){ cfg.onDateChange(e.target.value); }
          else { state.dateFilter=e.target.value; state.page=1; render(); }
        });
      }
    }
    render();
    return { refresh:render, state };
  }

  function actBtn(icon,label,attr){ return `<button title="${label}" ${attr||''}>${svg(icon)}</button>`; }

  /* ---------- mini charts ---------- */
  function barChart(data, opts={}){
    const max=Math.max(...data.map(d=>opts.stacked?d.a+d.b:(d.v??d.value)));
    const fmtV=v=>v>=100000?Math.round(v/1000)+'k':v>=1000?(v/1000).toFixed(1)+'k':v;
    const grid=`<div class="bars-bg"><span></span><span></span><span></span><span></span></div>`;
    const cols=data.map(d=>{
      if(opts.stacked){
        const ha=(d.a/max*100), hb=(d.b/max*100), tot=d.a+d.b;
        return `<div class="col"><div class="bar-val">${fmtV(tot)}</div><div class="stack"><div class="bar ${opts.c1||'bar-brand'}" style="height:${ha}%"></div><div class="bar ${opts.c2||'bar-amber'}" style="height:${hb}%"></div></div><span class="lab">${d.m||d.label}</span></div>`;
      }
      const v=(d.v??d.value), h=(v/max*100);
      return `<div class="col"><div class="bar-val">${fmtV(v)}</div><div class="stack"><div class="bar ${opts.color||'bar-brand'}" style="height:${h}%" title="${d.m||d.label}: ${v}"></div></div><span class="lab">${d.m||d.label}</span></div>`;
    }).join('');
    return `<div class="bars">${grid}${cols}</div>`;
  }
  function sparkline(vals, color){
    const max=Math.max(...vals),min=Math.min(...vals),w=300,h=56;
    const pts=vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v-min)/((max-min)||1))*(h-8)-4}`).join(' ');
    const area=`0,${h} ${pts} ${w},${h}`;
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polygon points="${area}" fill="${color||'var(--brand-soft)'}" opacity=".4"/>
      <polyline points="${pts}" fill="none" stroke="${color||'var(--brand)'}" stroke-width="2.2" stroke-linecap="round"/>
    </svg>`;
  }
  function donut(data){
    const total=data.reduce((a,d)=>a+d.value,0); let off=0; const r=54,c=2*Math.PI*r;
    const seg=data.map(d=>{ const frac=d.value/total; const dash=frac*c; const s=`<circle cx="66" cy="66" r="${r}" fill="none" stroke="${d.color}" stroke-width="20" stroke-dasharray="${dash} ${c-dash}" stroke-dashoffset="${-off}" transform="rotate(-90 66 66)"/>`; off+=dash; return s; }).join('');
    return `<div class="donut-wrap"><svg class="donut" viewBox="0 0 132 132">${seg}<circle cx="66" cy="66" r="34" fill="#fff"/><text x="66" y="62" text-anchor="middle" font-family="Fira Sans" font-size="18" font-weight="600" fill="#1b2230">${total}%</text><text x="66" y="78" text-anchor="middle" font-size="9" fill="#9aa1ad">SOURCES</text></svg>
      <div class="donut-legend">${data.map(d=>`<div class="row"><span class="sw" style="background:${d.color}"></span>${d.label}<span class="v">${d.value}%</span></div>`).join('')}</div></div>`;
  }
  function hbars(data, fmt){
    const max=Math.max(...data.map(d=>d.value));
    const colors=['#126e63','#b9772b','#2d6db5','#6a4bab','#2f8f54','#5a6473','#c0432f'];
    return `<div class="hbar-list">${data.map((d,i)=>`<div class="row"><div class="top"><b>${d.label}</b><span class="v">${fmt?fmt(d.value):d.value}</span></div><div class="track"><span style="width:${d.value/max*100}%;background:${colors[i%colors.length]}"></span></div></div>`).join('')}</div>`;
  }

  return { svg, I, guard, login, logout, me, layout, toast, modal, closeModal, confirmModal,
    badge, money, avatar, whoCell, table, actBtn, barChart, sparkline, donut, hbars };
})();