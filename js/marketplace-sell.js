// OfficeStation Marketplace consignment form. Photos are resized in the browser to 1600px JPEG
// (which also drops EXIF, including GPS) before upload, so a phone photo is ~300 KB, not 5 MB.
const MAX = 10;
const API = /netlify\.app$/.test(location.hostname) ? "/.netlify/functions/marketplace" : "https://officestation.netlify.app/.netlify/functions/marketplace";

export function shrink(file, edge = 1600, q = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, edge / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", q));
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unreadable image")); };
    im.src = url;
  });
}

const form = document.getElementById("sellForm");
if (form) {
  const input = document.getElementById("sf-photos");
  const box = document.getElementById("sf-previews");
  const status = form.querySelector(".form-status");
  const btn = form.querySelector('button[type="submit"]');
  let photos = [];
  const show = (cls, msg) => { status.hidden = false; status.className = "form-status " + cls; status.textContent = msg; };
  const draw = () => {
    box.innerHTML = "";
    photos.forEach((src, i) => {
      const d = document.createElement("div");
      d.className = "mp-prev";
      d.innerHTML = `<img alt="Photo ${i + 1}"><button type="button" aria-label="Remove photo ${i + 1}">&times;</button>`;
      d.querySelector("img").src = src;
      d.querySelector("button").addEventListener("click", () => { photos.splice(i, 1); draw(); });
      box.appendChild(d);
    });
  };
  input.addEventListener("change", async () => {
    const files = [...input.files].slice(0, MAX - photos.length);
    for (const f of files) { try { photos.push(await shrink(f)); } catch {} }
    input.value = "";
    if (photos.length >= MAX) show("err", `Up to ${MAX} photos. Send more by reply after we get in touch.`);
    draw();
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = v; });
    if (!String(data.name || "").trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email || "").trim())) { show("err", "Please add your name and a valid email."); return; }
    if (data.consent !== "yes") { show("err", "Please confirm you're authorized to consign this furniture."); return; }
    data.action = "submit"; data.photos = photos; data.page = location.pathname;
    btn.disabled = true; show("ok", photos.length ? `Uploading ${photos.length} photo${photos.length === 1 ? "" : "s"}…` : "Sending…");
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Request failed");
      form.reset(); photos = []; draw();
      show("ok", "Thank you. We received your furniture details and will contact you within one business day with pricing and consignment terms.");
    } catch (err) {
      show("err", err.message && err.message !== "Request failed" ? err.message : "Something went wrong sending that. Please try again in a moment.");
    } finally { btn.disabled = false; }
  });
}
