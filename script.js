/* Открытка: сценарий показа новости */

const heroScene    = document.getElementById("scene-hero");
const scrollHint   = document.getElementById("scroll-hint");
const teaserScene  = document.getElementById("scene-teaser");
const teaserInner  = document.querySelector(".teaser-inner");
const btnNews      = document.getElementById("btn-news");

const storkStage   = document.getElementById("stork-stage");
const storkVideo   = document.getElementById("stork-video");
const storkFallback = document.getElementById("stork-fallback");
const bundle       = document.getElementById("bundle");
const catchRow     = document.getElementById("catch-row");
const skipBtn      = document.getElementById("skip-btn");

const flash        = document.getElementById("flash");
const finalScene   = document.getElementById("scene-final");
const btnReplay    = document.getElementById("btn-replay");
const fireworksCanvas = document.getElementById("fireworks");

let fallbackTimers = [];
let finaleStarted = false;

/* ---------- сцена 1: запуск анимации фото ---------- */

window.addEventListener("load", () => {
  heroScene.classList.add("photos-ready");
});

scrollHint.addEventListener("click", () => {
  teaserScene.scrollIntoView({ behavior: "smooth" });
});

/* ---------- сцена 2: появление при скролле ---------- */

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) teaserInner.classList.add("visible");
    });
  },
  { threshold: 0.35 }
);
observer.observe(teaserInner);

/* ---------- сцена 3: видео с аистом ---------- */

btnNews.addEventListener("click", () => {
  finaleStarted = false;
  document.body.classList.add("locked");
  storkStage.hidden = false;

  // Главное — играем видео
  storkStage.classList.add("video-mode");
  try { storkVideo.currentTime = 0; } catch (e) {}

  // После окончания видео — вспышка и финал
  storkVideo.addEventListener("ended", startFinale, { once: true });
  // Только настоящая ошибка воспроизведения включает запасную анимацию
  storkVideo.addEventListener("error", runFallbackAnimation, { once: true });

  const playAttempt = storkVideo.play();
  if (playAttempt && playAttempt.catch) {
    playAttempt.catch(() => {
      // Если браузер не дал играть со звуком — пробуем без звука
      storkVideo.muted = true;
      storkVideo.play().catch(() => runFallbackAnimation());
    });
  }
});

function runFallbackAnimation() {
  if (finaleStarted) return;
  storkStage.classList.remove("video-mode");
  storkVideo.pause();
  storkFallback.hidden = false;

  // перезапуск CSS-анимаций
  storkStage.classList.remove("playing");
  void storkStage.offsetWidth;
  storkStage.classList.add("playing");

  // аист долетает до центра → узелок отцепляется и падает
  fallbackTimers.push(setTimeout(() => {
    storkFallback.appendChild(bundle);
    bundle.classList.add("dropped");
  }, 2900));

  // корзинку поймали
  fallbackTimers.push(setTimeout(() => {
    catchRow.classList.add("caught");
  }, 4400));

  // пауза на радость — и финал
  fallbackTimers.push(setTimeout(startFinale, 5600));
}

skipBtn.addEventListener("click", startFinale);

/* ---------- вспышка и финал ---------- */

function startFinale() {
  if (finaleStarted) return;
  finaleStarted = true;

  fallbackTimers.forEach(clearTimeout);
  fallbackTimers = [];
  storkVideo.pause();

  flash.hidden = false;
  flash.classList.remove("active");
  void flash.offsetWidth;
  flash.classList.add("active");

  // на пике вспышки подменяем сцену
  setTimeout(() => {
    storkStage.hidden = true;
    storkStage.classList.remove("playing", "video-mode");
    finalScene.hidden = false;
    finalScene.classList.add("shown");
    startFireworks();
  }, 900);

  setTimeout(() => { flash.hidden = true; }, 2300);
}

/* ---------- повтор ---------- */

btnReplay.addEventListener("click", () => {
  stopFireworks();
  finalScene.classList.remove("shown");
  finalScene.hidden = true;
  storkFallback.hidden = true;
  catchRow.classList.remove("caught");
  bundle.classList.remove("dropped");
  document.getElementById("stork-wrap").appendChild(bundle);
  storkVideo.currentTime = 0;
  document.body.classList.remove("locked");
  finaleStarted = false;

  heroScene.classList.remove("photos-ready");
  window.scrollTo({ top: 0, behavior: "auto" });
  void heroScene.offsetWidth;
  heroScene.classList.add("photos-ready");
});

/* ---------- салют ---------- */

const ctx = fireworksCanvas.getContext("2d");
let fwParticles = [];
let fwRockets = [];
let fwRafId = null;
let fwLaunchTimer = null;

const FW_COLORS = ["#f3c7cf", "#c9a26b", "#dcebf7", "#fff3e6", "#efc3cc", "#ffd98e"];

function resizeCanvas() {
  fireworksCanvas.width = fireworksCanvas.clientWidth * devicePixelRatio;
  fireworksCanvas.height = fireworksCanvas.clientHeight * devicePixelRatio;
}
window.addEventListener("resize", () => {
  if (!finalScene.hidden) resizeCanvas();
});

function launchRocket() {
  const w = fireworksCanvas.width;
  const h = fireworksCanvas.height;
  fwRockets.push({
    x: w * (0.15 + Math.random() * 0.7),
    y: h,
    vx: (Math.random() - 0.5) * 1.5 * devicePixelRatio,
    vy: -(h * 0.012 + Math.random() * h * 0.006),
    targetY: h * (0.15 + Math.random() * 0.3),
    color: FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)],
  });
}

function explode(x, y, color) {
  const count = 60 + Math.floor(Math.random() * 40);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
    const speed = (1 + Math.random() * 3.2) * devicePixelRatio;
    fwParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.008 + Math.random() * 0.012,
      color,
    });
  }
}

function fwFrame() {
  ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

  fwRockets = fwRockets.filter((r) => {
    r.x += r.vx;
    r.y += r.vy;
    r.vy += 0.06 * devicePixelRatio;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = r.color;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 2.2 * devicePixelRatio, 0, Math.PI * 2);
    ctx.fill();
    if (r.y <= r.targetY || r.vy > 0) {
      explode(r.x, r.y, r.color);
      return false;
    }
    return true;
  });

  fwParticles = fwParticles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.045 * devicePixelRatio;
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.life -= p.decay;
    if (p.life <= 0) return false;
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8 * devicePixelRatio, 0, Math.PI * 2);
    ctx.fill();
    return true;
  });

  ctx.globalAlpha = 1;
  fwRafId = requestAnimationFrame(fwFrame);
}

function startFireworks() {
  resizeCanvas();
  fwParticles = [];
  fwRockets = [];
  launchRocket();
  launchRocket();
  fwLaunchTimer = setInterval(() => {
    if (Math.random() < 0.85) launchRocket();
  }, 750);
  fwRafId = requestAnimationFrame(fwFrame);
}

function stopFireworks() {
  cancelAnimationFrame(fwRafId);
  clearInterval(fwLaunchTimer);
  fwParticles = [];
  fwRockets = [];
  ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
}
