/* =========================================================
   LOADING SCREEN (5s)
   ========================================================= */
const loadingScreen = document.getElementById("loading-screen");
const homeScreen = document.getElementById("home-screen");
const progressBar = document.querySelector(".loading-progress");

let progress = 0;

// Barre de chargement sur 5s (100 pas * 50ms = 5000ms)
const loadingInterval = setInterval(() => {
  progress += 1;
  if (progressBar) progressBar.style.width = progress + "%";
  if (progress >= 100) clearInterval(loadingInterval);
}, 50);

// Après 5 secondes → accueil
setTimeout(() => {
  if (loadingScreen) loadingScreen.classList.remove("active");
  if (homeScreen) homeScreen.classList.add("active");
}, 5000);

/* =========================================================
   POPUPS + CAROUSEL (ABOUT + RECO + PROJECTS)
   ========================================================= */
let aboutPopup, recoPopup, projectsPopup;
let btnAbout, btnReco, btnProjects;

let recoIndex = 0;
let recoSlides = [];
let recoArrowLeft, recoArrowRight;
let recoCarouselBound = false; // ✅ évite d’empiler des listeners

let projectsTabsBound = false;

// Viewer image (lightbox)
let imgViewer, imgViewerImg, imgViewerClose;
let imgViewerBound = false;

// Burn-in dynamique (par popup)
function addBurnInFor(popupEl) {
  const crtBox = popupEl?.querySelector(".crt-popup");
  if (!crtBox) return;

  // évite l’empilement si spam click
  crtBox.querySelectorAll(".burn").forEach(b => b.remove());

  const burn = document.createElement("div");
  burn.className = "burn";
  crtBox.appendChild(burn);

  setTimeout(() => burn.remove(), 3000);
}

// Ouvrir / fermer génériques (glitch open/close)
function openPopup(popupEl) {
  if (!popupEl) return;

  popupEl.classList.remove("hidden");
  popupEl.classList.remove("glitch-close");
  popupEl.classList.add("glitch-open");

  playCrtSound();
  addBurnInFor(popupEl);

  // ✅ si on ouvre la popup reco, on s’assure que le carrousel est prêt
  if (popupEl === recoPopup) {
    initRecoCarousel(); // safe (ne rebinde pas les events)
  }

  // ✅ si on ouvre la popup projets, on prépare les onglets
  if (popupEl === projectsPopup) {
    initProjectsTabs();
  }

  setTimeout(() => popupEl.classList.remove("glitch-open"), 400);
}

function closePopup(popupEl) {
  if (!popupEl) return;

  popupEl.classList.add("glitch-close");
  setTimeout(() => {
    popupEl.classList.add("hidden");
    popupEl.classList.remove("glitch-close");
  }, 300);
}

/* =========================================================
   IMAGE VIEWER (LIGHTBOX)
   ========================================================= */
function openImageViewer(src, altText = "") {
  if (!imgViewer || !imgViewerImg) return;
  imgViewerImg.src = src;
  imgViewerImg.alt = altText;
  imgViewer.classList.remove("hidden");
  imgViewer.setAttribute("aria-hidden", "false");
  playCrtSound?.();
}

function closeImageViewer() {
  if (!imgViewer || !imgViewerImg) return;
  imgViewer.classList.add("hidden");
  imgViewer.setAttribute("aria-hidden", "true");
  // évite de garder l'image en mémoire/affichée
  imgViewerImg.src = "";
  imgViewerImg.alt = "";
}

/* -------- CAROUSEL RECO --------
   Compatible avec :
   - article.letter (recommandé)
   - p.carousel-text (ton HTML actuel)
--------------------------------- */
function initRecoCarousel() {
  if (!recoPopup) return;

  // Supporte les 2 formats
  const letterSlides = Array.from(recoPopup.querySelectorAll(".letter"));
  const pSlides = Array.from(recoPopup.querySelectorAll(".carousel-text"));
  recoSlides = letterSlides.length ? letterSlides : pSlides;

  recoArrowLeft = recoPopup.querySelector(".arrow.left");
  recoArrowRight = recoPopup.querySelector(".arrow.right");

  if (!recoSlides.length || !recoArrowLeft || !recoArrowRight) return;

  // ✅ Assure qu'il y a une slide active (sinon on met la 1ère)
  const activeIdx = recoSlides.findIndex(s => s.classList.contains("active"));
  recoIndex = activeIdx >= 0 ? activeIdx : 0;

  recoSlides.forEach((s, i) => s.classList.toggle("active", i === recoIndex));

  // ✅ Bind une seule fois (évite multi-click qui saute 2/3 lettres)
  if (!recoCarouselBound) {
    recoArrowLeft.addEventListener("click", () => shiftReco(-1));
    recoArrowRight.addEventListener("click", () => shiftReco(1));
    recoCarouselBound = true;
  }
}

function showReco(i) {
  if (!recoSlides.length) return;

  recoSlides.forEach(s => s.classList.remove("active"));
  recoIndex = (i + recoSlides.length) % recoSlides.length;
  recoSlides[recoIndex].classList.add("active");
}

function shiftReco(delta) {
  showReco(recoIndex + delta);
}

/* =========================================================
   POPUP PROJETS (ONGLETS TYPE 'CLASSEUR')
   ========================================================= */
