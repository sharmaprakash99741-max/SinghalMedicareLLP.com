/* ============================================================
   Animations — reveal-on-scroll, 3D tilt, count-up
   ============================================================ */
(function(){
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Reveal observer */
  function initReveal(){
    const els = document.querySelectorAll(".reveal:not(.in)");
    if(!els.length) return;
    if(reduce || !("IntersectionObserver" in window)){
      els.forEach(el=>el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, {threshold:.12, rootMargin:"0px 0px -40px 0px"});
    els.forEach(el=>io.observe(el));
  }

  /* 3D tilt */
  function initTilt(){
    if(reduce) return;
    document.querySelectorAll(".tilt").forEach(el=>{
      if(el._tiltBound) return;
      el._tiltBound = true;
      el.addEventListener("mousemove", (e)=>{
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        el.classList.add("tilted");
        el.style.transform = `perspective(900px) rotateY(${px*8}deg) rotateX(${-py*8}deg) translateY(-4px)`;
      });
      el.addEventListener("mouseleave", ()=>{
        el.style.transform = "";
      });
    });
  }

  /* Count-up stats */
  function initCounters(){
    const stats = document.querySelectorAll(".stat");
    if(!stats.length) return;
    const animate = (el)=>{
      const target = parseInt(el.getAttribute("data-count"), 10) || 0;
      const numEl = el.querySelector(".stat-num");
      if(!numEl) return;
      if(reduce){ numEl.textContent = target.toLocaleString(); return; }
      const duration = 1600;
      const start = performance.now();
      function step(now){
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        numEl.textContent = Math.floor(target * eased).toLocaleString();
        if(p < 1) requestAnimationFrame(step);
        else numEl.textContent = target.toLocaleString();
      }
      requestAnimationFrame(step);
    };
    if(!("IntersectionObserver" in window)){ stats.forEach(animate); return; }
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ animate(e.target); io.unobserve(e.target); }
      });
    }, {threshold:.4});
    stats.forEach(s=>io.observe(s));
  }

  /* Header scroll shadow */
  function initHeader(){
    const h = document.getElementById("siteHeader");
    if(!h) return;
    const onScroll = ()=>{
      if(window.scrollY > 8) h.classList.add("scrolled");
      else h.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    onScroll();
  }

  /* Hero parallax on mouse */
  function initHeroParallax(){
    if(reduce) return;
    const hero = document.querySelector(".hero");
    const scene = document.querySelector(".scene");
    if(!hero || !scene) return;
    hero.addEventListener("mousemove", (e)=>{
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      scene.style.transform = `rotateY(${px*14}deg) rotateX(${-py*10}deg)`;
    });
    hero.addEventListener("mouseleave", ()=>{
      scene.style.transform = "";
    });
  }

  window.initAnimations = function(){
    initReveal();
    initTilt();
    initCounters();
    initHeader();
    initHeroParallax();
  };
})();
