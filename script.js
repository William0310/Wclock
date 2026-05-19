const timeElement = document.getElementById("time");
const dateElement = document.getElementById("date");
const rainElement = document.getElementById("rain");
const cardElement = document.querySelector(".clock-card");
const themeToggleButton = document.getElementById("theme-toggle");
const themeToggleText = document.getElementById("theme-toggle-text");
const rainRange = document.getElementById("rain-range");
const rainValue = document.getElementById("rain-value");
const fullscreenToggleButton = document.getElementById("fullscreen-toggle");
const fullscreenToggleText = document.getElementById("fullscreen-toggle-text");
const infoToggleButton = document.getElementById("info-toggle");
const controlInfoPanel = document.getElementById("control-info");
const THEME_STORAGE_KEY = "wclock-theme";
const DEFAULT_DROP_COUNT = Number(rainRange.value);

function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return "dark";
}

function applyTheme(theme) {
  const isDark = theme === "dark";

  document.documentElement.dataset.theme = theme;
  themeToggleButton.setAttribute("aria-pressed", String(isDark));
  themeToggleText.textContent = isDark ? "Dark Mode" : "Light Mode";
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";

  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
}

applyTheme(getPreferredTheme());
themeToggleButton.addEventListener("click", toggleTheme);

function updateClock() {
  const now = new Date();

  timeElement.textContent = now.toLocaleTimeString("zh-CN", {
    hour12: false,
  });

  dateElement.textContent = now.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

updateClock();
setInterval(updateClock, 1000);

const drops = [];
const splashes = [];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createDrop() {
  const element = document.createElement("span");
  const streak = document.createElement("span");
  const height = randomBetween(56, 128);
  const angle = randomBetween(-18, -12);
  const speedY = randomBetween(190, 290);

  element.className = "raindrop";
  streak.className = "raindrop-streak";
  element.style.setProperty("--drop-height", `${height}px`);
  element.style.setProperty("--drop-angle", `${angle}deg`);
  element.appendChild(streak);
  rainElement.appendChild(element);

  return {
    element,
    height,
    angle,
    speedY,
    speedX: Math.tan((angle * Math.PI) / 180) * speedY,
    x: 0,
    y: 0,
  };
}

function resetDrop(drop, spawnBelowTop = false) {
  drop.height = randomBetween(56, 128);
  drop.angle = randomBetween(0, 0);
  drop.speedY = randomBetween(190, 290);
  drop.speedX = Math.tan((drop.angle * Math.PI) / 180) * drop.speedY;
  drop.x = randomBetween(0, window.innerWidth * 1.2);
  drop.y = spawnBelowTop ? randomBetween(-120, window.innerHeight) : randomBetween(-220, -40);
  drop.element.style.setProperty("--drop-height", `${drop.height}px`);
  drop.element.style.setProperty("--drop-angle", `${drop.angle}deg`);
}

function createSplash(x, y) {
  const particleCount = 4;

  for (let i = 0; i < particleCount; i += 1) {
    const element = document.createElement("span");
    const angle = randomBetween(-2.5, -0.65);
    const speed = randomBetween(30, 72);

    element.className = "splash";
    rainElement.appendChild(element);

    splashes.push({
      element,
      x,
      y,
      vx: Math.cos(angle) * speed * (i % 2 === 0 ? -1 : 1) * 0.55,
      vy: Math.sin(angle) * speed,
      life: randomBetween(0.32, 0.5),
      age: 0,
      size: randomBetween(3, 6),
    });
  }
}

function syncDropCount(targetCount) {
  while (drops.length < targetCount) {
    const drop = createDrop();
    resetDrop(drop, true);
    renderDrop(drop);
    drops.push(drop);
  }

  while (drops.length > targetCount) {
    const drop = drops.pop();
    drop.element.remove();
  }
}

function setRainAmount(nextCount) {
  rainRange.value = String(nextCount);
  rainValue.textContent = String(nextCount);
  syncDropCount(nextCount);
}

function updateFullscreenButton() {
  const isFullscreen = Boolean(document.fullscreenElement);

  fullscreenToggleButton.setAttribute("aria-pressed", String(isFullscreen));
  fullscreenToggleText.textContent = isFullscreen ? "Exit Full" : "Fullscreen";
}

async function toggleFullscreen() {
  if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
    return;
  }

  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }

  try {
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  } catch (error) {
    await document.documentElement.requestFullscreen();
  }
}

function toggleInfoPanel() {
  const willOpen = controlInfoPanel.hidden;

  controlInfoPanel.hidden = !willOpen;
  infoToggleButton.setAttribute("aria-expanded", String(willOpen));
}

function renderDrop(drop) {
  drop.element.style.transform = `translate3d(${drop.x}px, ${drop.y}px, 0)`;
}

function renderSplash(splash) {
  splash.element.style.width = `${splash.size}px`;
  splash.element.style.height = `${splash.size}px`;
  splash.element.style.opacity = `${Math.max(0, 1 - splash.age / splash.life) * 0.75}`;
  splash.element.style.transform = `translate3d(${splash.x}px, ${splash.y}px, 0)`;
}

function animateRain() {
  let lastTime = performance.now();

  function frame(now) {
    const delta = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;
    const cardRect = cardElement.getBoundingClientRect();

    for (const drop of drops) {
      drop.x += drop.speedX * delta;
      drop.y += drop.speedY * delta;
      const tipX = drop.x + 8 + Math.tan((drop.angle * Math.PI) / 180) * drop.height;
      const tipY = drop.y + drop.height;

      const hitCardTop =
        tipX >= cardRect.left &&
        tipX <= cardRect.right &&
        tipY >= cardRect.top &&
        tipY <= cardRect.top + 18;

      if (hitCardTop) {
        createSplash(tipX, cardRect.top - 4);
        resetDrop(drop, false);
      } else if (drop.y > window.innerHeight + 40 || tipX < -100) {
        resetDrop(drop, false);
      }

      renderDrop(drop);
    }

    for (let i = splashes.length - 1; i >= 0; i -= 1) {
      const splash = splashes[i];
      splash.age += delta;
      splash.x += splash.vx * delta;
      splash.y += splash.vy * delta;
      splash.vy += 180 * delta;

      if (splash.age >= splash.life) {
        splash.element.remove();
        splashes.splice(i, 1);
        continue;
      }

      renderSplash(splash);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

window.addEventListener("resize", () => {
  for (const drop of drops) {
    resetDrop(drop, true);
    renderDrop(drop);
  }
});

rainRange.addEventListener("input", (event) => {
  setRainAmount(Number(event.target.value));
});

if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
  fullscreenToggleButton.hidden = true;
} else {
  updateFullscreenButton();
  fullscreenToggleButton.addEventListener("click", () => {
    toggleFullscreen().catch(() => {});
  });
  document.addEventListener("fullscreenchange", updateFullscreenButton);
}

infoToggleButton.addEventListener("click", toggleInfoPanel);

setRainAmount(DEFAULT_DROP_COUNT);
animateRain();
