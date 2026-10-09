/* ============================================================
   App — router, doctors render, status pill, modal, wiring
   ============================================================ */
(function(){
  const PHONE_TEL = "+919457088602";
  const PHONE_WA  = "919457088602";

  /* ---------------- Router ---------------- */
  const ROUTES = ["home","pharmacy","doctors","about","visit"];
  function currentRoute(){
    const hash = (location.hash || "").replace(/^#\/?/, "");
    return ROUTES.includes(hash) ? hash : "home";
  }
  function render(){
    const route = currentRoute();
    document.querySelectorAll(".page").forEach(p=>{
      const isMatch = p.getAttribute("data-page") === route;
      p.hidden = !isMatch;
    });
    document.querySelectorAll(".nav-link").forEach(a=>{
      a.classList.toggle("active", a.getAttribute("data-route") === route);
    });
    // close mobile nav
    const nl = document.getElementById("navLinks");
    const hb = document.getElementById("hamburger");
    if(nl) nl.classList.remove("open");
    if(hb){ hb.classList.remove("open"); hb.setAttribute("aria-expanded","false"); }
    window.scrollTo({top:0, behavior:"instant" in window ? "instant" : "auto"});
    if(route === "doctors") renderDoctors();
    if(route === "home") renderToday();
    window.initAnimations();
    document.title = titleFor(route);
  }
  function titleFor(route){
    const base = "Singhal Medicare LLP — Pharmacy & Clinic, Shikohabad";
    const map = {
      home: base,
      pharmacy: "Pharmacy · " + base,
      doctors: "Our doctors · " + base,
      about: "About us · " + base,
      visit: "Visit us · " + base
    };
    return map[route] || base;
  }
  window.addEventListener("hashchange", render);

  /* ---------------- Status pill ---------------- */
  function renderStatus(){
    const {open, ist} = window.pharmacyOpenState();
    const pill = document.getElementById("statusPill");
    const dot = document.getElementById("statusDot");
    const txt = document.getElementById("statusText");
    const live = document.getElementById("liveStatus");
    if(!pill || !txt) return;
    pill.classList.toggle("open", open);
    pill.classList.toggle("closed", !open);
    txt.textContent = open ? window.t("status.open") : window.t("status.closed");
    if(live){
      live.classList.toggle("closed", !open);
      const hh = String(ist.getHours()).padStart(2,"0");
      const mm = String(ist.getMinutes()).padStart(2,"0");
      live.textContent = (open ? "● " : "○ ") + txt.textContent + ` · IST ${hh}:${mm}`;
    }
  }
  setInterval(renderStatus, 30000);

  /* ---------------- Today strip on home ---------------- */
  function renderToday(){
    const grid = document.getElementById("todayGrid");
    if(!grid) return;
    const lang = document.documentElement.getAttribute("data-lang") || "en";
    const sitting = window.DOCTORS.filter(window.isSittingToday);
    if(!sitting.length){
      grid.innerHTML = `<div class="today-empty">${window.t("today.none","No doctor scheduled today.")}</div>`;
      return;
    }
    grid.innerHTML = sitting.map(d => `
      <article class="doc-card tilt reveal" data-id="${d.id}">
        <span class="doc-tag">${window.t("today.badge","Today")}</span>
        <div class="doc-avatar">${d.initials}</div>
        <h3 class="doc-name">${d.name[lang]}</h3>
        <p class="doc-spec">${d.spec[lang]}</p>
        <div class="doc-time">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          ${d.time[lang]}
        </div>
        <div class="doc-actions">
          <button class="btn btn-primary" data-act="details" data-id="${d.id}">${window.t("dr.details","Details")}</button>
          <a class="btn btn-ghost" href="tel:${PHONE_TEL}">${window.t("dr.call","Call")}</a>
        </div>
      </article>
    `).join("");
    bindCardEvents(grid);
  }

  /* ---------------- Doctors page ---------------- */
  let docFilter = "all";
  let docQuery = "";
  function renderDoctors(){
    const grid = document.getElementById("docGrid");
    if(!grid) return;
    const lang = document.documentElement.getAttribute("data-lang") || "en";
    const q = docQuery.trim().toLowerCase();

    const list = window.DOCTORS.filter(d=>{
      // filter chip
      if(docFilter === "today" && !window.isSittingToday(d)) return false;
      if(docFilter !== "all" && docFilter !== "today" && d.category !== docFilter) return false;
      // search
      if(!q) return true;
      const hay = [d.name.en, d.name.hi, d.spec.en, d.spec.hi, d.category].join(" ").toLowerCase();
      return hay.includes(q);
    });

    if(!list.length){
      grid.innerHTML = `<div class="today-empty" style="grid-column:1/-1">${window.t("dr.empty","No doctors match your search.")}</div>`;
      return;
    }

    grid.innerHTML = list.map(d=>{
      const sitting = window.isSittingToday(d);
      return `
      <article class="doc-card tilt reveal" data-id="${d.id}">
        ${sitting ? `<span class="doc-tag">${window.t("today.badge","Today")}</span>` : ""}
        <div class="doc-avatar">${d.initials}</div>
        <h3 class="doc-name">${d.name[lang]}</h3>
        <p class="doc-spec">${d.spec[lang]}</p>
        <div class="doc-time">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          ${d.time[lang]}
        </div>
        <div class="doc-actions">
          <button class="btn btn-primary" data-act="details" data-id="${d.id}">${window.t("dr.details","Details")}</button>
          <a class="btn btn-wa" target="_blank" rel="noopener"
             href="https://wa.me/${PHONE_WA}?text=${encodeURIComponent(
               (lang==="hi" ? "नमस्ते, मुझे " : "Hi, I want to consult ") + d.name.en +
               (lang==="hi" ? " से परामर्श करना है। कृपया समय बताएँ।" : ". Please share the timing.")
             )}">WhatsApp</a>
          <a class="btn btn-ghost" href="tel:${PHONE_TEL}">${window.t("dr.call","Call")}</a>
        </div>
      </article>`;
    }).join("");
    bindCardEvents(grid);
    window.initAnimations();
  }

  function bindCardEvents(scope){
    scope.querySelectorAll("[data-act='details']").forEach(b=>{
      b.addEventListener("click", ()=>openDocModal(b.getAttribute("data-id")));
    });
  }

  /* ---------------- Doctor modal ---------------- */
  const modal = document.getElementById("docModal");
  const modalBody = document.getElementById("modalBody");
  const modalClose = document.getElementById("modalClose");
  function openDocModal(id){
    const d = window.DOCTORS.find(x=>x.id === id);
    if(!d) return;
    const lang = document.documentElement.getAttribute("data-lang") || "en";
    const daysText = d.days === null
      ? (lang === "hi" ? "प्रतिदिन" : "Every day")
      : (d.days.length === 0
          ? (lang === "hi" ? "कोई निश्चित दिन नहीं — कॉल करें" : "No fixed day — please call")
          : d.days.map(n => window.DAY_NAMES[lang][n]).join(", "));

    modalBody.innerHTML = `
      <h3>${d.name[lang]}</h3>
      <p class="m-spec">${d.spec[lang]}</p>
      <div class="modal-row"><span>${window.t("dr.spec","Specialty")}</span><span>${d.spec[lang]}</span></div>
      <div class="modal-row"><span>${window.t("dr.sits","Sitting days")}</span><span>${daysText}</span></div>
      <div class="modal-row"><span>${window.t("dr.time","Timing")}</span><span>${d.time[lang]}</span></div>
      <p style="margin-top:14px;color:var(--ink-2);line-height:1.65;font-size:14.5px">${d.about[lang]}</p>
      <div class="modal-actions">
        <a class="btn btn-primary" href="tel:${PHONE_TEL}">${window.t("dr.call","Call")}</a>
        <a class="btn btn-wa" target="_blank" rel="noopener"
           href="https://wa.me/${PHONE_WA}?text=${encodeURIComponent(
             (lang==="hi" ? "नमस्ते, मुझे " : "Hi, I want to consult ") + d.name.en +
             (lang==="hi" ? " से परामर्श करना है।" : ". Please share the timing.")
           )}">WhatsApp</a>
        <a class="btn btn-ghost" target="_blank" rel="noopener"
           href="https://www.google.com/maps/search/?api=1&query=Singhal+Medicare+Station+Road+Shikohabad">${window.t("vs.maps","Open in Google Maps")}</a>
      </div>
    `;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeDocModal(){
    modal.hidden = true;
    document.body.style.overflow = "";
  }
  if(modalClose) modalClose.addEventListener("click", closeDocModal);
  if(modal) modal.addEventListener("click", (e)=>{ if(e.target === modal) closeDocModal(); });
  document.addEventListener("keydown", (e)=>{ if(e.key === "Escape" && !modal.hidden) closeDocModal(); });

  /* ---------------- Filters + search ---------------- */
  document.querySelectorAll(".chip").forEach(c=>{
    c.addEventListener("click", ()=>{
      document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
      c.classList.add("active");
      docFilter = c.getAttribute("data-filter");
      renderDoctors();
    });
  });
  const search = document.getElementById("docSearch");
  if(search){
    search.addEventListener("input", (e)=>{ docQuery = e.target.value; renderDoctors(); });
  }

  /* ---------------- Medicine form ---------------- */
  const medForm = document.getElementById("medForm");
  if(medForm){
    medForm.addEventListener("submit", (e)=>{
      e.preventDefault();
      const v = document.getElementById("medName").value;
      window.openWhatsAppForMedicine(v);
    });
  }

  /* ---------------- Copy address ---------------- */
  const copyBtn = document.getElementById("copyAddr");
  if(copyBtn) copyBtn.addEventListener("click", window.copyAddress);

  /* ---------------- Language toggle ---------------- */
  const langBtn = document.getElementById("langToggle");
  if(langBtn){
    langBtn.addEventListener("click", ()=>{
      const cur = document.documentElement.getAttribute("data-lang") || "en";
      window.setLang(cur === "en" ? "hi" : "en");
    });
  }

  /* ---------------- Hamburger ---------------- */
  const hb = document.getElementById("hamburger");
  const nl = document.getElementById("navLinks");
  if(hb && nl){
    hb.addEventListener("click", ()=>{
      const open = nl.classList.toggle("open");
      hb.classList.toggle("open", open);
      hb.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------------- Refresh dynamic bits on language change ---------------- */
  window.refreshDynamic = function(){
    renderStatus();
    const route = currentRoute();
    if(route === "doctors") renderDoctors();
    if(route === "home") renderToday();
  };

  /* ---------------- Init ---------------- */
  document.getElementById("year").textContent = new Date().getFullYear();
  const saved = localStorage.getItem("sm-lang") || "en";
  window.setLang(saved);
  renderStatus();
  render();
})();
