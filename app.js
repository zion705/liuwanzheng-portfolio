const canvas = document.querySelector("#scene");
const ctx = canvas.getContext("2d");
const pointer = { x: 0.5, y: 0.45 };
let width = 0;
let height = 0;
let dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawScene(time) {
  ctx.clearRect(0, 0, width, height);
  const cell = width < 720 ? 11 : 14;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const cx = width * pointer.x;
  const cy = height * pointer.y;

  ctx.font = `${Math.max(9, cell - 3)}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const px = x * cell + cell * 0.5;
      const py = y * cell + cell * 0.5;
      const nx = (px / width - 0.5) * 2;
      const ny = (py / height - 0.5) * 2;
      const wave =
        Math.sin(nx * 8 + time * 0.0012) +
        Math.cos(ny * 7 - time * 0.001) +
        Math.sin((nx + ny) * 6 + time * 0.0008);
      const cursor = Math.max(0, 1 - Math.hypot(px - cx, py - cy) / 260);
      const mask = Math.max(0, 1 - Math.hypot(nx * 0.94, ny * 1.32));
      const alpha = Math.max(0, (wave * 0.18 + cursor * 0.9 + mask * 0.5) - 0.34);
      if (alpha <= 0.03) continue;

      const glyphs = "·:+=*#%@";
      const index = Math.min(glyphs.length - 1, Math.floor(alpha * glyphs.length));
      const hue = 235 + wave * 18 + cursor * 46;
      ctx.fillStyle = `hsla(${hue}, 95%, ${64 + cursor * 16}%, ${Math.min(alpha, 0.92)})`;
      ctx.fillText(glyphs[index], px, py);
    }
  }

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 280);
  grad.addColorStop(0, "rgba(143, 156, 255, 0.15)");
  grad.addColorStop(1, "rgba(143, 156, 255, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  requestAnimationFrame(drawScene);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX / window.innerWidth;
  pointer.y = event.clientY / window.innerHeight;
  const cursor = document.querySelector("#cursorDot");
  if (cursor) {
    cursor.style.opacity = "1";
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
  }
});
resize();
requestAnimationFrame(drawScene);

const articles = document.querySelector(".articles");
const groups = [...document.querySelectorAll("[data-year-group]")];
groups.forEach((group) => {
  group.addEventListener("pointerenter", () => {
    articles.dataset.hovering = "";
    groups.forEach((item) => item.toggleAttribute("data-active", item === group));
  });
  group.addEventListener("pointerleave", () => {
    articles.removeAttribute("data-hovering");
    groups.forEach((item) => item.removeAttribute("data-active"));
  });
});

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789产品评测原型";
function scrambleText(element) {
  const original = element.dataset.original || element.textContent;
  element.dataset.original = original;
  let frame = 0;
  const max = 13;
  clearInterval(element._scrambleTimer);
  element._scrambleTimer = setInterval(() => {
    element.textContent = original
      .split("")
      .map((char, index) => {
        if (char === " " || index < frame / 1.65) return char;
        return alphabet[Math.floor(Math.random() * alphabet.length)];
      })
      .join("");
    frame += 1;
    if (frame > max) {
      clearInterval(element._scrambleTimer);
      element.textContent = original;
    }
  }, 22);
}

document.querySelectorAll(".article-link").forEach((link) => {
  link.addEventListener("pointerenter", () => {
    const title = link.querySelector("[data-scramble]");
    if (title) scrambleText(title);
  });
});

const controls = [...document.querySelectorAll("[data-control]")];
const scoreEl = document.querySelector("#score");
const moodEl = document.querySelector("#mood");
function updateTuner() {
  const values = Object.fromEntries(controls.map((control) => [control.dataset.control, Number(control.value)]));
  const score = Math.round(values.visibility * 0.42 + values.recovery * 0.42 + (100 - values.interrupt) * 0.16);
  scoreEl.textContent = score;
  document.documentElement.style.setProperty("--glow", 28 + values.visibility * 0.72);
  if (score > 82) moodEl.textContent = "Calm, visible, recoverable";
  else if (values.interrupt > 64) moodEl.textContent = "Too noisy";
  else if (values.visibility < 46) moodEl.textContent = "Invisible work";
  else moodEl.textContent = "Needs clearer recovery";
}
controls.forEach((control) => control.addEventListener("input", updateTuner));
updateTuner();

const command = document.querySelector("#command");
const commandInput = document.querySelector("#commandInput");
function openCommand() {
  command.showModal();
  requestAnimationFrame(() => commandInput.focus());
}
document.querySelector("#openCommand").addEventListener("click", openCommand);
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCommand();
  }
  if (event.key === "Escape" && command.open) command.close();
});
command.addEventListener("click", (event) => {
  if (event.target === command || event.target.tagName === "A") command.close();
});
commandInput.addEventListener("input", () => {
  const query = commandInput.value.trim().toLowerCase();
  document.querySelectorAll(".command a").forEach((link) => {
    link.hidden = query && !link.textContent.toLowerCase().includes(query);
  });
});

function tickClock() {
  document.querySelector("#clock").textContent = new Date().toLocaleTimeString("zh-CN", {
    hour12: false,
  });
}
tickClock();
setInterval(tickClock, 1000);