function initProjectsTabs() {
  if (!projectsPopup) return;

  const tabs = Array.from(projectsPopup.querySelectorAll(".proj-tab"));
  const panels = Array.from(projectsPopup.querySelectorAll(".proj-panel"));
  if (!tabs.length || !panels.length) return;

  // met une tab active si aucune (fallback)
  const anyActive = tabs.some(t => t.classList.contains("active"));
  if (!anyActive) {
    tabs[0].classList.add("active");
    tabs[0].setAttribute("aria-selected", "true");
    const target = tabs[0].dataset.target;
    panels.forEach(p => p.classList.toggle("active", p.id === target));
  }

  // ✅ bind une seule fois
  if (!projectsTabsBound) {
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.target;

        tabs.forEach(t => {
          const isActive = t === tab;
          t.classList.toggle("active", isActive);
          t.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        panels.forEach(p => p.classList.toggle("active", p.id === target));

        playCrtSound?.();
        addBurnInFor(projectsPopup);
      });
    });
    projectsTabsBound = true;
  }
}

/* =========================================================
   CRT CANVAS NOISE (neige)
   ========================================================= */
const main = document.querySelector("main");
const canvas = document.getElementById("canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

function setCanvasSize() {
  if (!canvas) return;

  // ✅ plein écran + DPR pour une échelle correcte
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function snow(ctx) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const d = ctx.createImageData(w, h);
  const b = new Uint32Array(d.data.buffer);
  const len = b.length;

  for (let i = 0; i < len; i++) {
    b[i] = ((255 * Math.random()) | 0) << 24;
  }
  ctx.putImageData(d, 0, 0);
}

let frame;
function animate() {
  if (!ctx) return;
  snow(ctx);
  frame = requestAnimationFrame(animate);
}

/* =========================================================
   INIT DOM
   ========================================================= */
window.addEventListener("DOMContentLoaded", () => {
  // Boutons accueil
  btnAbout = document.getElementById("btn-about");
  btnReco = document.getElementById("btn-contact"); // Mes recommandations
  btnProjects = document.getElementById("btn-projects"); // Mes projets

  // Popups
  aboutPopup = document.getElementById("about-popup");
  recoPopup = document.getElementById("reco-popup");
  projectsPopup = document.getElementById("projects-popup");

  // Viewer image (lightbox)
  imgViewer = document.getElementById("img-viewer");
  imgViewerImg = document.getElementById("img-viewer-img");
  imgViewerClose = document.querySelector(".img-viewer-close");

  if (!imgViewerBound && imgViewer) {
    // Clic sur image projet -> open
    if (projectsPopup) {
      projectsPopup.addEventListener("click", (e) => {
        const img = e.target && e.target.closest ? e.target.closest(".proj-gallery img") : null;
        if (!img) return;
        openImageViewer(img.getAttribute("src"), img.getAttribute("alt") || "");
      });
    }

    // Bouton X
    if (imgViewerClose) {
      imgViewerClose.addEventListener("click", closeImageViewer);
    }

    // Clic sur le fond (en dehors de l'image) -> close
    imgViewer.addEventListener("click", (e) => {
      const inner = e.target && e.target.closest ? e.target.closest(".img-viewer-inner") : null;
      if (!inner) closeImageViewer();
    });

    imgViewerBound = true;
  }

  // Ouvrir about
  if (btnAbout && aboutPopup) {
    btnAbout.addEventListener("click", () => openPopup(aboutPopup));
    // makePopupDraggable(aboutPopup); // ❌ drag désactivé
  }

  // Ouvrir reco
  if (btnReco && recoPopup) {
    btnReco.addEventListener("click", () => openPopup(recoPopup));
    // makePopupDraggable(recoPopup); // ❌ drag désactivé
  }

  // Ouvrir projets
  if (btnProjects && projectsPopup) {
    btnProjects.addEventListener("click", () => openPopup(projectsPopup));
  }

  // Boutons fermer : UN par popup (important)
  document.querySelectorAll(".popup").forEach(p => {
    const x = p.querySelector(".close-btn");
    if (x) x.addEventListener("click", () => closePopup(p));
  });

  // Init carrousel reco (bind flèches 1 seule fois)
  initRecoCarousel();

  // Init tabs projets (safe)
  initProjectsTabs();

  // Init canvas
  setCanvasSize();
  window.addEventListener("resize", setCanvasSize);

  // Init CRT power-on (si tu utilises ces classes en CSS)
  if (main) {
    setTimeout(() => {
      main.classList.remove("off");
      main.classList.add("power-on");

      setTimeout(() => {
        main.classList.remove("power-on");
        main.classList.add("on");
        animate(); // démarre la neige
      }, 900);
    }, 500);
  }
});

/* =========================================================
   KEYBOARD
   ========================================================= */
window.addEventListener("keydown", (e) => {
  // ESC ferme le popup ouvert
  if (e.key === "Escape") {
    if (projectsPopup && !projectsPopup.classList.contains("hidden")) return closePopup(projectsPopup);
    if (recoPopup && !recoPopup.classList.contains("hidden")) return closePopup(recoPopup);
    if (aboutPopup && !aboutPopup.classList.contains("hidden")) return closePopup(aboutPopup);
  }

  // Si reco ouvert : flèches pour carrousel
  if (recoPopup && !recoPopup.classList.contains("hidden")) {
    if (e.key === "ArrowLeft") { e.preventDefault(); shiftReco(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); shiftReco(1); }
  }
});
